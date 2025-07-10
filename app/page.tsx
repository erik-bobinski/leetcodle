"use client";

import CodeEditor from "../components/CodeEditor";
import { PlayIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import Wordle from "@/components/Wordle";
import { useState } from "react";
import { languages } from "@/types/editor-languages";
import { submitCode, pollExecutionResult } from "@/lib/judge0";
import type { Judge0ExecutionResponse } from "@/types/judge0";
import ReactMarkdown from "react-markdown";
import ExampleBox from "../components/ExampleBox";

export default function Home() {
  const [currentCode, setCurrentCode] = useState("");
  const [currentLanguage, setCurrentLanguage] = useState("cpp");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] =
    useState<Judge0ExecutionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleCodeChange(code: string) {
    setCurrentCode(code);
  }

  function handleLanguageChange(language: string) {
    setCurrentLanguage(language);
  }

  async function handleSubmit() {
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
  }

  return (
    <>
      {/* Problem Title and Description */}
      <div className="mt-6 mb-8 ml-6 text-center">
        <h1 className="text-2xl font-bold">Find the Missing Number</h1>
        <ReactMarkdown>
          {
            "Given an array `nums` containing `n` distinct numbers in the range `[0, n]`, return the only number in the range that is missing from the array."
          }
        </ReactMarkdown>
        <ExampleBox input="nums = [1,2,4,6]" output="[48,24,12,8]" />
      </div>

      <main className="flex flex-col md:flex-row">
        {/* Code Editor */}
        <div className="w-0.9 mx-6 md:w-2/3">
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
