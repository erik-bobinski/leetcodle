import { getProblem } from "./actions/get-problem";
import ProblemDetails from "@/components/ProblemDetails";
import { connection } from "next/server";
import Playground from "@/components/Playground";
import { Wordle } from "@/components/Wordle";
import { getUserSubmission } from "./actions/get-user-submission";

// TODO: give some immediate feedback when changing routes, maybe via Loading.tsx?
// TODO: refactor getUserSubmission to use drizzle and tryCatch() wrapper
export default async function Home({
  searchParams
}: {
  searchParams: { date?: string };
}) {
  await connection();
  const getProblemResult = await getProblem(searchParams.date);

  // Handle error case
  if ("error" in getProblemResult) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold text-red-600">
            Error Loading Problem
          </h1>
          <p className="mb-2 text-lg text-gray-700">{getProblemResult.error}</p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page or reach out to
            twitter.com/erikbobinski if the issue persists!
          </p>
        </div>
      </div>
    );
  }

  const problem = getProblemResult;
  const template = problem.template;
  const prerequisite_data_structure =
    problem.prerequisite_data_structure ?? null;
  const userSubmission = await getUserSubmission(searchParams.date);

  return (
    <>
      {/* Problem Title and Description */}
      <ProblemDetails problem={problem} />

      <Playground
        latestCode={userSubmission?.latest_code}
        template={template}
        prerequisiteDataStructure={prerequisite_data_structure}
        problemTitle={problem?.title}
        problemDescription={problem?.description}
      />
      <Wordle attempts={userSubmission?.attempts ?? []} />
    </>
  );
}
