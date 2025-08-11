export default function PrivacyPage() {
  return (
    <main className="max-w-4xl mx-auto p-8 text-gray-900 dark:text-gray-100">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="mb-4">
        Your privacy is important to us. This Privacy Policy explains how EXPREZZZO Power collects, uses, and protects your information.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">1. Information We Collect</h2>
      <p>
        We collect account information, API usage data, and session history for operational and billing purposes.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">2. How We Use Data</h2>
      <p>
        Data is used to provide, improve, and secure our services. We do not sell your personal information to third parties.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">3. Data Security</h2>
      <p>
        We use industry-standard encryption and secure hosting to protect your data.
      </p>
      <h2 className="text-xl font-semibold mt-6 mb-2">4. Contact Us</h2>
      <p>
        For questions about this policy, contact: privacy@exprezzzo.com
      </p>
      <p className="mt-8 text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </p>
    </main>
  );
}
