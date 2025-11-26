import type { Judge0ExecutionResponse } from "@/types/judge0";
import { languages } from "@/types/editor-languages";
import parseCodeForSubmission from "@/lib/code-parsers";
import { fixExecutableCode } from "@/lib/ai-tooling";
import type { ReferenceSolution } from "@/types/database";

// Helper function to get the base URL for API calls
function getBaseUrl(): string {
  // In development, use localhost
  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }
  // In production, use the deployed URL or construct from headers
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Submits code to Judge0 API synchronously server-side
 * @param source_code The code to execute
 * @param language_id The language ID
 * @returns The execution result or an error
 */
export async function submitCode(
  source_code: string,
  language_id: number
): Promise<Judge0ExecutionResponse | string> {
  "use server";

  try {
    const compiler_options = language_id === 54 ? "-std=c++17" : null;
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/judge0?wait=true`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.API_SECRET}`
      },
      body: JSON.stringify({
        source_code,
        language_id,
        compiler_options
      })
    });
    const data = (await response.json()) as Judge0ExecutionResponse;
    if (!response.ok) {
      throw new Error(`${JSON.stringify(data)}`);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return error.message;
    }
    console.error(`Unknown error occurred: ${error}`);
    return `Unknown error occurred: ${error}`;
  }
}

export async function generateExpectedOutputs(
  testInputs: Record<string, string[]>,
  referenceSolution: ReferenceSolution,
  functionName: string,
  indent: number,
  returnType?: Record<string, string>
) {
  "use server";

  const testOutputs: Record<string, string[]> = {};

  // Run solutions sequentially to avoid rate limiting
  for (const language of Object.keys(testInputs)) {
    const inputs = testInputs[language];
    console.log(`Executing test cases for language: ${language}`);

    // Add delay between requests to respect rate limits
    if (Object.keys(testOutputs).length > 0) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Get the reference solution code for this language
    const solutionCode = referenceSolution[language as keyof ReferenceSolution];
    if (!solutionCode) {
      console.error(`No reference solution found for language: ${language}`);
      return new Error(`No reference solution found for language: ${language}`);
    }

    // Get language ID
    const languageConfig = languages[language as keyof typeof languages];
    if (!languageConfig) {
      console.error(`Unsupported language: ${language}`);
      testOutputs[language] = inputs.map(() => "");
      continue;
    }

    // Get return type for this language
    const langReturnType = returnType?.[language] || "";

    // Parse the code with all test inputs
    let executableCode = parseCodeForSubmission(
      language,
      solutionCode,
      functionName,
      inputs,
      indent,
      langReturnType
    );
    if (executableCode instanceof Error) {
      return executableCode;
    }

    // Use AI to fix extraneous runtime/compilation errors before submission
    const fixedCodeResult = await fixExecutableCode(
      executableCode,
      language,
      langReturnType
    );
    if (fixedCodeResult instanceof Error) {
      return fixedCodeResult;
    }
    executableCode = fixedCodeResult;

    // Execute the code
    const result = await submitCode(executableCode, languageConfig.language_id);

    // Extract and parse the stdout
    let outputs: string[] = [];
    if (typeof result === "string") {
      console.error(`Test case execution failed for ${language}: ${result}`);
      outputs = inputs.map(() => "");
    } else {
      const stdout = result.stdout || "";
      if (stdout.trim()) {
        outputs = stdout
          .trim()
          .split(",")
          .map((item) => item.trim());
      } else {
        outputs = inputs.map(() => "");
      }
      console.log(
        `Test case execution completed for ${language}, got ${outputs.length} outputs`
      );
    }

    // Ensure we have the correct number of outputs
    while (outputs.length < inputs.length) {
      outputs.push("");
    }
    testOutputs[language] = outputs.slice(0, inputs.length);
  }

  return testOutputs;
}

/**
 * Fetches the execution result for a given submission token
 * @param token The submission token received from submitCode
 * @returns The execution result or error
 */
export async function getExecutionResult(
  token: string
): Promise<Judge0ExecutionResponse | string> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/judge0?token=${token}`);
    const data = (await response.json()) as Judge0ExecutionResponse;
    if (!response.ok) {
      throw new Error(`${data}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return error.message;
    }
    console.error(error);
    return `Unknown error occurred: ${error}`;
  }
}

/**
 * Polls the execution result server-side until it's ready
 * @param token The submission token
 * @returns The final execution result or error
 */
export async function pollExecutionResult(
  token: string
): Promise<Judge0ExecutionResponse | string> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/judge0`, {
      method: "PUT",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({ token })
    });
    const data = (await response.json()) as Judge0ExecutionResponse;
    if (!response.ok) {
      throw new Error(`${data}`);
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return error.message;
    }
    console.error(error);
    return `Unknown error occurred: ${error}`;
  }
}
