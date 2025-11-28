"use client";

import CodeEditor from "@/components/CodeEditor";
import CodeOutput from "@/components/CodeOutput";
import { GetProblem, UserSubmissionCode } from "@/types/database";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface EditorPanelProps {
  template: GetProblem["template"];
  prerequisiteDataStructure: GetProblem["prerequisite_data_structure"];
  problemTitle: GetProblem["title"];
  problemDescription: GetProblem["description"];
  latestCode?: UserSubmissionCode | null;
  date?: string;
}

export default function EditorPanel({
  template,
  prerequisiteDataStructure,
  problemTitle,
  problemDescription,
  latestCode,
  date
}: EditorPanelProps) {
  const [executionResult, setExecutionResult] = useState<{
    stdout: string | null;
    stderr: string | null;
    time?: string;
    memory?: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOutputOpen, setIsOutputOpen] = useState(false);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Code Editor - takes remaining space */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pt-2 pb-2">
        <CodeEditor
          template={template}
          prerequisiteDataStructure={prerequisiteDataStructure}
          problemTitle={problemTitle}
          problemDescription={problemDescription}
          onSubmissionResult={(result) => {
            setError(result.error ?? null);
            setExecutionResult({
              stdout: result.stdout ?? null,
              stderr: result.error ?? null,
              time: result.time,
              memory: result.memory
            });
            // Auto-open output when there's a result
            setIsOutputOpen(true);
          }}
          latestCode={latestCode}
          date={date}
        />
      </div>

      {/* Collapsible Output Section */}
      <div className="border-t border-zinc-700">
        {/* Toggle Header */}
        <button
          onClick={() => setIsOutputOpen(!isOutputOpen)}
          className="hover:bg-accent/50 flex w-full cursor-pointer items-center justify-between px-4 py-2 transition-colors"
        >
          <span className="text-sm font-medium">Console</span>
          {isOutputOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>

        {/* Collapsible Content */}
        {isOutputOpen && (
          <div className="max-h-48 overflow-y-auto px-4 pb-4">
            <CodeOutput executionResult={executionResult} error={error} />
          </div>
        )}
      </div>
    </div>
  );
}
