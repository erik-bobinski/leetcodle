"use server";

import { submitCode } from "@/lib/judge0";
import { languages } from "@/types/editor-languages";
import parseCodeForSubmission from "@/lib/code-parsers";
import { getTestArgs } from "./get-test-cases";
import { gradeSolutionOutput } from "@/lib/ai-tooling";

/**
 * Grades solution via LLM comparing user's output to expected output
 * @returns Object containing:
 *  - success: Whether Judge0 endpoint returned ok
 *  - graded: Whether the code was actually graded
 *  - message: Error message if unsuccessful
 */
export async function gradeSolution(
  langKey: keyof typeof languages,
  sourceCode: string,
  functionName: string,
  indent: number,
  problemTitle: string,
  problemDescription: string,
  date?: string
) {
  sourceCode = sourceCode.trim();
  if (!sourceCode) {
    return new Error("Source code is not valid");
  }

  // Get test cases for the current language
  const result = await getTestArgs(date);
  if (result instanceof Error) {
    return result;
  }

  // Filter by language, sort by test_case_number, and extract inputs
  const testInputs = result
    .filter((obj) => obj.language === langKey)
    .sort((a, b) => a.test_case_number - b.test_case_number)
    .map((obj) => obj.input);

  // pass in all 5 test cases
  const parsedSolution = parseCodeForSubmission(
    langKey,
    sourceCode,
    functionName,
    testInputs.slice(0, 5),
    indent
  );
  if (parsedSolution instanceof Error) {
    return parsedSolution;
  }

  // run the code
  const res = await submitCode(parsedSolution, languages[langKey].language_id);
  if (typeof res === "string") {
    // error at judge0 endpoint
    return new Error(`Error at Judge0 Endpoint: ${res}`);
  }
  // runtime error
  if (res.stderr?.trim() || res.compile_output?.trim()) {
    return {
      graded: false,
      time: res.time,
      memory: res.memory,
      error: res.stderr,
      stdout: res.stdout
    };
  }

  const userCodeStdOut = res.stdout;
  if (userCodeStdOut === null || userCodeStdOut === "")
    return new Error("Application Error: Nothing was printed to stdout!");

  const outputs = userCodeStdOut
    .trim()
    .split(",")
    .map((item) => item.trim());
  const userTestCases: Record<string, string> = {};
  testInputs.slice(0, 5).forEach((testInput, index) => {
    userTestCases[testInput] = outputs[index] || "";
  });

  // Parse test cases into Record<string, string> format (input as key, expected_output as value)
  const expectedTestCases: Record<string, string> = {};
  result
    .filter((obj) => obj.language === langKey)
    .sort((a, b) => a.test_case_number - b.test_case_number)
    .forEach((obj) => {
      expectedTestCases[obj.input] = obj.expected_output;
    });

  const grade = await gradeSolutionOutput(
    userTestCases,
    expectedTestCases,
    problemTitle,
    problemDescription
  );
  if (grade instanceof Error) {
    return grade;
  }

  return {
    ...grade,
    time: res.time,
    memory: res.memory,
    error: res.stderr,
    stdout: userCodeStdOut
  };
}
