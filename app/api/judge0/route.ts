import { NextRequest, NextResponse } from "next/server";
import type { Judge0ExecutionResponse, Judge0Response } from "@/types/judge0";
import { isExecutionResponse, isSubmissionResponse } from "@/types/judge0";

// api keys
const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_BASE_URL = `https://${JUDGE0_HOST}`;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
if (!RAPIDAPI_KEY) {
  throw new Error("Rapid API Key was not set in env!");
}

// auth headers for api
const headers = {
  "content-type": "application/json",
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": JUDGE0_HOST
};

// constants for rate limiting
const MAX_POLL_RETRIES = 20;
const POLL_INTERVAL = 500; // ms

// submit program for RCE to Judge0
export async function POST(request: NextRequest) {
  try {
    const { source_code, language_id } = await request.json();
    const wait = request.nextUrl.searchParams.get("wait") === "true";

    const response = await fetch(
      `${JUDGE0_BASE_URL}/submissions${wait ? "?wait=true&base64_encoded=true" : "?base64_encoded=true"}`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          source_code: Buffer.from(source_code).toString("base64"),
          language_id
        })
      }
    );
    if (!response.ok) {
      return NextResponse.json(
        { error: await response.json() },
        { status: response.status }
      );
    }

    const data = (await response.json()) as Judge0Response;

    // If wait=true, Judge0 returns execution response directly
    // If wait=false, Judge0 returns submission response
    if (wait) {
      if (!isExecutionResponse(data)) {
        return NextResponse.json(
          { error: "Unexpected response type from Judge0 execution" },
          { status: 500 }
        );
      }

      // Decode base64 stdout and stderr if they exist
      if (data.stdout) {
        data.stdout = Buffer.from(data.stdout, "base64").toString("utf-8");
      }
      if (data.stderr) {
        data.stderr = Buffer.from(data.stderr, "base64").toString("utf-8");
      }
      if (data.compile_output) {
        data.compile_output = Buffer.from(
          data.compile_output,
          "base64"
        ).toString("utf-8");
      }

      return NextResponse.json(data);
    } else {
      if (!isSubmissionResponse(data)) {
        return NextResponse.json(
          { error: "Unexpected response type from Judge0 submission" },
          { status: 500 }
        );
      }
      return NextResponse.json(data);
    }
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}

// use token from code submission to try accessing RCE results
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "No token in URL Search Params" },
        { status: 400 }
      );
    }

    const response = await fetch(`${JUDGE0_BASE_URL}/submissions/${token}`, {
      headers
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: await response.json() },
        { status: response.status }
      );
    }

    const data = (await response.json()) as Judge0ExecutionResponse;
    if (!isExecutionResponse(data)) {
      return NextResponse.json(
        { error: "Unexpected response type from Judge0 execution" },
        { status: 500 }
      );
    }

    // Decode base64 stdout and stderr if they exist
    if (data.stdout) {
      data.stdout = Buffer.from(data.stdout, "base64").toString("utf-8");
    }
    if (data.stderr) {
      data.stderr = Buffer.from(data.stderr, "base64").toString("utf-8");
    }
    if (data.compile_output) {
      data.compile_output = Buffer.from(data.compile_output, "base64").toString(
        "utf-8"
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}

/**
 * Server-side polling that enforces rate limits.
 * Keep trying to get a result some amount of times,
 * return as soon as we get a non-pending response or reach our limit
 */
export async function PUT(request: NextRequest) {
  try {
    const { token } = await request.json();
    if (!token) {
      return NextResponse.json(
        { error: "No token provided in request body" },
        { status: 400 }
      );
    }

    let currentRetry = 0;
    while (currentRetry < MAX_POLL_RETRIES - 1) {
      const response = await fetch(`${JUDGE0_BASE_URL}/submissions/${token}`, {
        headers
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: await response.json() },
          { status: response.status }
        );
      }

      const data = (await response.json()) as Judge0ExecutionResponse;
      if (!isExecutionResponse(data)) {
        return NextResponse.json(
          { error: "Unexpected response type from Judge0 execution" },
          { status: 500 }
        );
      }

      // if we got a result (not in queue or not processing),
      // return it immediately
      if (data.status.id !== 1 && data.status.id !== 2) {
        // Decode base64 stdout and stderr if they exist
        if (data.stdout) {
          data.stdout = Buffer.from(data.stdout, "base64").toString("utf-8");
        }
        if (data.stderr) {
          data.stderr = Buffer.from(data.stderr, "base64").toString("utf-8");
        }
        if (data.compile_output) {
          data.compile_output = Buffer.from(
            data.compile_output,
            "base64"
          ).toString("utf-8");
        }
        return NextResponse.json(data);
      }

      // otherwise, the judge0 response is pending
      // wait for an interval and try again
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      currentRetry++;
    }

    // If we've exhausted our retries, return the last result
    const finalResponse = await fetch(
      `${JUDGE0_BASE_URL}/submissions/${token}`,
      {
        headers
      }
    );
    if (!finalResponse.ok) {
      return NextResponse.json(
        { error: await finalResponse.json() },
        { status: finalResponse.status }
      );
    }

    const finalData = await finalResponse.json();
    if (!isExecutionResponse(finalData)) {
      return NextResponse.json(
        { error: "Unexpected response type from final Judge0 execution" },
        { status: 500 }
      );
    }

    // Decode base64 stdout and stderr if they exist
    if (finalData.stdout) {
      finalData.stdout = Buffer.from(finalData.stdout, "base64").toString(
        "utf-8"
      );
    }
    if (finalData.stderr) {
      finalData.stderr = Buffer.from(finalData.stderr, "base64").toString(
        "utf-8"
      );
    }
    if (finalData.compile_output) {
      finalData.compile_output = Buffer.from(
        finalData.compile_output,
        "base64"
      ).toString("utf-8");
    }

    return NextResponse.json(finalData);
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: "An unknown error occurred" },
      { status: 500 }
    );
  }
}
