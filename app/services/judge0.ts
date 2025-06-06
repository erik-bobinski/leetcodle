const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_BASE_URL = `https://${JUDGE0_HOST}`;
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_KEY || "";

if (!RAPIDAPI_KEY) {
  console.warn(
    "RapidAPI key not found. Please set NEXT_PUBLIC_RAPIDAPI_KEY in your .env file"
  );
}

const headers = {
  "content-type": "application/json",
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": "judge0-ce.p.rapidapi.com"
};

export interface ExecutionResult {
  stdout: string | null;
  time: string;
  memory: number;
  stderr: string | null;
  token: string;
  compile_output: string | null;
  status: {
    id: number;
    description: string;
  };
}

/**
 * Submits code to Judge0 API server-side
 * @param sourceCode The code to execute
 * @param languageId The language ID (default: 63 for JavaScript)
 * @returns A token that can be used to fetch the execution result
 */
export async function submitCode(
  sourceCode: string,
  languageId: number = 63
): Promise<string> {
  try {
    const response = await fetch("/api/judge0", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        sourceCode,
        languageId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.token;
  } catch (error) {
    console.error("Error submitting code:", error);
    throw error;
  }
}

/**
 * Fetches the execution result for a given submission token through our secure backend
 * @param token The submission token received from submitCode
 * @returns The execution result containing stdout, stderr, and status
 */
export async function getExecutionResult(
  token: string
): Promise<ExecutionResult> {
  try {
    const response = await fetch(`/api/judge0?token=${token}`);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error getting execution result:", error);
    throw error;
  }
}

/**
 * Polls the execution result until it's ready
 * @param token The submission token
 * @param interval Polling interval in milliseconds (default: 1000)
 * @returns The final execution result
 */
export async function pollExecutionResult(
  token: string,
  interval: number = 1000
): Promise<ExecutionResult> {
  const result = await getExecutionResult(token);

  // Status ID 1 or 2 means the submission is still in queue or processing
  if (result.status.id === 1 || result.status.id === 2) {
    await new Promise((resolve) => setTimeout(resolve, interval));
    return pollExecutionResult(token, interval);
  }

  return result;
}
