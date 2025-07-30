"use client";

import { getTodaysProblem } from "@/app/actions/get-problem";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import ExampleBox from "./ExampleBox";
import { ShimmerTitle, ShimmerText, Shimmer } from "./ui/shimmer";

export default function ProblemDetails() {
  const {
    data: problem,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ["getTodaysProblem"],
    queryFn: getTodaysProblem
  });

  return (
    <div className="mt-6 mb-8 ml-6 text-center">
      {isLoading ? (
        <div className="space-y-6">
          <ShimmerTitle />
          <div className="mx-auto max-w-2xl">
            <ShimmerText lines={8} />
          </div>
          <div className="mx-auto max-w-sm">
            <Shimmer className="h-24 rounded-lg" />
          </div>
        </div>
      ) : queryError ? (
        <div className="text-red-500">{queryError.message}</div>
      ) : problem ? (
        <>
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          <ReactMarkdown>{problem.description}</ReactMarkdown>
          <ExampleBox
            input={problem.example_input}
            output={problem.example_output}
          />
        </>
      ) : (
        <div> Unexpected state occurred, this should be impossible! </div>
      )}
    </div>
  );
}
