import { getProblem } from "./actions/get-problem";
import { connection } from "next/server";
import { getUserSubmission } from "./actions/get-user-submission";
import type { GetProblem } from "@/types/database";
import { LocalDateRedirect } from "@/components/LocalDateRedirect";
import { MainLayout } from "@/components/MainLayout";

export default async function Home({
  searchParams
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await connection();
  const params = await searchParams;

  // If no date provided, use client component to get browser's local date
  if (!params.date) {
    return <LocalDateRedirect />;
  }

  const getProblemResult = await getProblem(params.date);

  if ("error" in getProblemResult) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold text-red-600">
            Error Loading Problem
          </h1>
          <p className="mb-2 text-lg text-gray-700">{getProblemResult.error}</p>
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

  const problem = getProblemResult as GetProblem;
  const template = problem.template;
  const prerequisite_data_structure =
    problem.prerequisite_data_structure ?? null;

  const userSubmissionResult = await getUserSubmission(params.date);
  if (userSubmissionResult !== null && "error" in userSubmissionResult) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold text-red-600">
            Error Loading Problem
          </h1>
          <p className="mb-2 text-lg text-gray-700">
            {userSubmissionResult.error}
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
      problem={problem}
      template={template}
      prerequisiteDataStructure={prerequisite_data_structure}
      latestCode={userSubmissionResult?.userSubmissionCode}
      initialAttempts={userSubmissionResult?.userSubmissionAttempts ?? []}
      date={params.date}
    />
  );
}
