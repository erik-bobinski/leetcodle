import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { ArrowRightIcon } from "@radix-ui/react-icons";

interface SquareProps {
  value?: string;
  state?: "empty" | "passed" | "failed";
}

export default function Wordle() {
  function Square({ value = "", state = "empty" }: SquareProps) {
    function getSquareStyles() {
      switch (state) {
        case "passed":
          return {
            backgroundColor: "rgb(34 197 94)", // green-500
            borderColor: "rgb(34 197 94)",
            color: "white"
          };
        case "failed":
          return {
            backgroundColor: "rgb(239 68 68)", // red-500
            borderColor: "rgb(239 68 68)",
            color: "white"
          };
        default:
          return {
            borderColor: "var(--primary)"
          };
      }
    }

    function getSquareContent() {
      if (state === "passed") {
        return <CheckIcon className="h-6 w-6" />;
      }
      if (state === "failed") {
        return <Cross1Icon className="h-6 w-6" />;
      }
      return value;
    }

    return (
      <div
        className="box-border flex aspect-square h-full w-full items-center justify-center rounded-md border text-2xl font-bold"
        style={{
          userSelect: "none",
          ...getSquareStyles()
        }}
      >
        {getSquareContent()}
      </div>
    );
  }

  return (
    <div className="flex w-full justify-center">
      <div className="grid w-full max-w-xs grid-cols-6 grid-rows-6 gap-2">
        {/* Top-left empty cell */}
        <div></div>
        {/* Top axis: Test Cases → */}
        <div className="col-span-5 -mb-4 flex items-center justify-center text-sm font-medium select-none">
          Test Cases
          <ArrowRightIcon className="ml-1" />
        </div>
        {/* Left axis and Wordle squares */}
        {Array.from({ length: 5 })
          .map((_, rowIdx) => [
            // Left axis: Attempts → (rotated)
            <div
              key={`axis-${rowIdx}`}
              className="flex items-center justify-center text-sm font-medium select-none"
            >
              {rowIdx === 2 ? (
                <span className="flex rotate-90 items-center">
                  Attempts
                  <ArrowRightIcon className="ml-1" />
                </span>
              ) : null}
            </div>,
            // Wordle squares for this row
            ...Array.from({ length: 5 }).map((_, colIdx) => (
              <Square key={`square-${rowIdx * 5 + colIdx}`} />
            ))
          ])
          .flat()}
      </div>
    </div>
  );
}
