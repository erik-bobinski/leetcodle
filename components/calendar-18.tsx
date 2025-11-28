"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { DayButton } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArchiveData } from "@/app/actions/get-archive-data";
import { CheckCircle, Clock, XCircle, Circle } from "lucide-react";
import { useRouter } from "next/navigation";

/**
 * Formats a Date object to YYYY-MM-DD string using local timezone.
 * This ensures consistent date handling across the app.
 */
function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

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
    const dateString = formatLocalDate(day.date);
    router.push(`/?date=${dateString}`);
  }

  // Get archive data for this specific day using local date format
  const dayData = archiveData.find((data) => {
    const dayDate = formatLocalDate(day.date);
    return data.date === dayDate;
  });

  // Get status icon based on submission status
  const getStatusIcon = (status: string) => {
    // Must use size-* class (not h-* w-*) to override button's default SVG sizing
    const iconClass = "size-6";
    switch (status) {
      case "completed":
        return (
          <span title="Passed">
            <CheckCircle className={`${iconClass} text-green-500`} />
          </span>
        );
      case "in_progress":
        return (
          <span title="In Progress">
            <Clock className={`${iconClass} text-yellow-500`} />
          </span>
        );
      case "failed":
        return (
          <span title="Failed">
            <XCircle className={`${iconClass} text-red-500`} />
          </span>
        );
      case "not_attempted":
      default:
        return (
          <span title="Not Attempted">
            <Circle className={`${iconClass} text-gray-400`} />
          </span>
        );
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
        <span title="Not Attempted">
          <Circle className="size-6 text-gray-400" />
        </span>
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
        "data-[selected-single=true]:bg-primary data-[selected-single=true]:text-primary-foreground data-[range-middle=true]:bg-accent data-[range-middle=true]:text-accent-foreground data-[range-start=true]:bg-primary data-[range-start=true]:text-primary-foreground data-[range-end=true]:bg-primary data-[range-end=true]:text-primary-foreground group-data-[focused=true]/day:border-ring group-data-[focused=true]/day:ring-ring/50 dark:hover:text-accent-foreground border-border m-0.5 flex size-auto h-20 w-full min-w-(--cell-size) cursor-pointer flex-col gap-0.5 rounded-md border leading-none font-normal group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px] data-[range-end=true]:rounded-md data-[range-end=true]:rounded-r-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md data-[range-start=true]:rounded-l-md [&>span]:text-xs [&>span]:opacity-70",
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
      classNames={{
        week: "flex w-full",
        day: "relative w-full p-0 text-center group/day select-none"
      }}
      components={{
        DayButton: (props) => (
          <CustomDayButton {...props} archiveData={archiveData} />
        )
      }}
    />
  );
}
