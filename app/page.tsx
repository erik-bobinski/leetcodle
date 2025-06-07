import CodeEditor from "./components/CodeEditor";

export default function Home() {
  return (
    <main className="min-h-screen w-full px-4 py-8 md:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Leetcodle</h1>
          <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">
            A new programming problem every day
          </p>
        </header>

        <section className="space-y-6">
          <CodeEditor />
        </section>
      </div>
    </main>
  );
}
