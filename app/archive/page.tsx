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

  const archiveResult = await getArchiveData();
  if (archiveResult instanceof Error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="mb-4 text-xl font-bold text-red-600">
            Error Loading Archive
          </h1>
          <p className="mb-2 text-lg text-gray-700">{archiveResult.message}</p>
          <p className="text-sm text-gray-500">
            Please try refreshing the page or reach out to{" "}
            <a
              href="https://twitter.com/erikbobinski"
              className="text-blue-500 hover:underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              twitter.com/erikbobinski
            </a>{" "}
            if the issue persists!
          </p>
        </div>
      </div>
    );
  }
  const archiveData = archiveResult;

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Navigation Header */}
      <div className="mb-2 flex items-center justify-between">
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
      <div className="w-full">
        <Calendar18 archiveData={archiveData} />
      </div>
    </div>
  );
}
