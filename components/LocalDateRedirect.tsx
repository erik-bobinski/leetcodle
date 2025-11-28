"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getLocalDateString } from "@/lib/get-local-date";
import { Loader2 } from "lucide-react";

/**
 * Client component that determines the user's local date and redirects
 * to the home page with the date query parameter. This ensures each user
 * sees the problem for their local date (midnight local time release).
 */
export function LocalDateRedirect() {
  const router = useRouter();

  useEffect(() => {
    const localDate = getLocalDateString();
    router.replace(`/?date=${localDate}`);
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
    </div>
  );
}
