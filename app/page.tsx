"use client";

import CodeEditor from "../components/CodeEditor";
import { ArrowRightIcon, PlayIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import Wordle from "@/components/Wordle";
import { useState } from "react";
import { languages } from "@/types/editor-languages";
import { submitCode, pollExecutionResult } from "@/lib/judge0";
import type { Judge0ExecutionResponse } from "@/types/judge0";

export default function Home() {
  const [currentCode, setCurrentCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("cpp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<Judge0ExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (code: string) => {
    setCurrentCode(code);
  };

  const handleLanguageChange = (language: string) => {
    setCurrentLanguage(language);
  };

  const handleSubmit = async () => {
    if (!currentCode.trim()) {
      setError("Please enter some code to submit");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setExecutionResult(null);

    try {
      const languageId =
        languages[currentLanguage as keyof typeof languages].language_id;
      const token = await submitCode(currentCode, languageId);

      if (typeof token === "string" && token.startsWith("Error")) {
        setError(token);
        return;
      }

      // Poll for results
      const result = await pollExecutionResult(token);

      if (typeof result === "string" && result.startsWith("Error")) {
        setError(result);
        return;
      }

      setExecutionResult(result as Judge0ExecutionResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen w-full flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-screen-2xl flex-1 flex-col">
        {/* Coding Problem */}
        <section className="mx-auto mb-4 flex flex-col items-center justify-center">
          <h2 className="mr-4 mb-4 font-bold">
            Coding Problem Name <span className="font-medium">X%</span>
          </h2>
          <p>Here goes the description of the coding problem.</p>
        </section>

        {/* Code Editor */}
        <section className="flex min-h-0 flex-1 flex-col gap-6 md:flex-row">
          <div className="flex min-h-0 w-full flex-col md:w-2/3">
            <div className="min-h-0 flex-1">
              <CodeEditor
                onCodeChange={handleCodeChange}
                onLanguageChange={handleLanguageChange}
              />
              <div className="flex justify-start pt-2">
                <Button
                  type="button"
                  className="flex cursor-pointer items-center gap-2"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                >
                  <PlayIcon className="h-5 w-5" />
                  {isSubmitting ? "Running..." : "Submit"}
                </Button>
              </div>
            </div>
          </div>

          {/* Wordle + Results */}
          <div className="flex w-full flex-col items-start md:w-1/3">
            <div className="w-full" style={{ minHeight: "auto" }}>
              <div className="flex items-center justify-center">
                Test Cases <ArrowRightIcon />
              </div>
              <div className="flex origin-left rotate-90 items-center justify-center">
                Attemps <ArrowRightIcon />
              </div>
              <div className="-mt-4 ml-4">
                <Wordle />
              </div>
            </div>
            {/* Results Display - always visible */}
            <div className="bg-background text-foreground border-border mt-4 w-full rounded border p-4 shadow-sm">
              <h3 className="mb-2 font-semibold">Execution Results</h3>
              {error && (
                <div className="mb-2 text-red-600 dark:text-red-400">
                  <strong>Error:</strong> {error}
                </div>
              )}
              {executionResult ? (
                <div className="space-y-2">
                  <div>
                    <strong>Status:</strong>{" "}
                    {typeof executionResult === "object" &&
                    executionResult.status &&
                    executionResult.status.description
                      ? executionResult.status.description
                      : typeof executionResult === "string"
                        ? executionResult
                        : "Unknown status"}
                  </div>
                  {executionResult.stdout && (
                    <div>
                      <strong>Output:</strong>
                      <pre className="bg-muted text-foreground dark:bg-muted dark:text-foreground mt-1 overflow-x-auto rounded p-2 text-sm">
                        {executionResult.stdout}
                      </pre>
                    </div>
                  )}
                  {executionResult.stderr && (
                    <div>
                      <strong>Error Output:</strong>
                      <pre className="mt-1 overflow-x-auto rounded bg-red-100 p-2 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
                        {executionResult.stderr}
                      </pre>
                    </div>
                  )}
                  {executionResult.compile_output && (
                    <div>
                      <strong>Compilation Output:</strong>
                      <pre className="mt-1 overflow-x-auto rounded bg-yellow-100 p-2 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                        {executionResult.compile_output}
                      </pre>
                    </div>
                  )}
                  <div className="text-muted-foreground text-sm">
                    <span>Time: {executionResult.time}s</span>
                    <span className="ml-4">
                      Memory: {executionResult.memory}KB
                    </span>
                  </div>
                </div>
              ) : (
                !error && (
                  <div className="text-muted-foreground text-sm italic">
                    No output yet. Run your code to see results here.
                  </div>
                )
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
