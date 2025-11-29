"use client";

type ExecutionLike = {
  stdout: string | null | undefined;
  stderr: string | null | undefined;
  time?: string | undefined;
  memory?: number | undefined;
} | null;

export default function CodeOutput({
  executionResult,
  error
}: {
  executionResult: ExecutionLike;
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
          executionResult?.stdout ? (
            <pre className="whitespace-pre-wrap">
              stdout: {executionResult?.stdout}
            </pre>
          ) : executionResult?.stderr ? (
            <pre className="whitespace-pre-wrap text-red-500">
              stderr: {executionResult?.stderr}
            </pre>
          ) : (
            <span className="text-muted-foreground">No output.</span>
          )
        ) : (
          <span className="text-muted-foreground">
            Output will appear here after you submit your code {":)"}
          </span>
        )}
      </div>
    </div>
  );
}
