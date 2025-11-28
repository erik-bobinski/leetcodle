"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import ProblemPanel from "@/components/ProblemPanel";
import EditorPanel from "@/components/EditorPanel";
import type { GetProblem, UserSubmissionCode } from "@/types/database";

interface MainLayoutProps {
  problem: GetProblem;
  template: GetProblem["template"];
  prerequisiteDataStructure: GetProblem["prerequisite_data_structure"];
  latestCode?: UserSubmissionCode | null;
  initialAttempts: boolean[][];
  date: string;
}

export function MainLayout({
  problem,
  template,
  prerequisiteDataStructure,
  latestCode,
  initialAttempts,
  date
}: MainLayoutProps) {
  return (
    <div className="h-[calc(100vh-100px)] w-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Problem Details */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
          <ProblemPanel
            problem={problem}
            initialAttempts={initialAttempts}
            date={date}
          />
        </ResizablePanel>

        {/* Resize Handle */}
        <ResizableHandle withHandle />

        {/* Right Panel - Code Editor */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <EditorPanel
            template={template}
            prerequisiteDataStructure={prerequisiteDataStructure}
            problemTitle={problem.title}
            problemDescription={problem.description}
            latestCode={latestCode}
            date={date}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
