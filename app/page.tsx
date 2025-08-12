import CodeEditor from "@/components/CodeEditor";
import Wordle from "@/components/Wordle";
import { getTodaysProblem } from "./actions/get-problem";
import { getQueryClient } from "./get-query-client";
// import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import ProblemDetails from "@/components/ProblemDetails";
import CodeOutput from "@/components/CodeOutput";

export default async function Home() {
  const queryClient = getQueryClient();
  await queryClient.prefetchQuery({
    queryKey: ["getTodaysProblem"],
    queryFn: getTodaysProblem
  });

  // Get the problem data to pass template to CodeEditor
  const problem = await getTodaysProblem();
  const template = problem?.template ?? null;

  return (
    <>
      {/* Problem Title and Description */}
      <ProblemDetails />

      <main className="flex flex-col md:flex-row">
        <div className="w-0.9 mx-6 md:w-2/3">
          <CodeEditor template={template} />
        </div>

        <div className="mr-4 flex flex-col items-center">
          <Wordle />
          {/* Output Box */}
          <CodeOutput />
        </div>
      </main>
    </>
  );
}
