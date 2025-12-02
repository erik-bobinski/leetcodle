"use client";

import { getLocalDateString } from "@/lib/get-local-date";
import { Loader2 } from "lucide-react";
import { getProblem } from "@/app/actions/get-problem";
import { getUserSubmission } from "@/app/actions/get-user-submission";
import { MainLayout } from "@/components/MainLayout";
import type { GetProblem, UserSubmissionCode } from "@/types/database";
import { useQuery } from "@tanstack/react-query";

type ProblemData = {
  problem: GetProblem;
  template: GetProblem["template"];
  prerequisiteDataStructure: GetProblem["prerequisite_data_structure"];
  latestCode?: UserSubmissionCode | null;
  initialAttempts: boolean[][];
  date: string;
};

async function fetchProblemForLocalDate(): Promise<ProblemData> {
  const localDate = getLocalDateString();

  const getProblemResult = await getProblem(localDate);

  if ("error" in getProblemResult) {
    throw new Error(getProblemResult.error);
  }

  const problem = getProblemResult as GetProblem;

  const userSubmissionResult = await getUserSubmission(localDate);
  if (userSubmissionResult !== null && "error" in userSubmissionResult) {
    throw new Error(
      userSubmissionResult.error ?? "Failed to load user submission"
    );
  }

  return {
    problem,
    template: problem.template,
    prerequisiteDataStructure: problem.prerequisite_data_structure ?? null,
    latestCode: userSubmissionResult?.userSubmissionCode ?? null,
    initialAttempts: userSubmissionResult?.userSubmissionAttempts ?? [],
    date: localDate
  };
}

/**
 * Client component that determines the user's local date and fetches
 * the problem data client-side. This ensures each user sees the problem
 * for their local date (midnight local time release) without a redirect.
 */
export function LocalDateRedirect() {
  const { data, error, isLoading } = useQuery({
    queryKey: ["problem", "localDate"],
    queryFn: fetchProblemForLocalDate,
    staleTime: Infinity,
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold text-red-600">
            Error Loading Problem
          </h1>
          <p className="mb-2 text-lg text-gray-700">
            {error?.message ??
              "An unexpected error occurred, no problem data was found"}
          </p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page or reach out to{" "}
            <a
              href="https://twitter.com/erikbobinski"
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              twitter.com/erikbobinski
            </a>{" "}
            if the issue persists!
          </p>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      problem={data.problem}
      template={data.template}
      prerequisiteDataStructure={data.prerequisiteDataStructure}
      latestCode={data.latestCode}
      initialAttempts={data.initialAttempts}
      date={data.date}
    />
  );
}
