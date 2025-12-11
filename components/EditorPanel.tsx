import { CodeEditor, type SubmissionResult } from "@/components/CodeEditor";
import CodeOutput from "@/components/CodeOutput";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import { GetProblem, UserSubmissionCode } from "@/types/database";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { ImperativePanelHandle } from "react-resizable-panels";

interface EditorPanelProps {
  template: GetProblem["template"];
  prerequisiteDataStructure: GetProblem["prerequisite_data_structure"];
  problemTitle: GetProblem["title"];
  problemDescription: GetProblem["description"];
  latestCode?: UserSubmissionCode | null;
  date?: string;
  isSubmitDisabled?: boolean;
  isCompleted?: boolean;
}

export default function EditorPanel({
  template,
  prerequisiteDataStructure,
  problemTitle,
  problemDescription,
  latestCode,
  date,
  isSubmitDisabled,
  isCompleted
}: EditorPanelProps) {
  const [executionResult, setExecutionResult] =
    useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isConsoleCollapsed, setIsConsoleCollapsed] = useState(true);
  const consolePanelRef = useRef<ImperativePanelHandle>(null);

  // Collapse console on mount to match initial state
  useEffect(() => {
    consolePanelRef.current?.collapse();
  }, []);

  function toggleConsole() {
    const panel = consolePanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  }

  return (
    <div className="relative flex h-full flex-col">
      <ResizablePanelGroup direction="vertical" className="min-h-0 flex-1">
        {/* Code Editor Panel */}
        <ResizablePanel defaultSize={75} minSize={30}>
          <div className="flex h-full flex-col overflow-hidden px-4 pt-2 pb-2">
            <CodeEditor
              template={template}
              prerequisiteDataStructure={prerequisiteDataStructure}
              problemTitle={problemTitle}
              problemDescription={problemDescription}
              onSubmissionResult={(result) => {
                setError(result.stderr ?? null);
                setExecutionResult({
                  graded: result.graded,
                  userAttempts: result.userAttempts,
                  stdout: result.stdout ?? null,
                  stderr: result.stderr ?? null,
                  hint: result.hint ?? null,
                  time: result.time,
                  memory: result.memory
                });
                // Auto-expand console when there's a result
                if (consolePanelRef.current?.isCollapsed()) {
                  consolePanelRef.current.expand();
                }
              }}
              latestCode={latestCode}
              date={date}
              isSubmitDisabled={isSubmitDisabled}
              isCompleted={isCompleted}
            />
          </div>
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle withHandle />

        {/* Console Panel */}
        <ResizablePanel
          ref={consolePanelRef}
          defaultSize={25}
          minSize={10}
          maxSize={60}
          collapsible
          collapsedSize={0}
          onCollapse={() => setIsConsoleCollapsed(true)}
          onExpand={() => setIsConsoleCollapsed(false)}
        >
          <div className="border-border flex h-full flex-col overflow-hidden border-t">
            {/* Console Header */}
            <button
              onClick={toggleConsole}
              className="hover:bg-accent/50 flex w-full cursor-pointer items-center gap-1 px-4 py-2 transition-colors"
            >
              <span className="text-sm font-medium">Console</span>
              {isConsoleCollapsed ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>

            {/* Console Content */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              <CodeOutput executionResult={executionResult} error={error} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Collapsed Console Bar - shown when console is collapsed */}
      {isConsoleCollapsed && (
        <button
          onClick={toggleConsole}
          className="hover:bg-accent/50 border-border flex w-full cursor-pointer items-center gap-1 border-t px-4 py-2 transition-colors"
        >
          <span className="text-sm font-medium">Console</span>
          <ChevronUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
