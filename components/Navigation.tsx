import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GearIcon } from "@radix-ui/react-icons";
import { ModeToggle } from "@/components/ui/ModeToggle";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/nextjs";

export default function Navigation() {
  return (
    <header className="mb-8">
      <div className="flex h-16 flex-row items-center justify-between">
        <div>
          <Link href="/" className="transition-opacity hover:opacity-80">
            <h1 className="text-4xl font-bold tracking-tight">Leetcodle</h1>
            <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
              A new programming problem every day
            </p>
          </Link>
        </div>
        <div className="flex flex-row items-center gap-4">
          <Link href="/settings">
            <Button variant="outline" size="icon" className="h-9 w-9">
              <GearIcon className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          <ModeToggle />
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
