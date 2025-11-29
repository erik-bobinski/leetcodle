import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
import { ArrowRightIcon } from "@radix-ui/react-icons";

export function Wordle({ attempts }: { attempts: boolean[][] }) {
  function Square({
    value = "",
    state = "empty"
  }: {
    value?: string;
    state?: "empty" | "passed" | "failed";
  }) {
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
        className="box-border flex aspect-square h-full w-full items-center justify-center rounded-md border text-xl font-bold"
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
    <div className="flex justify-center">
      {/* 6 x 6 Grid */}
      <div className="grid w-full max-w-sm grid-cols-6 grid-rows-6 gap-2">
        {/* Row 0 Cell 0: Top-left empty cell */}
        <div></div>
        {/* Row 0 Cells 1-5: Test Cases Axis, spans remaining 5 squares */}
        <div className="col-span-5 -mb-2 flex items-center justify-center text-sm font-medium select-none">
          Test Cases
          <ArrowRightIcon className="ml-1" />
        </div>
        {/* Remaining 5 rows x 6 columns each */}
        {Array.from({ length: 5 })
          // render user attempts in the grid
          .map((_, rowIdx) => [
            // Left axis: Attempts → (rotated vertical)
            <div
              key={`axis-${rowIdx}`}
              className="flex items-center justify-center text-sm font-medium select-none"
            >
              {rowIdx === 2 ? (
                <span className="flex rotate-90 items-center whitespace-nowrap">
                  Attempts
                  <ArrowRightIcon className="ml-1" />
                </span>
              ) : null}
            </div>,
            // Make each col for current row
            ...Array.from({ length: 5 }).map((_, colIdx) => {
              const attemptData = attempts[rowIdx];
              const testResult = attemptData?.[colIdx];

              return (
                <Square
                  key={`square-${rowIdx * 5 + colIdx}`}
                  state={
                    testResult === undefined
                      ? "empty"
                      : testResult
                        ? "passed"
                        : "failed"
                  }
                />
              );
            })
          ])
          .flat()}
      </div>
    </div>
  );
}
