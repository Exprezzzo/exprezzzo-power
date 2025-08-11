import Link from 'next/link';

export default function DocsPage() {
  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">EXPREZZZO Power Documentation</h1>
      <p className="mb-4">Welcome to the EXPREZZZO Power docs. Choose a section to get started:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li><Link href="/docs/api" className="text-blue-500 hover:underline">API Reference</Link></li>
        <li><Link href="/docs/playground" className="text-blue-500 hover:underline">Playground Guide</Link></li>
      </ul>
    </main>
  );
}
