import { submitCode } from "@/lib/judge0";
import { languages } from "@/types/editor-languages";

/**
 * Grades solution via Judge0 and comparing to expected output
 * @param langId The Judge0 language ID for the submitted code
 * @param sourceCode The source code to grade
 * @returns Object containing:
 *  - success: Whether Judge0 endpoint returned ok
 *  - graded: Whether the code was actually graded
 *  - message: Error message if unsuccessful
 */

export async function gradeCode(langId: number, sourceCode: string) {
  if (!Object.values(languages).some((lang) => lang.language_id === langId)) {
    return {
      success: false,
      graded: false,
      message: `Unrecognized language ID: ${langId}`
    };
  }

  const res = submitCode(sourceCode.trim(), langId);

  // error running code at judge0 endpoint
  if (typeof res === "string") {
    return { success: false, graded: false, message: res };
  }

  // hit ai endpoint to ensure source code result is printed to stdout
}
