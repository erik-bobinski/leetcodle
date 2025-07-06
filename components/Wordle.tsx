import { CheckIcon, Cross1Icon } from "@radix-ui/react-icons";
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
    <div className="mx-auto grid w-full max-w-xs grid-cols-5 grid-rows-5 gap-2">
      {Array.from({ length: 25 }).map((_, i) => (
        <Square key={i} />
      ))}
    </div>
  );
}
