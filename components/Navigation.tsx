"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from "@/components/ui/tooltip";
import {
  GearIcon,
  PinRightIcon,
  ClockIcon,
  QuestionMarkCircledIcon,
  HomeIcon
} from "@radix-ui/react-icons";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { SignInButton, UserButton, useClerk, useAuth } from "@clerk/nextjs";
import { useEffect, useState, useMemo } from "react";
import HelpModal from "@/components/HelpModal";
import { getLocalDateString } from "@/lib/get-local-date";

function ShimmerCircle() {
  return (
    <div
      className="relative h-9 w-9 animate-pulse overflow-hidden rounded-full bg-gray-300 dark:bg-gray-700"
      aria-hidden="true"
    >
      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/60 to-transparent dark:via-gray-600/60" />
    </div>
  );
}

export default function Navigation() {
  const { session } = useClerk();
  const { isLoaded, isSignedIn } = useAuth();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const searchParams = useSearchParams();

  // Check if viewing a date that's not today's local date
  const isViewingPastDate = useMemo(() => {
    const dateParam = searchParams.get("date");
    if (dateParam) {
      const localDate = getLocalDateString();
      return dateParam !== localDate;
    }
    return false;
  }, [searchParams]);

  // Clear localStorage user preferences when user signs out
  useEffect(() => {
    if (!session) {
      // User is signed out, clear localStorage preferences
      if (typeof window !== "undefined") {
        localStorage.removeItem("userPreferences");
      }
    }
  }, [session]);

  return (
    <header className="">
      <div className="flex h-16 flex-row items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">
            {"Leetcodle(site is WIP!)"}
          </h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            A new programming problem every day
          </p>
        </div>
        <div className="flex flex-row items-center gap-4">
          {isViewingPastDate && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/">
                  <Button
                    variant="outline"
                    className="h-9 gap-2 hover:cursor-pointer"
                  >
                    <HomeIcon className="h-4 w-4" />
                    <span>Today</span>
                  </Button>
                </Link>
              </TooltipTrigger>
              <TooltipContent>Go to today&apos;s problem</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 hover:cursor-pointer"
                onClick={() => setIsHelpModalOpen(true)}
              >
                <QuestionMarkCircledIcon className="h-5 w-5" />
                <span className="sr-only">Help</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>How to play</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/archive">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:cursor-pointer"
                >
                  <ClockIcon className="h-5 w-5" />
                  <span className="sr-only">Archive</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>View past problems</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href="/settings">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 hover:cursor-pointer"
                >
                  <GearIcon className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </Link>
            </TooltipTrigger>
            <TooltipContent>Editor settings</TooltipContent>
          </Tooltip>
          <ModeToggle />
          {!isLoaded ? (
            <ShimmerCircle />
          ) : isSignedIn ? (
            <UserButton fallback={<ShimmerCircle />} />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <SignInButton mode="modal">
                  <Button className="hover:cursor-pointer">
                    Sign In
                    <PinRightIcon className="h-4 w-4" />
                  </Button>
                </SignInButton>
              </TooltipTrigger>
              <TooltipContent>Sign in to save progress</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>

      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </header>
  );
}
