export default function Wordle() {
  function Square({ value = "" }) {
    return (
      <div
        className="flex h-12 w-12 items-center justify-center rounded-md border text-2xl font-bold"
        style={{
          userSelect: "none",
          borderColor: "var(--primary)"
        }}
      >
        {value}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: 25 }).map((_, i) => (
        <Square key={i} />
      ))}
    </div>
  );
}
