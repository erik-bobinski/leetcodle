"use server";

import { submitCode } from "@/lib/judge0";
import { languages } from "@/types/editor-languages";
import parseUserCodeForSubmission from "@/lib/code-parsers";
import { getTestArgs } from "./get-test-args";
import { getTestCases } from "./get-test-cases";
import { gradeSolutionOutput } from "@/lib/ai-tooling-old";

/**
 * Grades solution comparing output to expected output
 * @param langId The Judge0 language ID for the submitted code
 * @param sourceCode The source code to grade
 * @param funcitonName The name of the function to be tested
 * @returns Object containing:
 *  - success: Whether Judge0 endpoint returned ok
 *  - graded: Whether the code was actually graded
 *  - message: Error message if unsuccessful
 */
export async function gradeUserCode(
  langKey: string,
  sourceCode: string,
  functionName: string,
  indent: number,
  problemTitle: string,
  problemDescription: string
) {
  sourceCode = sourceCode.trim();
  if (!sourceCode) {
    return {
      graded: false,
      message: "Source Code is not valid"
    };
  }
  // ensure sourceCode is in a supported language
  if (!Object.keys(languages).some((key) => key === langKey)) {
    return {
      graded: false,
      message: `Unrecognized language: ${langKey}`
    };
  }

  // get testArgs for the current language
  const allTestArgs: { [key: string]: string[] } = await getTestArgs();
  const testArgs = allTestArgs[langKey];

  // pass in all 5 test cases
  const parsedSolution = parseUserCodeForSubmission(
    langKey,
    sourceCode,
    functionName,
    testArgs.slice(0, 5),
    indent
  );

  // run the code
  const res = await submitCode(parsedSolution, languages[langKey].language_id);
  if (typeof res === "string") {
    // error at judge0 endpoint
    return { graded: false, message: res };
  }
  const userCodeStdOut = res.stdout;
  if (!userCodeStdOut || userCodeStdOut === "")
    return {
      graded: false,
      message: "Nothing was printed to stdout!"
    };

  // transform stringified array of outputs into obj
  const outputs = userCodeStdOut.trim().split("\n");
  const userTestCases: Record<string, string> = {};
  testArgs.slice(0, 5).forEach((testArg, index) => {
    userTestCases[`testCase${index + 1}`] = outputs[index] || "";
  });

  const expectedTestCases = await getTestCases();
  const grade = await gradeSolutionOutput(
    userTestCases,
    expectedTestCases,
    problemTitle,
    problemDescription
  );

  return {
    ...grade,
    time: res.time,
    memory: res.memory,
    error: res.stderr,
    stdout: userCodeStdOut
  };
}
