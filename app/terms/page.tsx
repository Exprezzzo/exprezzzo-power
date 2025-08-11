export default function TermsPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="mb-4">
        Welcome to EXPREZZZO Power. By using our platform, API, or services, you agree to comply with the following terms.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Acceptance of Terms</h2>
      <p>
        By accessing or using EXPREZZZO Power, you agree to be bound by these Terms of Service and our Privacy Policy.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. Use of Service</h2>
      <p>
        You may use our API and Playground in compliance with applicable laws and these terms. Abuse, reverse engineering, or malicious use is prohibited.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. API Usage</h2>
      <p>
        API access is billed per request at the advertised rate. We reserve the right to suspend accounts for abuse or non-payment.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Changes to Terms</h2>
      <p>
        We may update these terms at any time. Continued use of our services after changes indicates acceptance.
      </p>
      <p className="mt-8 text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </main>
  );
}
