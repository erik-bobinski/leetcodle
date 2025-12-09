/**
 * Standalone script to generate daily problems
 * Can be run directly with tsx or called from GitHub Actions
 *
 * Usage: pnpm tsx scripts/generate-problem.ts
 */

import { config } from "dotenv";
// Load environment variables - GitHub Actions will provide these via secrets
if (process.env.NODE_ENV !== "production") {
  config({ path: ".env.local" });
}

// Set flag to indicate we're running as a standalone script
// This tells judge0.ts to call Judge0 directly instead of using Next.js API route
process.env.RUNNING_AS_SCRIPT = "true";

import { db } from "@/drizzle";
import { desc, eq } from "drizzle-orm";
import {
  generatePrerequisiteDataStructure,
  generatePrerequisiteDataStructurePrinting,
  generateProblemDetails,
  generateReferenceSolution,
  generateTestInputsForAllLanguages
} from "@/lib/ai-tooling";
import { tryCatch } from "@/lib/try-catch";
import { generateExpectedOutputs } from "@/lib/judge0";
import { normalizeIndentation } from "@/lib/utils";
import {
  PrerequisiteDataStructuresTable,
  ProblemsTable,
  TemplateArgsTable,
  TemplatesTable,
  TestCasesTable,
  ReferenceSolutionsTable
} from "@/drizzle/schema";

async function main() {
  const startTime = Date.now();
  try {
    console.log("Starting problem generation...");

    // Set active_date to a week from now
    const activeDate = new Date();
    activeDate.setDate(activeDate.getDate() + 7);
    const activeDateString = activeDate.toISOString().split("T")[0];

    // Check if a problem already exists for this active_date to prevent duplicates
    console.log("Checking for existing problem...");
    const { data: existingProblem, error: checkError } = await tryCatch(
      db
        .select({ id: ProblemsTable.id })
        .from(ProblemsTable)
        .where(eq(ProblemsTable.active_date, activeDateString))
        .limit(1)
    );
    if (checkError) {
      console.error(
        `There was an error checking for existing problem: ${checkError.message}`
      );
      process.exit(1);
    }
    if (existingProblem && existingProblem.length > 0) {
      console.log(
        `Problem already exists for active_date ${activeDateString}, skipping insertion`
      );
      process.exit(0);
    }

    console.log("Generating problem details...");
    const problemDetails = await generateProblemDetails();
    if (problemDetails instanceof Error) {
      console.error(
        `There was an error generating problemDetails: ${problemDetails.message}`
      );
      process.exit(1);
    }

    console.log("Generating prerequisite data structures and test inputs...");
    const prerequisiteDataStructure = await generatePrerequisiteDataStructure(
      problemDetails.title,
      problemDetails.description,
      problemDetails.template.functionName,
      problemDetails.template.argNames,
      problemDetails.template.typedArgs,
      problemDetails.template.returnType
    );
    if (prerequisiteDataStructure instanceof Error) {
      console.error(
        `There was an error generating prerequisiteDataStructure: ${prerequisiteDataStructure.message}`
      );
      process.exit(1);
    }

    console.log("Generating reference solutions...");
    const referenceSolution = await generateReferenceSolution(
      problemDetails.description,
      problemDetails.template.functionName,
      problemDetails.template.argNames,
      prerequisiteDataStructure.prerequisiteDataStructure
    );
    if (referenceSolution instanceof Error) {
      console.error(
        `There was an error generating referenceSolution: ${referenceSolution.message}`
      );
      process.exit(1);
    }

    const { data: mostRecentProblemData, error: mostRecentProblemError } =
      await tryCatch(
        db
          .select({ problem_number: ProblemsTable.problem_number })
          .from(ProblemsTable)
          .orderBy(desc(ProblemsTable.problem_number))
          .limit(1)
      );
    if (mostRecentProblemError) {
      console.error(
        `There was an error fetching the most recent problem: ${mostRecentProblemError.message}`
      );
      process.exit(1);
    }
    const mostRecentProblemNumber =
      mostRecentProblemData.length === 0
        ? 0
        : mostRecentProblemData[0].problem_number;

    const prerequisiteDataStructureWithPrinting =
      prerequisiteDataStructure.prerequisiteDataStructure;
    let mergedPrerequisiteDataStructures: Record<string, string> = {};

    if (prerequisiteDataStructureWithPrinting) {
      console.log(
        "Generating custom printing for prerequisite data structures..."
      );
      const completeDataStructures =
        await generatePrerequisiteDataStructurePrinting(
          prerequisiteDataStructureWithPrinting,
          problemDetails.description,
          problemDetails.title,
          problemDetails.template.functionName,
          problemDetails.template.returnType,
          problemDetails.example_input,
          problemDetails.example_output
        );

      if (completeDataStructures instanceof Error) {
        console.error(
          `Error generating print statement: ${completeDataStructures.message}`
        );
        process.exit(1);
      }
      mergedPrerequisiteDataStructures = completeDataStructures;
    }

    const prerequisiteEntries = Object.entries(
      mergedPrerequisiteDataStructures
    ).filter(([, code]) => typeof code === "string" && code.trim().length > 0);

    console.log("Converting test inputs for all languages...");
    const convertedTestInputsResult = await generateTestInputsForAllLanguages(
      prerequisiteDataStructure.testInputs.python,
      prerequisiteDataStructure.prerequisiteDataStructure,
      problemDetails.template.typedArgs
    );
    if (convertedTestInputsResult instanceof Error) {
      console.error(convertedTestInputsResult);
      process.exit(1);
    }
    const convertedTestInputs = convertedTestInputsResult;

    console.log("Generating expected outputs...");
    const expectedOutputs = await generateExpectedOutputs(
      convertedTestInputs,
      referenceSolution,
      problemDetails.template.functionName,
      4,
      problemDetails.template.returnType
    );
    if (expectedOutputs instanceof Error) {
      console.error(expectedOutputs);
      process.exit(1);
    }

    console.log("Starting database transaction...");
    const { error: transactionError } = await tryCatch(
      db.transaction(async (tx) => {
        const { data: problemInsertData, error: problemInsertError } =
          await tryCatch(
            tx
              .insert(ProblemsTable)
              .values({
                problem_number: mostRecentProblemNumber + 1,
                title: problemDetails.title,
                description: problemDetails.description,
                example_input: problemDetails.example_input,
                example_output: problemDetails.example_output,
                active_date: activeDateString
              })
              .returning({ id: ProblemsTable.id })
          );
        if (problemInsertError) {
          throw new Error(
            `Error inserting into ProblemsTable: ${problemInsertError.message}`
          );
        }
        if (!problemInsertData || !problemInsertData[0]) {
          throw new Error("Problem ID came back as undefined");
        }
        const problemId = problemInsertData[0].id;

        if (prerequisiteEntries.length > 0) {
          const { error: prerequisiteDataStructureInsertError } =
            await tryCatch(
              tx.insert(PrerequisiteDataStructuresTable).values(
                prerequisiteEntries.map(([langKey, code]) => ({
                  language: langKey,
                  data_structure_code: normalizeIndentation(code),
                  problem_id: problemId
                }))
              )
            );
          if (prerequisiteDataStructureInsertError) {
            throw new Error(
              `Error inserting prerequisite data structures: ${prerequisiteDataStructureInsertError.message}`
            );
          }
        }

        const { data: templateInsertData, error: templateInsertError } =
          await tryCatch(
            tx
              .insert(TemplatesTable)
              .values({
                problem_id: problemId,
                function_name: problemDetails.template.functionName,
                arg_names: JSON.stringify(problemDetails.template.argNames),
                js_doc_string: problemDetails.template.jsDocString
              })
              .returning({ id: TemplatesTable.id })
          );
        if (templateInsertError) {
          throw new Error(
            `Error inserting into TemplatesTable: ${templateInsertError.message}`
          );
        }
        const templateId = templateInsertData[0].id;

        const templateArgsValues = Object.keys(
          problemDetails.template.typedArgs
        ).map((language) => {
          const typedArgs = problemDetails.template.typedArgs;
          const returnTypes = problemDetails.template.returnType;
          return {
            template_id: templateId,
            language,
            typed_args: JSON.stringify(
              typedArgs[language as keyof typeof typedArgs]
            ),
            return_type: returnTypes[language as keyof typeof returnTypes]
          };
        });
        const { error: templateArgsInsertError } = await tryCatch(
          tx.insert(TemplateArgsTable).values(templateArgsValues)
        );
        if (templateArgsInsertError) {
          throw new Error(
            `Error inserting into TemplateArgsTable: ${templateArgsInsertError.message}`
          );
        }

        const numCases = convertedTestInputs.python.length;
        const testCaseValues = Object.keys(convertedTestInputs).flatMap(
          (language) =>
            Array.from({ length: numCases }).map((_, idx) => ({
              problem_id: problemId,
              language,
              input:
                convertedTestInputs[
                  language as keyof typeof convertedTestInputs
                ][idx],
              expected_output:
                expectedOutputs[language as keyof typeof expectedOutputs][idx],
              test_case_number: idx + 1
            }))
        );
        const { error: testCasesInsertError } = await tryCatch(
          tx.insert(TestCasesTable).values(testCaseValues)
        );
        if (testCasesInsertError) {
          throw new Error(
            `Error inserting into TestCasesTable: ${testCasesInsertError.message}`
          );
        }

        const referenceSolutionsValues = Object.entries(referenceSolution).map(
          (entry) => ({
            problem_id: problemId,
            language: entry[0],
            code: entry[1]
          })
        );
        const { error: referenceSolutionsInsertError } = await tryCatch(
          tx.insert(ReferenceSolutionsTable).values(referenceSolutionsValues)
        );
        if (referenceSolutionsInsertError) {
          throw new Error(
            `Error inserting into ReferenceSolutionsTable: ${referenceSolutionsInsertError.message}`
          );
        }
      })
    );
    if (transactionError) {
      console.error(`Transaction failed: ${transactionError}`);
      process.exit(1);
    }

    const elapsedTime = Date.now() - startTime;
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeString =
      minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;

    console.log("Problem generated successfully!");
    console.log(`Total time elapsed: ${timeString} (${elapsedTime}ms)`);
    process.exit(0);
  } catch (error) {
    const elapsedTime = Date.now() - startTime;
    const seconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const timeString =
      minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;

    console.error("Unexpected error:", error);
    console.error(
      `Time elapsed before error: ${timeString} (${elapsedTime}ms)`
    );
    process.exit(1);
  }
}

main();
