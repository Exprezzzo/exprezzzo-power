export default function APIDocsPage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">API Reference</h1>
      <p className="mb-4">Use the EXPREZZZO Power API to orchestrate AI models at $0.001 per request.</p>
      <h2 className="text-xl font-semibold mt-6 mb-2">Base URL</h2>
      <code className="block bg-gray-100 dark:bg-gray-800 p-2 rounded">
        https://exprezzzo-power.vercel.app
      </code>
      <h2 className="text-xl font-semibold mt-6 mb-2">Authentication</h2>
      <p>Include your API key in the `x-api-key` header.</p>
    </main>
  );
}
