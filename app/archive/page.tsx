import { auth } from "@clerk/nextjs/server";
import Calendar18 from "@/components/calendar-18";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getArchiveData } from "@/app/actions/get-archive-data";

export default async function Archive() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center">
        <Link
          href="/"
          className="text-foreground/70 hover:text-foreground hover:bg-accent/50 flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="text-base font-medium">Back to Home</span>
        </Link>
        <h2 className="mt-8 text-center text-2xl font-semibold">
          Login to see your history!
        </h2>
      </div>
    );
  }

  // Fetch archive data server-side
  const archiveData = await getArchiveData();

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Navigation Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="text-foreground/70 hover:text-foreground hover:bg-accent/50 flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="text-base font-medium">Back to Home</span>
        </Link>

        {/* Archive Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Archive</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Your problem solving history
          </p>
        </div>

        {/* Spacer to balance the layout */}
        <div className="w-[140px]"></div>
      </div>

      {/* Calendar Content */}
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full items-center justify-center">
          <Calendar18 archiveData={archiveData} />
        </div>
      </div>
    </div>
  );
}
