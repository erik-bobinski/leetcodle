"use client";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import ProblemPanel from "@/components/ProblemPanel";
import EditorPanel from "@/components/EditorPanel";
import type { GetProblem, UserSubmissionCode } from "@/types/database";
import { useState, useEffect, useCallback } from "react";
import { getUserSubmission } from "@/app/actions/get-user-submission";
import { getLocalSubmission } from "@/lib/local-submissions";
import { useAuth } from "@clerk/nextjs";

const MAX_ATTEMPTS = 5;

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
  latestCode: initialLatestCode,
  initialAttempts,
  date
}: MainLayoutProps) {
  const [attempts, setAttempts] = useState<boolean[][]>(initialAttempts);
  const [latestCode, setLatestCode] = useState<
    UserSubmissionCode | null | undefined
  >(initialLatestCode);
  const { isSignedIn } = useAuth();

  // Check if user has used all attempts
  const hasMaxAttempts = attempts.length >= MAX_ATTEMPTS;

  // Check if problem is completed (all test cases passed in any attempt)
  const isCompleted = attempts.some(
    (attempt) =>
      attempt.length > 0 && attempt.every((result) => result === true)
  );

  // Refresh attempts from the server or localStorage
  const refreshAttempts = useCallback(async () => {
    try {
      if (isSignedIn) {
        const result = await getUserSubmission(date);
        if (result && !("error" in result)) {
          setAttempts(result.userSubmissionAttempts ?? []);
        }
      } else {
        const targetDate = date || new Date().toISOString().split("T")[0];
        const localSubmission = getLocalSubmission(targetDate);
        if (localSubmission) {
          setAttempts(localSubmission.attempts);
        } else {
          setAttempts([]);
        }
      }
    } catch (error) {
      console.error("Failed to refresh attempts:", error);
    }
  }, [date, isSignedIn]);

  // Load data from localStorage on mount for non-signed-in users
  useEffect(() => {
    // Only load from localStorage if not signed in and no data was provided from server
    if (!isSignedIn) {
      const targetDate = date || new Date().toISOString().split("T")[0];
      const localSubmission = getLocalSubmission(targetDate);
      if (localSubmission) {
        // Load attempts if not already loaded
        if (
          initialAttempts.length === 0 &&
          localSubmission.attempts.length > 0
        ) {
          setAttempts(localSubmission.attempts);
        }
        // Load code if not already loaded
        if (!initialLatestCode && localSubmission.code) {
          setLatestCode({
            language: localSubmission.language,
            code: localSubmission.code
          });
        }
      }
    }
  }, [isSignedIn, date, initialAttempts.length, initialLatestCode]);

  // Listen for custom event to refresh attempts
  useEffect(() => {
    const handleRefresh = () => {
      refreshAttempts();
    };

    window.addEventListener("wordle-refresh", handleRefresh);
    return () => {
      window.removeEventListener("wordle-refresh", handleRefresh);
    };
  }, [refreshAttempts]);

  return (
    <div className="h-[calc(100vh-100px)] w-full overflow-hidden">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Problem Details */}
        <ResizablePanel defaultSize={40} minSize={25} maxSize={60}>
          <ProblemPanel problem={problem} attempts={attempts} />
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
            isSubmitDisabled={hasMaxAttempts || isCompleted}
            isCompleted={isCompleted}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
