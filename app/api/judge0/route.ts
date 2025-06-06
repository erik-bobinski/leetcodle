import { NextRequest, NextResponse } from "next/server";

const JUDGE0_HOST = "judge0-ce.p.rapidapi.com";
const JUDGE0_BASE_URL = `https://${JUDGE0_HOST}`;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;

if (!RAPIDAPI_KEY) {
  throw new Error("Rapid API Key was not set in env!");
}

const headers = {
  "content-type": "application/json",
  "X-RapidAPI-Key": RAPIDAPI_KEY,
  "X-RapidAPI-Host": JUDGE0_HOST
};

// submit program for RCE from Judge0
export async function POST(request: NextRequest) {
  try {
    const { sourceCode, languageId } = await request.json();

    console.log("Making request to Judge0 with:", {
      url: JUDGE0_BASE_URL,
      headers: { ...headers, "X-RapidAPI-Key": "[REDACTED]" }
    });

    const response = await fetch(`${JUDGE0_BASE_URL}/submissions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId || 63
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Judge0 API error response:", errorText);
      throw new Error(`Judge0 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    //TODO: remove later after testing
    console.log("Judge0 POST response:", data);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error submitting code:", error);
    return NextResponse.json(
      { error: "Failed to submit code" },
      { status: 500 }
    );
  }
}

// use token from code submission to try accessing RCE results
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const response = await fetch(`${JUDGE0_BASE_URL}/submissions/${token}`, {
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    //TODO: remove later after testing
    console.log("Judge0 GET Response: ", data);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error getting execution result:", error);
    return NextResponse.json(
      { error: "Failed to get execution result" },
      { status: 500 }
    );
  }
}
