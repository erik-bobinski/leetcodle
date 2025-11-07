"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { DayButton } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArchiveData } from "@/app/actions/get-archive-data";
import { CheckCircle, Clock, XCircle, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

// Custom DayButton component to override day content
function CustomDayButton({
  className,
  day,
  modifiers,
  archiveData,
  ...props
}: React.ComponentProps<typeof DayButton> & { archiveData: ArchiveData[] }) {
  const ref = React.useRef<HTMLButtonElement>(null);
  const router = useRouter();

  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    e.stopPropagation();
    const dateString = day.date.toISOString().split("T")[0];
    router.push(`/?date=${dateString}`);
  }

  // Get archive data for this specific day
  const dayData = archiveData.find((data) => {
    const dayDate = day.date.toISOString().split("T")[0];
    return data.date === dayDate;
  });

  // Get status icon based on submission status
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "not_attempted":
      default:
        return <Circle className="h-4 w-4 text-gray-400" />;
    }
  };

  // Custom content for each day
  const getDayContent = (dayNumber: number) => {
    if (dayData?.problem) {
      return (
        <div className="flex w-full flex-col items-center justify-center gap-1 p-1">
          <div
            className="w-full overflow-hidden text-center text-xs leading-tight font-medium break-words whitespace-normal"
            style={{ maxWidth: "120px" }}
          >
            {dayData.problem.title}
          </div>
          {getStatusIcon(dayData.submission?.attempt_status || "not_attempted")}
        </div>
      );
    }

    // Fallback for days without problems
    return (
      <div className="flex flex-col items-center justify-center gap-1 p-1">
        <div className="text-xs font-medium">{dayNumber}</div>
        <Circle className="h-4 w-4 text-gray-400" />
      </div>
    );
  };

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground border-border m-1 flex aspect-square size-auto w-full min-w-(--cell-size) cursor-pointer flex-col gap-1 rounded-md border leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
        className
      )}
      {...props}
      onClick={handleClick}
    >
      {getDayContent(day.date.getDate())}
    </Button>
  );
}

export default function Calendar18({
  archiveData
}: {
  archiveData: ArchiveData[];
}) {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  return (
    <Calendar
      mode="single"
      selected={date}
      onSelect={setDate}
      className="w-full max-w-full rounded-lg border"
      buttonVariant="ghost"
      showOutsideDays={false}
      components={{
        DayButton: (props) => (
          <CustomDayButton {...props} archiveData={archiveData} />
        )
      }}
    />
  );
}
