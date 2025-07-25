// app/contact/page.tsx
'use client'; // This page needs to be client component for form state

import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Phone } from 'lucide-react';
import { useState } from 'react';
import { APP_NAME } from '@/lib/constants'; // Import APP_NAME

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setStatusMessage('');

    // TODO: Implement actual contact form submission logic (e.g., to a backend API route)
    // For now, it's a dummy submission
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      setStatusMessage('Message sent successfully! We\'ll get back to you soon.');
      setFormData({ name: '', email: '', subject: '', message: '' }); // Clear form
    } catch (error) {
      setStatusMessage('Failed to send message. Please try again later.');
      console.error('Contact form submission error:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold">
            ⚡ {APP_NAME}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center text-gray-400 hover:text-white"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to home
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-5xl font-bold mb-12">Get in Touch</h1>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Contact Information</h2>

            <div className="space-y-6">
              <div className="flex items-start">
                <Mail className="text-blue-400 mr-4 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-gray-400">support@exprezzzo.com</p>
                  <p className="text-sm text-gray-500 mt-1">We'll respond within 24 hours</p>
                </div>
              </div>

              <div className="flex items-start">
                <MessageSquare className="text-green-400 mr-4 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold mb-1">Live Chat</h3>
                  <p className="text-gray-400">Available Mon-Fri, 9am-5pm PST</p>
                </div>
              </div>

              <div className="flex items-start">
                <Phone className="text-purple-400 mr-4 mt-1" size={24} />
                <div>
                  <h3 className="font-semibold mb-1">Enterprise Sales</h3>
                  <p className="text-gray-400">Schedule a demo call</p>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-900 rounded-xl border border-gray-800">
              <h3 className="font-semibold mb-3">Need immediate help?</h3>
              <p className="text-gray-400 text-sm mb-4">
                Check our documentation and FAQ for instant answers to common questions.
              </p>
              <div className="flex gap-4">
                <Link href="/docs" className="text-blue-400 hover:underline text-sm">
                  View Docs
                </Link>
                <Link href="/faq" className="text-blue-400 hover:underline text-sm">
                  Read FAQ
                </Link>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Send us a Message</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  required
                />
              </div>

              {statusMessage && (
                <div className={`p-3 rounded-lg text-sm ${statusMessage.includes('sent successfully') ? 'bg-green-500/10 text-green-400 border border-green-500/50' : 'bg-red-500/10 text-red-400 border border-red-500/50'}`}>
                  {statusMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-all duration-200"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
