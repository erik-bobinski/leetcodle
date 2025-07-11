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
  Object.values(testCasesOutputs).forEach((value) => {
    // ensure each test case ran successfully
    if (typeof value === "string") {
      console.error(`Running a test cases yielded an error: ${value}`);
      throw new Error(`Running a test case yielded an error: ${value}`);
    }
  });

  // 6. create test cases JSON mapping inputs to outputs
  const testCases: Record<string, string> = {};
  Object.entries(testCasesOutputs).forEach(
    ([testCaseInput, executionResult]) => {
      if (
        typeof executionResult === "object" &&
        executionResult.stdout !== null
      ) {
        testCases[testCaseInput] = executionResult.stdout.trim();
      } else if (typeof executionResult === "string") {
        // If executionResult is a string, it's an error message
        console.error(
          `Test case "${testCaseInput}" failed: ${executionResult}`
        );
        throw new Error(
          `Test case "${testCaseInput}" failed: ${executionResult}`
        );
      } else if (
        typeof executionResult === "object" &&
        executionResult.stdout === null
      ) {
        // If stdout is null, the execution didn't produce any output
        console.error(
          `Test case "${testCaseInput}" produced no output (stdout is null)`
        );
        throw new Error(
          `Test case "${testCaseInput}" produced no output (stdout is null)`
        );
      }
    }
  );

  // 7. DB insert
  const supabase = createServiceRoleClient();

  // Set active_date to a week from now
  const activeDate = new Date();
  activeDate.setDate(activeDate.getDate() + 7);
  const activeDateString = activeDate.toISOString().split("T")[0]; // format as YYYY-MM-DD

  const { error } = await supabase.from("problems").insert({
    title: problemDetails.title,
    description: problemDetails.description,
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
