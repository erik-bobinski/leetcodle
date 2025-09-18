import ReactMarkdown from "react-markdown";
import ExampleBox from "./ExampleBox";

interface Problem {
  title: string;
  description: string;
  example_input: string;
  example_output: string;
}

export default function ProblemDetails({
  problem
}: {
  problem: Problem | null;
}) {
  return (
    <div className="mt-6 mr-6 mb-8 ml-6 text-center">
      {problem ? (
        <>
          <h1 className="text-2xl font-bold">{problem.title}</h1>
          <ReactMarkdown>{problem.description}</ReactMarkdown>
          <ExampleBox
            input={problem.example_input}
            output={problem.example_output}
          />
        </>
      ) : (
        <div>Could not find a problem for today.</div>
      )}
    </div>
  );
}
