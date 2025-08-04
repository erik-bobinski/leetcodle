import type { NextRequest } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import {
  generateProblemDetails,
  generateReferenceSolution,
  generateTestCasesSolutions
} from "@/lib/ai-tooling";
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
    problemDetails.description,
    problemDetails.template.functionName,
    problemDetails.template.argNames
  );

  // 4. test cases AI call
  const testCasesSolutions = await generateTestCasesSolutions(
    problemDetails.description,
    referenceSolution.python,
    problemDetails.template.testArgs.python
  );

  // 5. generate expected outputs via judge0
  const testCasesFinal = await generateTestCasesOutputs(testCasesSolutions);

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

  // Set active_date to a week from now
  const activeDate = new Date();
  activeDate.setDate(activeDate.getDate() + 7);
  const activeDateString = activeDate.toISOString().split("T")[0]; // format as YYYY-MM-DD

  // Generate a UUID for the id field
  const { error } = await supabase.from("problems").insert({
    id: crypto.randomUUID(),
    title: problemDetails.title,
    description: problemDetails.description,
    example_input: problemDetails.example_input,
    example_output: problemDetails.example_output,
    test_cases: testCases,
    reference_solution: referenceSolution,
    template: problemDetails.template,
    active_date: activeDateString
  });

  if (error) {
    console.error("Database insert error:", error);
    return new Response("Database error", { status: 500 });
  }

  return Response.json({ success: true });
}
