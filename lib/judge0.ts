import { Judge0ExecutionResponse } from "@/types/judge0";

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
    const response = await fetch("/api/judge0?wait=true", {
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

  // run all 5 solutions in parallel
  const promises = Object.entries(solutionsWithTestCases).map(
    async ([key, sourceCode]) => {
      const result = await submitCode(sourceCode, 54);
      return [key, result] as const;
    }
  );
  const resolvedResults = await Promise.all(promises);

  // Convert array of results back to object
  for (const [key, result] of resolvedResults) {
    results[key] = result;
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
    const response = await fetch(`/api/judge0?token=${token}`);
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
    const response = await fetch("/api/judge0", {
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
