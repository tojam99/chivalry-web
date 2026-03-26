'use client';

import { useState } from 'react';
import Link from 'next/link';

const SUPABASE_URL = 'https://pkekuxksofbzjrieesqm.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/contact-form`;

export default function SupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, type, message }),
      });
      if (!res.ok) throw new Error('Failed to send');
      setSuccess(true);
    } catch {
      setError('Something went wrong. Please try again or email us directly at support@chivalry.date.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-cream-50">
      <header className="px-6 h-16 flex items-center justify-between border-b border-cream-300/50 max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-sage-400 rounded-xl flex items-center justify-center">
            <span className="text-white font-display text-lg leading-none">C</span>
          </div>
          <span className="font-display text-xl text-sage-800">Chivalry</span>
        </Link>
        <Link href="/" className="text-sage-400 text-sm font-medium hover:text-sage-600 transition-colors">
          ← Back to Home
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="font-display text-4xl text-sage-800 mb-3">Help &amp; Support</h1>
          <p className="text-cream-700">
            We&apos;re here to help. Send us a message and we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        {success ? (
          <div className="bg-sage-100/50 border border-sage-200 rounded-2xl p-10 text-center">
            <div className="w-14 h-14 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-sage-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h2 className="font-display text-2xl text-sage-800 mb-2">Message sent</h2>
            <p className="text-cream-700 text-sm">
              Thanks for reaching out! We&apos;ll get back to you at the email you provided within 24 hours.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-cream-300/50 rounded-2xl p-8">
            <h3 className="font-display text-xl text-sage-800 mb-6">Contact us</h3>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-800 mb-1.5">Your name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-800 mb-1.5">Email address *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="you@example.com"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-800 mb-1.5">What can we help with? *</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all appearance-none"
                >
                  <option value="">Select a topic</option>
                  <option value="General Support">General question</option>
                  <option value="Bug Report">Report a bug</option>
                  <option value="Report User">Report a user</option>
                  <option value="Account Recovery">Account recovery</option>
                  <option value="Account Deletion">Delete my account</option>
                  <option value="Safety Concern">Safety concern</option>
                  <option value="Feedback">Feedback or suggestion</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-800 mb-1.5">Message *</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  placeholder="Tell us what's going on..."
                  rows={5}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all resize-vertical"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-sage-400 text-white font-medium py-3.5 rounded-2xl hover:bg-sage-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send message'}
              </button>
            </form>
          </div>
        )}

        <div className="flex justify-center gap-6 mt-8">
          <Link href="/privacy" className="text-sage-400 text-sm font-medium hover:underline">Privacy Policy</Link>
          <Link href="/terms" className="text-sage-400 text-sm font-medium hover:underline">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
