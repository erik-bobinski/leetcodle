"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  GearIcon,
  PinRightIcon,
  ClockIcon,
  QuestionMarkCircledIcon
} from "@radix-ui/react-icons";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { SignInButton, UserButton, useClerk, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import HelpModal from "@/components/HelpModal";

// Shimmer placeholder component
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
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 hover:cursor-pointer"
            onClick={() => setIsHelpModalOpen(true)}
          >
            <QuestionMarkCircledIcon className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button>
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
          <ModeToggle />
          {!isLoaded ? (
            <ShimmerCircle />
          ) : isSignedIn ? (
            <UserButton fallback={<ShimmerCircle />} />
          ) : (
            <SignInButton mode="modal">
              <Button className="hover:cursor-pointer">
                Sign In
                <PinRightIcon className="h-4 w-4" />
              </Button>
            </SignInButton>
          )}
        </div>
      </div>

      {/* Help Modal */}
      <HelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </header>
  );
}
