// TODO: Refactor cron to use tryCatch wrapper and Drizzle Schema

import type { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  generatePrerequisiteDataStructure,
  generateProblemDetails,
  generateReferenceSolution,
  generateTestCasesSolutions
} from "@/lib/ai-tooling-old";
import {
  type PrerequisiteDataStructure,
  type ProblemDetails,
  type ReferenceSolution,
  type TestCasesSolutions
} from "@/types/database";
import { generateTestCasesOutputs } from "@/lib/judge0";

export async function GET(request: NextRequest) {
  // 1. security check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401
    });
  }

  let problemDetails: ProblemDetails | undefined;
  try {
    problemDetails = await generateProblemDetails();
  } catch (error) {
    console.error("Error calling generateProblemDetails:", error);
    // Vercel logs can truncate the error object, log key properties
    if (error instanceof Error && "cause" in error) {
      console.error("Error cause:", (error as { cause: unknown }).cause);
    }
    return new Response("Failed to generate problem details from AI", {
      status: 500
    });
  }
  if (!problemDetails) {
    console.error("Failed to generate problem details from AI");
    return new Response("Failed to generate problem details: ", {
      status: 500
    });
  }

  const referenceSolution: ReferenceSolution | undefined =
    await generateReferenceSolution(
      problemDetails.description,
      problemDetails.template.functionName,
      problemDetails.template.argNames
    );
  if (!referenceSolution) {
    console.error("Failed to generate reference solution from AI");
    return new Response("Failed to generate reference solution", {
      status: 500
    });
  }

  const testCasesSolutions: TestCasesSolutions | undefined =
    await generateTestCasesSolutions(
      problemDetails.description,
      referenceSolution.python,
      problemDetails.template.testArgs.python
    );
  if (!testCasesSolutions) {
    console.error("Failed to generate test cases from AI");
    return new Response("Failed to generate test cases", { status: 500 });
  }

  // may be necessary for the generate problem
  let prerequisiteDataStructure: PrerequisiteDataStructure | undefined;
  try {
    prerequisiteDataStructure = await generatePrerequisiteDataStructure(
      problemDetails.title,
      problemDetails.description,
      referenceSolution
    );
  } catch (e) {
    if (e instanceof Error) {
      console.error(e.message);
    } else {
      console.error(e);
    }
  }

  // 5. generate expected outputs via judge0
  const testCasesFinal = await generateTestCasesOutputs(testCasesSolutions);
  if (!testCasesFinal || Object.keys(testCasesFinal).length === 0) {
    console.error("Failed to generate test case outputs from Judge0");
    return new Response("Failed to generate test case outputs", {
      status: 500
    });
  }

  // Check for failed test cases but don't fail the entire process
  const failedTestCases: string[] = [];
  Object.entries(testCasesFinal).forEach(([testCase, testCaseData]) => {
    const output = testCaseData.code;
    if (output.startsWith("Error")) {
      console.error(`Test case "${testCase}" failed: ${output}`);
      failedTestCases.push(testCase);
    }
  });

  if (failedTestCases.length > 0) {
    console.warn(
      `Warning: ${failedTestCases.length} test cases failed: ${failedTestCases.join(", ")}`
    );
    // Continue with successful test cases instead of failing completely
  }

  // 6. create test cases JSON mapping inputs to outputs
  const testCases: Record<string, string> = {};
  Object.entries(testCasesFinal).forEach(([testCaseKey, testCaseData]) => {
    const input = testCaseData.input;
    const output = testCaseData.code;

    // Debug logging to see the actual response structure
    console.log(
      `🔍 Processing test case "${testCaseKey}" with input "${input}":`,
      {
        output: output,
        startsWithError: output.startsWith("Error")
      }
    );

    if (!output.startsWith("Error")) {
      testCases[input] = output.trim();
      console.log(`✅ Test case "${testCaseKey}" processed successfully`);
    } else {
      // error output - skip this test case but don't fail the entire process
      console.error(`❌ Test case "${testCaseKey}" failed: ${output}`);
      // Don't throw error, just skip this test case
    }
  });

  // Ensure we have at least some test cases
  if (Object.keys(testCases).length === 0) {
    console.error("No test cases were successfully processed");
    return new Response("No test cases could be generated", { status: 500 });
  }

  console.log(
    `✅ Successfully processed ${Object.keys(testCases).length} test cases`
  );

  // 7. DB insert
  const supabase = createServiceRoleClient();

  // Get the next problem number
  const { data: maxProblemData, error: maxProblemError } = await supabase
    .from("problems")
    .select("problem_number")
    .order("problem_number", { ascending: false })
    .limit(1);

  if (maxProblemError) {
    console.error("Error getting max problem number:", maxProblemError);
    return new Response("Database error", { status: 500 });
  }

  const nextProblemNumber = (maxProblemData?.[0]?.problem_number || 0) + 1;
  console.log(`📝 Next problem number: ${nextProblemNumber}`);

  // Set active_date to a week from now
  const activeDate = new Date();
  activeDate.setDate(activeDate.getDate() + 7);
  const activeDateString = activeDate.toISOString().split("T")[0]; // format as YYYY-MM-DD

  // Generate a UUID for the id field
  const { error } = await supabase.from("problems").insert({
    id: crypto.randomUUID(),
    problem_number: nextProblemNumber,
    title: problemDetails.title,
    description: problemDetails.description,
    example_input: problemDetails.example_input,
    example_output: problemDetails.example_output,
    test_cases: testCases,
    reference_solution: referenceSolution,
    template: problemDetails.template,
    active_date: activeDateString,
    prerequisite_data_structure: prerequisiteDataStructure
  });

  if (error) {
    console.error("Database insert error:", error);
    return new Response("Database error", { status: 500 });
  }

  return Response.json({ success: true });
}
