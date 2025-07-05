import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GearIcon, PinRightIcon } from "@radix-ui/react-icons";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import React from "react";

export default function Navigation() {
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

  return (
    <header className="">
      <div className="flex h-16 flex-row items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Leetcodle</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            A new programming problem every day
          </p>
        </div>
        <div className="flex flex-row items-center gap-4">
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
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="hover:cursor-pointer">
                Sign In
                <PinRightIcon className="h-4 w-4" />
              </Button>
            </SignInButton>
          </SignedOut>
          <SignedIn>
            <UserButton fallback={<ShimmerCircle />} />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
