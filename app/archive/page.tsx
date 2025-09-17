import { auth } from "@clerk/nextjs/server";
import Calendar18 from "@/components/calendar-18";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function Archive() {
  const { userId } = await auth();

  if (!userId) {
    return <div>Login to see your history</div>;
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-4">
      {/* Navigation Header */}
      <div className="mb-4 flex items-center">
        <Link
          href="/"
          className="text-foreground/70 hover:text-foreground hover:bg-accent/50 flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="text-base font-medium">Back to Home</span>
        </Link>
      </div>

      {/* Calendar Content */}
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full items-center justify-center">
          <Calendar18 />
        </div>
      </div>
    </div>
  );
}
