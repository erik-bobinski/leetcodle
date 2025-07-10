import React from "react";

interface ExampleBoxProps {
  input: string;
  output: string;
}

export default function ExampleBox({ input, output }: ExampleBoxProps) {
  return (
    <div className="my-6 flex flex-col items-center">
      <h2 className="mb-4 text-xl font-bold">{"Example:"}</h2>
      <div
        className="mx-auto max-w-fit rounded-lg border border-zinc-700 bg-zinc-900 p-6 font-mono text-base text-white transition-colors dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
        style={{ backgroundColor: "var(--tw-prose-pre-bg, #232323)" }}
      >
        <div>
          <span className="font-semibold text-green-400">Input:</span>
          <span className="ml-2 text-green-200">{input}</span>
        </div>
        <div className="mt-4">
          <span className="font-semibold text-cyan-400">Output:</span>
          <span className="ml-2 text-green-200">{output}</span>
        </div>
      </div>
    </div>
  );
}
