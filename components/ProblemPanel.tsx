"use client";

import ReactMarkdown from "react-markdown";
import type { GetProblem } from "@/types/database";
import { WordleGrid } from "@/components/WordleGrid";

interface ProblemPanelProps {
  problem: GetProblem;
  initialAttempts: boolean[][];
  date: string;
}

export default function ProblemPanel({
  problem,
  initialAttempts,
  date
}: ProblemPanelProps) {
  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      {/* Problem Title */}
      <h1 className="mb-4 text-2xl font-bold">
        {problem.problem_number}. {problem.title}
      </h1>

      {/* Problem Description */}
      <div className="prose prose-invert mb-6 max-w-none">
        <ReactMarkdown>{problem.description}</ReactMarkdown>
      </div>

      {/* Example Box */}
      <div className="mb-6">
        <h2 className="mb-3 text-lg font-semibold">Example:</h2>
        <div
          className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 font-mono text-sm"
          style={{ backgroundColor: "var(--tw-prose-pre-bg, #232323)" }}
        >
          <div>
            <span className="font-semibold text-green-400">Input:</span>
            <span className="ml-2 text-green-200">
              <ReactMarkdown>{problem.example_input}</ReactMarkdown>
            </span>
          </div>
          <div className="mt-3">
            <span className="font-semibold text-cyan-400">Output:</span>
            <span className="ml-2 text-green-200">
              <ReactMarkdown>{problem.example_output}</ReactMarkdown>
            </span>
          </div>
        </div>
      </div>

      {/* Wordle Grid */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Your Progress:</h2>
        <WordleGrid initialAttempts={initialAttempts} date={date} />
      </div>
    </div>
  );
}
