import type { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  generateProblemDetails,
  generateReferenceSolution,
  generateTestCasesSolutions
} from "@/lib/gemini";
import { generateTestCasesOutputs } from "@/lib/judge0";

export async function GET(request: NextRequest) {
  // 1. security check
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", {
      status: 401
    });
  }

  // 2. problem details AI call
  const problemDetails = await generateProblemDetails();

  // 3. reference solution AI call
  const referenceSolution = await generateReferenceSolution(
    problemDetails.description
  );

  // 4. test cases AI call
  const testCasesSolutions = await generateTestCasesSolutions(
    problemDetails.description,
    referenceSolution.python
  );

  // 5. generate expected outputs via judge0
  const testCasesOutputs = await generateTestCasesOutputs(testCasesSolutions);

  // Check for failed test cases but don't fail the entire process
  const failedTestCases: string[] = [];
  Object.entries(testCasesOutputs).forEach(([testCase, value]) => {
    if (typeof value === "string") {
      console.error(`Test case "${testCase}" failed: ${value}`);
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
  Object.entries(testCasesOutputs).forEach(
    ([testCaseInput, executionResult]) => {
      // Debug logging to see the actual response structure
      console.log(`🔍 Processing test case "${testCaseInput}":`, {
        type: typeof executionResult,
        hasStdout:
          executionResult &&
          typeof executionResult === "object" &&
          "stdout" in executionResult,
        stdout:
          executionResult && typeof executionResult === "object"
            ? executionResult.stdout
            : "N/A",
        fullResponse: executionResult
      });
      if (
        // success output
        typeof executionResult === "object" &&
        executionResult.stdout !== null &&
        executionResult.stdout !== undefined
      ) {
        testCases[testCaseInput] = executionResult.stdout.trim();
        console.log(`✅ Test case "${testCaseInput}" processed successfully`);
      } else if (typeof executionResult === "string") {
        // error output - skip this test case but don't fail the entire process
        console.error(
          `❌ Test case "${testCaseInput}" failed: ${executionResult}`
        );
        // Don't throw error, just skip this test case
      } else if (
        // null or undefined output
        typeof executionResult === "object" &&
        (executionResult.stdout === null ||
          executionResult.stdout === undefined)
      ) {
        console.error(
          `❌ Test case "${testCaseInput}" produced no output (stdout is null/undefined)`
        );
        // Don't throw error, just skip this test case
      }
    }
  );

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

  // Set active_date to a week from now
  const activeDate = new Date();
  activeDate.setDate(activeDate.getDate() + 7);
  const activeDateString = activeDate.toISOString().split("T")[0]; // format as YYYY-MM-DD

  // Generate a UUID for the id field
  const { error } = await supabase.from("problems").insert({
    id: crypto.randomUUID(),
    title: problemDetails.title,
    description: problemDetails.description,
    example_input: problemDetails.exampleInput,
    example_output: problemDetails.exampleOutput,
    test_cases: testCases,
    reference_solution: referenceSolution,
    active_date: activeDateString
  });

  if (error) {
    console.error("Database insert error:", error);
    return new Response("Database error", { status: 500 });
  }

  return Response.json({ success: true });
}
