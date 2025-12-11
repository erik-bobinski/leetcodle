"use client";

import type { SubmissionResult } from "./CodeEditor";

export default function CodeOutput({
  executionResult,
  error
}: {
  executionResult: SubmissionResult | null;
  error: string | null;
}) {
  return (
    <div className="font-mono text-sm">
      {/* Execution Stats */}
      {executionResult && (
        <div className="text-muted-foreground mb-2 flex gap-4 text-xs">
          {typeof executionResult?.memory === "number" && (
            <span>Memory: {executionResult?.memory} KB</span>
          )}
          {executionResult?.time && (
            <span>Runtime: {executionResult?.time} sec</span>
          )}
        </div>
      )}

      {/* Output Content */}
      <div className="rounded-md bg-zinc-900 p-3">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : executionResult ? (
          <>
            {executionResult?.stderr ? (
              <pre className="whitespace-pre-wrap text-red-500">
                stderr: {executionResult?.stderr}
              </pre>
            ) : executionResult?.userAttempts ? (
              executionResult.userAttempts.every(
                (attempt) => attempt === true
              ) ? (
                <span className="text-green-500">Accepted</span>
              ) : (
                <span className="text-red-500">Not Accepted</span>
              )
            ) : (
              <span className="text-white">
                There was no output for you submission
              </span>
            )}
            {executionResult?.hint && (
              <div className="mt-3 border-t border-zinc-700 pt-3">
                <span className="text-yellow-400">Hint: </span>
                <span className="text-white">{executionResult.hint}</span>
              </div>
            )}
          </>
        ) : (
          <span className="text-white">
            Output will appear here after you submit your code {":)"}
          </span>
        )}
      </div>
    </div>
  );
}
