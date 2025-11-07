import { db } from "@/drizzle";
import { desc, eq } from "drizzle-orm";
import {
  generatePrerequisiteDataStructure,
  generateProblemDetails,
  generateReferenceSolution
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

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401
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

  const referenceSolution = await generateReferenceSolution(
    problemDetails.description,
    problemDetails.template.functionName,
    problemDetails.template.argNames
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

  const prerequisiteDataStructure = await generatePrerequisiteDataStructure(
    problemDetails.title,
    problemDetails.description
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

  const { data: mostRecentProblemData, error: mostRecentProblemError } =
    await tryCatch(
      db
        .select({ problem_number: ProblemsTable.problem_number })
        .from(ProblemsTable)
        .orderBy(desc(ProblemsTable.created_at))
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

  // Prepare data for later inserts
  const prerequisiteEntries =
    prerequisiteDataStructure !== undefined
      ? Object.entries(prerequisiteDataStructure).filter(
          ([, code]) => typeof code === "string" && code.trim().length > 0
        )
      : [];

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
              data_structure_code: code,
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

      // 5) TestCasesTable (per-language, per-index rows from testInputs/Outputs)
      const numCases = problemDetails.template.testInputs.cpp.length;
      const testCaseValues = Object.keys(
        problemDetails.template.testInputs
      ).flatMap((language) =>
        Array.from({ length: numCases }).map((_, idx) => ({
          problem_id: problemId,
          language,
          input:
            problemDetails.template.testInputs[
              language as keyof typeof problemDetails.template.testInputs
            ][idx],
          expected_output:
            problemDetails.template.testOutputs[
              language as keyof typeof problemDetails.template.testOutputs
            ][idx],
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
