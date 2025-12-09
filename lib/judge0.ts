import type { Judge0ExecutionResponse } from "@/types/judge0";
import { languages } from "@/types/editor-languages";
import parseCodeForSubmission from "@/lib/code-parsers";
import { fixExecutableCode } from "@/lib/ai-tooling";
import type { ReferenceSolution } from "@/types/database";

// Judge0 API configuration
const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_BASE_URL = `https://${JUDGE0_HOST}`;

// Helper function to get headers with API key
function getJudge0Headers() {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  if (!RAPIDAPI_KEY) {
    throw new Error("Rapid API Key was not set in env!");
  }

  return {
    "content-type": "application/json",
    "X-RapidAPI-Key": RAPIDAPI_KEY,
    "X-RapidAPI-Host": JUDGE0_HOST
  };
}

// Helper function to get the base URL for API calls (Next.js only)
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
 * When running in Next.js, uses the API route. When standalone, calls Judge0 directly.
 * @param source_code The code to execute
 * @param language_id The language ID
 * @param compiler_options Optional compiler options
 * @returns The execution result or an error
 */
export async function submitCode(
  source_code: string,
  language_id: number,
  compiler_options?: string
): Promise<Judge0ExecutionResponse | string> {
  "use server";

  try {
    // Check if we're running in a standalone context (no Next.js API route available)
    // If NEXT_PUBLIC_APP_URL is not set or we're in a script context, call Judge0 directly
    const isStandalone =
      !process.env.NEXT_PUBLIC_APP_URL ||
      process.env.RUNNING_AS_SCRIPT === "true";

    if (isStandalone) {
      // Call Judge0 directly
      const headers = getJudge0Headers();
      const sourceCodeBase64 = Buffer.from(source_code).toString("base64");

      const requestBody: {
        source_code: string;
        language_id: number;
        compiler_options?: string;
      } = {
        source_code: sourceCodeBase64,
        language_id
      };

      // Add compiler options if provided
      if (compiler_options) {
        requestBody.compiler_options = compiler_options;
      }

      const response = await fetch(
        `${JUDGE0_BASE_URL}/submissions?wait=true&base64_encoded=true`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Judge0 API error: ${errorText}`);
      }

      const data = (await response.json()) as Judge0ExecutionResponse;

      // Decode base64 stdout and stderr if they exist
      if (data.stdout) {
        try {
          data.stdout = Buffer.from(data.stdout, "base64").toString("utf-8");
        } catch {
          // If decoding fails, keep as is
        }
      }
      if (data.stderr) {
        try {
          data.stderr = Buffer.from(data.stderr, "base64").toString("utf-8");
        } catch {
          // If decoding fails, keep as is
        }
      }
      if (data.compile_output) {
        try {
          data.compile_output = Buffer.from(
            data.compile_output,
            "base64"
          ).toString("utf-8");
        } catch {
          // If decoding fails, keep as is
        }
      }

      return data;
    } else {
      // Use Next.js API route (original behavior)
      const baseUrl = getBaseUrl();
      const response = await fetch(`${baseUrl}/api/judge0?wait=true`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${process.env.API_SECRET}`
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
    }
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
    console.log(`\n${"=".repeat(80)}`);
    console.log(`Executing test cases for language: ${language}`);
    console.log(`${"=".repeat(80)}`);

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

    // Log the original solution code
    console.log(`\n📝 Original solution code (${language}):`);
    console.log("-".repeat(80));
    console.log(solutionCode);
    console.log("-".repeat(80));

    // Log test inputs
    console.log(`\n📥 Test inputs (${inputs.length} cases):`);
    inputs.forEach((input, idx) => {
      console.log(`  Test ${idx + 1}: ${input}`);
    });

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
    console.log(`\n🔧 Parsing code for submission...`);
    let executableCode = parseCodeForSubmission(
      language,
      solutionCode,
      functionName,
      inputs,
      indent,
      langReturnType
    );
    if (executableCode instanceof Error) {
      console.error(`❌ Error parsing code: ${executableCode.message}`);
      return executableCode;
    }

    console.log(`\n📋 Executable code after parseCodeForSubmission:`);
    console.log("-".repeat(80));
    console.log(executableCode);
    console.log("-".repeat(80));

    // Use AI to fix extraneous runtime/compilation errors before submission
    console.log(`\n🤖 Fixing executable code with AI...`);
    const fixedCodeResult = await fixExecutableCode(
      executableCode,
      language,
      langReturnType
    );
    if (fixedCodeResult instanceof Error) {
      console.error(`❌ Error fixing code: ${fixedCodeResult.message}`);
      return fixedCodeResult;
    }
    executableCode = fixedCodeResult;

    console.log(`\n✨ Executable code after fixExecutableCode:`);
    console.log("-".repeat(80));
    console.log(executableCode);
    console.log("-".repeat(80));

    // Execute the code
    console.log(
      `\n🚀 Submitting code to Judge0 (language_id: ${languageConfig.language_id})...`
    );
    const result = await submitCode(executableCode, languageConfig.language_id);

    // Extract and parse the stdout
    let outputs: string[] = [];
    console.log(`\n📊 Judge0 execution result:`);
    console.log("-".repeat(80));
    if (typeof result === "string") {
      console.error(`❌ Test case execution failed for ${language}: ${result}`);
      outputs = inputs.map(() => "");
    } else {
      const stdout = result.stdout || "";
      const stderr = result.stderr || "";
      const compileOutput = result.compile_output || "";

      // Log the full result object
      console.log(
        `Status: ${result.status?.id || "unknown"} - ${result.status?.description || "unknown"}`
      );
      console.log(`stdout: ${stdout || "(empty)"}`);
      if (stderr) {
        console.log(`stderr: ${stderr}`);
      }
      if (compileOutput) {
        console.log(`compile_output: ${compileOutput}`);
      }
      if (result.time) {
        console.log(`time: ${result.time}s`);
      }
      if (result.memory) {
        console.log(`memory: ${result.memory}KB`);
      }
      console.log("-".repeat(80));

      // Log detailed error information for debugging
      if (!stdout.trim()) {
        console.warn(`⚠️  No stdout for ${language}`);
        if (stderr) {
          console.error(`stderr (full): ${stderr}`);
        }
        if (compileOutput) {
          console.error(`compile_output (full): ${compileOutput}`);
        }
        if (result.status) {
          console.error(
            `Status ID: ${result.status.id}, Description: ${result.status.description}`
          );
        }
      }

      if (stdout.trim()) {
        outputs = stdout
          .trim()
          .split(" | ")
          .map((item) => item.trim());
        console.log(
          `✅ Test case execution completed for ${language}, got ${outputs.length} outputs`
        );
      } else {
        outputs = inputs.map(() => "");
        console.warn(
          `⚠️  Test case execution completed for ${language} but got empty stdout (${outputs.length} empty outputs)`
        );
      }
    }

    // Log input/output pairs for each test case
    console.log(`\n📋 Test case results:`);
    console.log("-".repeat(80));
    for (let i = 0; i < inputs.length; i++) {
      const input = inputs[i];
      const output = outputs[i] || "(empty)";
      console.log(`  Test ${i + 1}:`);
      console.log(`    Input:  ${input}`);
      console.log(`    Output: ${output}`);
    }
    console.log("-".repeat(80));

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
