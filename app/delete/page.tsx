'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function DeleteAccountPage() {
  const [email, setEmail] = useState('');
  const [deleteType, setDeleteType] = useState('');
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent('Account Deletion Request — Chivalry');
    const body = encodeURIComponent(
      `Account Deletion Request\n\nEmail: ${email}\nDeletion Type: ${deleteType}\nReason: ${reason || 'Not provided'}\n\nPlease delete my account and associated data as requested.`
    );
    window.location.href = `mailto:support@chivalry.date?subject=${subject}&body=${body}`;
    setSuccess(true);
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
          <h1 className="font-display text-4xl text-sage-800 mb-3">Delete your account</h1>
          <p className="text-cream-700">
            We&apos;re sorry to see you go. This action is permanent and cannot be undone.
          </p>
        </div>

        {/* Warning card */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
          <h3 className="font-medium text-red-700 mb-3">What happens when you delete your account</h3>
          <ul className="text-sm text-red-600 space-y-1.5 list-disc pl-5">
            <li>Your profile, photos, and bio will be permanently removed</li>
            <li>All matches, messages, and date history will be deleted</li>
            <li>Your likes and swipe history will be erased</li>
            <li>Any active or upcoming dates will be cancelled</li>
            <li>This action cannot be reversed</li>
          </ul>
        </div>

        {success ? (
          <div className="bg-sage-100/50 border border-sage-200 rounded-2xl p-10 text-center">
            <h2 className="font-display text-2xl text-sage-800 mb-2">Request received</h2>
            <p className="text-cream-700 text-sm">
              We&apos;ve received your deletion request. Your account and associated data will be deleted within 72 hours. You&apos;ll receive a confirmation email when the process is complete.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-cream-300/50 rounded-2xl p-8">
            <h3 className="font-display text-xl text-sage-800 mb-6">Request account deletion</h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-sage-800 mb-1.5">
                  Email address associated with your account *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-800 mb-1.5">
                  What would you like deleted? *
                </label>
                <select
                  value={deleteType}
                  onChange={(e) => setDeleteType(e.target.value)}
                  required
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all appearance-none"
                >
                  <option value="">Select an option</option>
                  <option value="full">Delete my entire account and all data</option>
                  <option value="data-only">Delete my data but keep my account</option>
                  <option value="photos">Delete only my photos</option>
                  <option value="messages">Delete only my message history</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-sage-800 mb-1.5">
                  Reason for leaving (optional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Help us improve — why are you leaving?"
                  rows={3}
                  className="w-full bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all resize-vertical"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer py-2">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  required
                  className="mt-0.5 accent-red-500"
                />
                <span className="text-sm text-cream-700">
                  I understand that account deletion is permanent and my data cannot be recovered.
                </span>
              </label>

              <button
                type="submit"
                disabled={!confirmed}
                className="w-full bg-red-500 text-white font-medium py-3.5 rounded-2xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                Delete my account
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-sm text-cream-600 mt-6">
          Need help instead?{' '}
          <Link href="/support" className="text-sage-400 hover:underline">Contact our support team</Link>
        </p>
      </main>
    </div>
  );
}
