import CodeEditor from "../components/CodeEditor";
import { Button } from "@/components/ui/button";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton
} from "@clerk/nextjs";
import { GearIcon } from "@radix-ui/react-icons";
import { ModeToggle } from "@/components/ui/ModeToggle";

export default function Home() {
  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto">
        <header className="mb-8">
          <div className="flex h-16 flex-row items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold tracking-tight">Leetcodle</h1>
              <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
                A new programming problem every day
              </p>
            </div>
            <div className="flex flex-row items-center gap-4">
              <Button variant="outline" size="icon" className="h-9 w-9">
                <GearIcon className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Button>
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

        {/* <div className="flex h-16 items-center justify-end gap-4 p-4">
          <Button variant="outline" size="icon" className="h-9 w-9">
            <GearIcon className="h-5 w-5" />
            <span className="sr-only">Settings</span>
          </Button>
          <ModeToggle />
          <SignedOut>
            <SignInButton />
            <SignUpButton />
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div> */}

        <section className="space-y-6">
          <CodeEditor />
        </section>
      </div>
      <Button>Click me</Button>
    </main>
  );
}
