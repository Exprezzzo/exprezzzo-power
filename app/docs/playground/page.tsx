export default function PlaygroundDocsPage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Playground Guide</h1>
      <p className="mb-4">The EXPREZZZO Power Playground lets you interact with AI models in real time.</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>Choose a model from the dropdown.</li>
        <li>Toggle memory to control context retention.</li>
        <li>Track cost and tokens live during a session.</li>
      </ul>
    </main>
  );
}
