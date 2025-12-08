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
import {
  PrerequisiteDataStructuresTable,
  ProblemsTable,
  TemplateArgsTable,
  TemplatesTable,
  TestCasesTable,
  ReferenceSolutionsTable
} from "@/drizzle/schema";
import { generateExpectedOutputs } from "@/lib/judge0";
import { normalizeIndentation } from "@/lib/utils";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401
    });
  }

  // Set active_date to a week from now
  const activeDate = new Date();
  activeDate.setDate(activeDate.getDate() + 7);
  const activeDateString = activeDate.toISOString().split("T")[0]; // format as YYYY-MM-DD

  // Check if a problem already exists for this active_date to prevent duplicates
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
    return Response.json(
      `There was an error checking for existing problem: ${checkError.message}`,
      { status: 500 }
    );
  }
  if (existingProblem && existingProblem.length > 0) {
    console.log(
      `Problem already exists for active_date ${activeDateString}, skipping insertion`
    );
    return Response.json({
      success: true,
      message: `Problem already exists for active_date ${activeDateString}`
    });
  }

  const problemDetails = await generateProblemDetails();
  if (problemDetails instanceof Error) {
    console.error(
      `There was an error generating problemDetails: ${problemDetails.message}`
    );
    return Response.json(
      `There was an error generating problemDetails: ${problemDetails.message}`,
      { status: 500 }
    );
  }

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
    return Response.json(
      `There was an error generating prerequisiteDataStructure: ${prerequisiteDataStructure.message}`,
      {
        status: 500
      }
    );
  }

  // Generate reference solution using original data structures (before printing methods are added)
  // The reference solution doesn't need the printing methods
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
    return Response.json(
      `There was an error generating referenceSolution: ${referenceSolution.message}`,
      { status: 500 }
    );
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
    return Response.json(
      `There was an error fetching the most recent problem: ${mostRecentProblemError.message}`,
      {
        status: 500
      }
    );
  }
  const mostRecentProblemNumber =
    mostRecentProblemData.length === 0
      ? 0
      : mostRecentProblemData[0].problem_number;

  // Generate printing methods for all languages at once
  // Only run if prerequisite data structures exist
  const prerequisiteDataStructureWithPrinting =
    prerequisiteDataStructure.prerequisiteDataStructure;
  let mergedPrerequisiteDataStructures: Record<string, string> = {};

  if (prerequisiteDataStructureWithPrinting) {
    // Generate complete data structures with printing methods for all languages at once
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
      return Response.json(
        `Error generating print statement for prerequisite data structures: ${completeDataStructures}`
      );
    }
    mergedPrerequisiteDataStructures = completeDataStructures;
  }

  // Prepare data for later inserts using merged data structures
  const prerequisiteEntries = Object.entries(
    mergedPrerequisiteDataStructures
  ).filter(([, code]) => typeof code === "string" && code.trim().length > 0);

  // Generate test inputs for all languages using AI
  // Use original data structures (before printing methods) for test input generation
  const convertedTestInputsResult = await generateTestInputsForAllLanguages(
    prerequisiteDataStructure.testInputs.python,
    prerequisiteDataStructure.prerequisiteDataStructure,
    problemDetails.template.typedArgs
  );
  if (convertedTestInputsResult instanceof Error) {
    console.error(convertedTestInputsResult);
    return Response.json(
      `Error generating test inputs for all languages: ${convertedTestInputsResult.message}`,
      { status: 500 }
    );
  }
  const convertedTestInputs = convertedTestInputsResult;

  const expectedOutputs = await generateExpectedOutputs(
    convertedTestInputs,
    referenceSolution,
    problemDetails.template.functionName,
    4, // indent level
    problemDetails.template.returnType
  );
  if (expectedOutputs instanceof Error) {
    console.error(expectedOutputs);
    return Response.json(`${expectedOutputs}`, { status: 500 });
  }

  // Wrap all inserts in a transaction to ensure atomicity
  // If any insert fails, all changes are rolled back
  const { error: transactionError } = await tryCatch(
    db.transaction(async (tx) => {
      // All inserts occur below, in order. If any fails, the entire transaction rolls back.

      // 1) ProblemsTable
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
        console.error(
          `There was an error inserting into ProblemsTable: ${problemInsertError.message}`
        );
        return Response.json(
          `There was an error inserting into ProblemsTable: ${problemInsertError.message}`,
          {
            status: 500
          }
        );
      }
      if (!problemInsertData || !problemInsertData[0]) {
        console.error(
          "The returned problemId for inserting the problem came back as undefined"
        );
        return Response.json(
          "The returned problemId for inserting the problem came back as undefined",
          {
            status: 500
          }
        );
      }
      const problemId = problemInsertData[0].id;

      // 2) PrerequisiteDataStructuresTable
      if (prerequisiteEntries.length > 0) {
        const { error: prerequisiteDataStructureInsertError } = await tryCatch(
          tx.insert(PrerequisiteDataStructuresTable).values(
            prerequisiteEntries.map(([langKey, code]) => ({
              language: langKey,
              data_structure_code: normalizeIndentation(code),
              problem_id: problemId
            }))
          )
        );
        if (prerequisiteDataStructureInsertError) {
          console.error(
            `There was an error inserting into PrerequisiteDataStructuresTable: ${prerequisiteDataStructureInsertError.message}`
          );
          return Response.json(
            `There was an error inserting into PrerequisiteDataStructuresTable: ${prerequisiteDataStructureInsertError.message}`,
            { status: 500 }
          );
        }
      }

      // 3) TemplatesTable
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
        console.error(
          `There was an error inserting into TemplatesTable: ${templateInsertError.message}`
        );
        return Response.json(
          `There was an error inserting into TemplatesTable: ${templateInsertError.message}`,
          { status: 500 }
        );
      }
      const templateId = templateInsertData[0].id;

      // 4) TemplateArgsTable
      const templateArgsValues = Object.keys(
        problemDetails.template.typedArgs
      ).map((language) => ({
        template_id: templateId,
        language,
        typed_args: JSON.stringify(
          problemDetails.template.typedArgs[
            language as keyof typeof problemDetails.template.typedArgs
          ]
        ),
        return_type:
          problemDetails.template.returnType[
            language as keyof typeof problemDetails.template.returnType
          ]
      }));
      const { error: templateArgsInsertError } = await tryCatch(
        tx.insert(TemplateArgsTable).values(templateArgsValues)
      );
      if (templateArgsInsertError) {
        console.error(
          `There was an error inserting into TemplateArgsTable: ${templateArgsInsertError.message}`
        );
        return Response.json(
          `There was an error inserting into TemplateArgsTable: ${templateArgsInsertError.message}`,
          { status: 500 }
        );
      }

      // 5) TestCasesTable (per-language, per-index rows from testInputs/expectedOutputs)
      const numCases = convertedTestInputs.python.length;
      const testCaseValues = (
        Object.keys(convertedTestInputs) as Array<
          keyof typeof convertedTestInputs
        >
      ).flatMap((language) =>
        Array.from({ length: numCases }).map((_, idx) => ({
          problem_id: problemId,
          language,
          input: convertedTestInputs[language][idx],
          expected_output: expectedOutputs[language][idx],
          test_case_number: idx + 1
        }))
      );
      const { error: testCasesInsertError } = await tryCatch(
        tx.insert(TestCasesTable).values(testCaseValues)
      );
      if (testCasesInsertError) {
        console.error(
          `There was an error inserting into TestCasesTable: ${testCasesInsertError.message}`
        );
        return Response.json(
          `There was an error inserting into TestCasesTable: ${testCasesInsertError.message}`,
          { status: 500 }
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
        console.error(
          `There was an error inserting into ReferenceSolutionsTable: ${referenceSolutionsInsertError.message}`
        );
        return Response.json(
          `There was an error inserting into ReferenceSolutionsTable: ${referenceSolutionsInsertError.message}`,
          { status: 500 }
        );
      }
    })
  );
  if (transactionError) {
    console.error(`Transaction failed: ${transactionError}`);
    return Response.json(`Transaction failed: ${transactionError}`, {
      status: 500
    });
  }

  return Response.json({ success: true });
}
