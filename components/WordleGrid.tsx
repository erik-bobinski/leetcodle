"use client";

import { Wordle } from "@/components/Wordle";
import { getUserSubmission } from "@/app/actions/get-user-submission";
import { getLocalSubmission } from "@/lib/local-submissions";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

interface WordleGridProps {
  initialAttempts: boolean[][];
  date?: string;
}

export function WordleGrid({ initialAttempts, date }: WordleGridProps) {
  const [attempts, setAttempts] = useState<boolean[][]>(initialAttempts);
  const { isSignedIn } = useAuth();

  // Refresh attempts from the server or localStorage
  const refreshAttempts = useCallback(async () => {
    try {
      if (isSignedIn) {
        // User is logged in - fetch from database
        const result = await getUserSubmission(date);
        if (result && !("error" in result)) {
          setAttempts(result.userSubmissionAttempts ?? []);
        }
      } else {
        // User is not logged in - fetch from localStorage
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

  return <Wordle attempts={attempts} />;
}
