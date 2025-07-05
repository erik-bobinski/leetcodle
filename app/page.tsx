import CodeEditor from "../components/CodeEditor";
import { ArrowRightIcon, PlayIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import Wordle from "@/components/Wordle";

export default function Home() {
  return (
    <main className="flex min-h-screen w-full flex-col px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-screen-2xl flex-1 flex-col">
        {/* Coding Problem */}
        <section className="mx-auto mb-4 flex flex-col items-center justify-center">
          <h2 className="mr-4 mb-4 font-bold">
            Coding Problem Name <span className="font-medium">X%</span>
          </h2>
          <p>Here goes the description of the coding problem.</p>
        </section>

        {/* Code Editor */}
        <section className="flex min-h-0 flex-1 gap-6">
          <div className="flex min-h-0 w-2/3 flex-col">
            <div className="min-h-0 flex-1">
              <CodeEditor />
              <div className="flex justify-start pt-2">
                <Button
                  type="button"
                  className="flex cursor-pointer items-center gap-2"
                >
                  <PlayIcon className="h-5 w-5" />
                  Submit
                </Button>
              </div>
            </div>
          </div>

          {/* Wordle */}
          <div className="flex w-1/3 flex-col items-center">
            <div className="relative mt-20">
              {/* Vertical axis on the left */}
              <div className="absolute top-0 bottom-0 -left-16 flex items-center">
                <div className="relative flex flex-col items-center">
                  <div className="absolute inset-0 flex flex-col items-center">
                    <div className="bg-foreground/60 h-32 w-px"></div>
                  </div>
                  <span className="bg-background relative z-10 flex rotate-90 items-center">
                    Attempts
                    <ArrowRightIcon className="ml-1 h-5 w-5" />
                  </span>
                </div>
              </div>
              {/* Horizontal Axis */}
              <div className="mb-2 text-center">
                <span className="inline-flex items-center gap-1">
                  Test Cases
                  <ArrowRightIcon className="h-5 w-5" />
                </span>
              </div>
              <Wordle />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
