"use client";

import CodeEditor from "../components/CodeEditor";
// import { PlayIcon } from "@radix-ui/react-icons";
// import { Button } from "@/components/ui/button";
import Wordle from "@/components/Wordle";
import { useState } from "react";
// import { languages } from "@/types/editor-languages";
// import { submitCode, pollExecutionResult } from "@/lib/judge0";
import type { Judge0ExecutionResponse } from "@/types/judge0";
import ReactMarkdown from "react-markdown";
import ExampleBox from "../components/ExampleBox";
import { getTodaysProblem } from "./actions/get-problem";
import { useQuery } from "@tanstack/react-query";

export default function Home() {
  // const [currentCode, setCurrentCode] = useState("");
  // const [currentLanguage, setCurrentLanguage] = useState("cpp");
  // const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<Judge0ExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    data: problem,
    isLoading,
    error: queryError
  } = useQuery({
    queryKey: ["getTodaysProblem"],
    queryFn: getTodaysProblem
  });

  return (
    <>
      {/* Problem Title and Description */}
      <div className="mt-6 mb-8 ml-6 text-center">
        {isLoading ? (
          <div>Loading...</div>
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
        ) : null}
      </div>

      <main className="flex flex-col md:flex-row">
        <div className="w-0.9 mx-6 md:w-2/3">
          <CodeEditor />
        </div>

        <div className="mr-4 flex flex-col items-center">
          <Wordle />
          {/* Output Box */}
          <div className="border-muted bg-background mt-4 mb-4 ml-8 min-h-[60px] max-w-xs min-w-[300px] flex-1 overflow-auto rounded-lg border font-mono text-sm shadow-lg">
            <div className="bg-muted text-primary flex items-center justify-between rounded-t-lg px-3 py-2 font-semibold">
              <span>Output</span>
              {executionResult && (
                <div className="text-muted-foreground flex gap-3 text-xs font-normal">
                  {typeof executionResult.memory === "number" && (
                    <span>Memory: {executionResult.memory} KB</span>
                  )}
                  {executionResult.time && (
                    <span>Time: {executionResult.time} s</span>
                  )}
                </div>
              )}
            </div>
            <div className="border-muted overflow-auto border-t px-3 py-2">
              {error ? (
                <span className="text-red-500">{error}</span>
              ) : executionResult ? (
                executionResult.stdout ? (
                  <pre>{executionResult.stdout}</pre>
                ) : executionResult.stderr ? (
                  <pre className="text-red-500">{executionResult.stderr}</pre>
                ) : (
                  <span>No output.</span>
                )
              ) : (
                <span className="text-muted-foreground">
                  Output will appear here after you submit your code {":)"}
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
