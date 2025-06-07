import { NextRequest } from "next/server";

// Type for submitting code to judge0 for RCE
export interface Judge0CodeSubmission extends NextRequest {
  source_code: string;
  language_id: number;
}

// Types for various judge0 API responses

// response when submitting source code (POST)
export type Judge0SubmissionResponse = {
  token: string;
};

export type Judge0Status = {
  // judge0 status nested-object
  id: number;
  description: string;
};
// response when getting execution results (GET w/ token URL param)
export type Judge0ExecutionResponse = {
  stdout: string | null;
  time: string;
  memory: number;
  stderr: string | null;
  token: string;
  compile_output: string | null;
  message: string | null;
  status: Judge0Status;
};

export type Judge0ErrorResponse = {
  error: string;
};

// all possible Judge0 API responses
export type Judge0Response =
  | Judge0SubmissionResponse
  | Judge0ExecutionResponse
  | Judge0ErrorResponse;

// Type guard functions

// check if response is an execution response
export function isExecutionResponse(
  response: Judge0Response
): response is Judge0ExecutionResponse {
  return "stdout" in response;
}

// check if response is a submission response
export function isSubmissionResponse(
  response: Judge0Response
): response is Judge0SubmissionResponse {
  return !isExecutionResponse(response);
}
