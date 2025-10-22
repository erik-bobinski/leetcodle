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
    <div className="border-muted bg-background mt-4 mb-4 ml-8 min-h-[60px] max-w-xs min-w-[300px] flex-1 overflow-auto rounded-lg border font-mono text-sm shadow-lg">
      <div className="bg-muted text-primary flex flex-col items-start rounded-t-lg px-3 py-2 font-semibold">
        <span>Output</span>
        {executionResult && (
          <div className="text-muted-foreground mt-1 flex gap-3 text-xs font-normal">
            {typeof executionResult?.memory === "number" && (
              <span>Memory: {executionResult?.memory} KB</span>
            )}
            {executionResult?.time && (
              <span>Time: {executionResult?.time} sec</span>
            )}
          </div>
        )}
      </div>
      <div className="border-muted overflow-auto border-t px-3 py-2">
        {error ? (
          <span className="text-red-500">{error}</span>
        ) : executionResult ? (
          executionResult?.stdout ? (
            <pre>{executionResult?.stdout}</pre>
          ) : executionResult?.stderr ? (
            <pre className="text-red-500">{executionResult?.stderr}</pre>
          ) : (
            <span>No output.</span>
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
