//TODO: instead of string type as error, return Judge0ErrorResponse?

import {
  Judge0ExecutionResponse,
  Judge0SubmissionResponse
} from "@/types/judge0";

/**
 * Submits code to Judge0 API server-side
 * @param source_code The code to execute
 * @param language_id The language ID
 * @returns A token that can be used to fetch the execution result, or an error
 */
export async function submitCode(
  source_code: string,
  language_id: number
): Promise<string> {
  try {
    const response = await fetch("/api/judge0", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        source_code,
        language_id
      })
    });
    if (!response.ok) {
      throw new Error(`${response.json()}`);
    }

    const data = (await response.json()) as Judge0SubmissionResponse;
    return data.token;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return error.message;
    }
    console.error(`Unknown error occurred: ${error}`);
    return `Unknown error occurred: ${error}`;
  }
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

    return await data;
  } catch (error) {
    if (error instanceof Error) {
      console.error(error.message);
      return error.message;
    }
    console.error(error);
    return `Unknown error occurred: ${error}`;
  }
}
