"use client";

import CodeEditor from "@/components/CodeEditor";
import CodeOutput from "@/components/CodeOutput";
import { GetProblem, UserSubmissionCode } from "@/types/database";
import { useState } from "react";
import { type SubmissionResult } from "@/components/CodeEditor";

export default function Playground({
  template,
  prerequisiteDataStructure,
  problemTitle,
  problemDescription,
  latestCode,
  date
}: {
  template: GetProblem["template"];
  prerequisiteDataStructure: GetProblem["prerequisite_data_structure"];
  problemTitle: GetProblem["title"];
  problemDescription: GetProblem["description"];
  latestCode?: UserSubmissionCode | null;
  date?: string;
}) {
  const [executionResult, setExecutionResult] =
    useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="flex flex-col md:flex-row">
      <div className="w-0.9 mx-6 md:w-2/3">
        <CodeEditor
          template={template}
          prerequisiteDataStructure={prerequisiteDataStructure}
          problemTitle={problemTitle}
          problemDescription={problemDescription}
          onSubmissionResult={(result) => {
            setError(result.stderr ?? null);
            setExecutionResult({
              stdout: result.stdout ?? null,
              stderr: result.stderr ?? null,
              hint: result.hint,
              time: result.time,
              memory: result.memory,
              graded: result.graded,
              userAttempts: result.userAttempts
            });
          }}
          latestCode={latestCode}
          date={date}
        />
      </div>

      <div className="mr-4 flex flex-col items-center">
        <CodeOutput executionResult={executionResult} error={error} />
      </div>
    </main>
  );
}
