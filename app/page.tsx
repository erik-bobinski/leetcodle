import CodeEditor from "../components/CodeEditor";
import Navigation from "@/components/Navigation";

export default function Home() {
  return (
    <main className="min-h-screen w-full px-4 py-4 md:px-6 lg:px-8">
      <div className="mx-auto">
        <Navigation />
        <section className="space-y-6">
          <CodeEditor />
        </section>
      </div>
    </main>
  );
}
