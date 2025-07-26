import { Judge0ExecutionResponse } from "@/types/judge0";

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
 * Submits code to Judge0 API server-side synchronously
 * @param source_code The code to execute
 * @param language_id The language ID
 * @returns The execution result or an error
 */
export async function submitCode(
  source_code: string,
  language_id: number
): Promise<Judge0ExecutionResponse | string> {
  try {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/api/judge0?wait=true`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        source_code,
        language_id
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

export async function generateTestCasesOutputs(
  solutionsWithTestCases: Record<string, string>
): Promise<Record<string, Judge0ExecutionResponse | string>> {
  const results: Record<string, Judge0ExecutionResponse | string> = {};

  // Run solutions sequentially to avoid rate limiting
  for (const [key, sourceCode] of Object.entries(solutionsWithTestCases)) {
    console.log(`Executing test case: ${key}`);

    // Add delay between requests to respect rate limits
    if (Object.keys(results).length > 0) {
      console.log("Waiting 0.5 seconds before next request...");
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const result = await submitCode(sourceCode, 71); // use python
    results[key] = result;

    // If we got an error, log it but continue with other test cases
    if (typeof result === "string") {
      console.error(`Test case ${key} failed: ${result}`);
    } else {
      console.log(`Test case ${key} completed successfully`);
    }
  }

  return results;
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
