import CodeEditor from "../components/CodeEditor";
import { PlayIcon } from "@radix-ui/react-icons";
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
          <div className="flex min-h-0 w-1/2 flex-1 flex-col">
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
          <div className="">
            <Wordle />
          </div>
        </section>
      </div>
    </main>
  );
}
