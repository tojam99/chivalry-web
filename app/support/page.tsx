'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const SUPABASE_URL = 'https://pkekuxksofbzjrieesqm.supabase.co';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/contact-form`;

function SupportForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [type, setType] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Auto-fill from URL params (linked from the app)
  useEffect(() => {
    const topic = searchParams.get('topic');
    const msg = searchParams.get('message');
    if (topic) setType(topic);
    if (msg) setMessage(msg);
  }, [searchParams]);

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
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: '#283028', border: '1px solid rgba(122,154,109,0.2)' }}>
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(122,154,109,0.15)' }}>
          <svg className="w-7 h-7" style={{ color: '#7A9A6D' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h2 className="font-bold text-2xl mb-2" style={{ color: '#fff' }}>Message sent</h2>
        <p style={{ color: '#888', fontSize: '15px' }}>
          Thanks for reaching out! We&apos;ll get back to you at the email you provided within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-8" style={{ background: '#283028', border: '1px solid rgba(255,255,255,0.05)' }}>
      <h3 className="font-bold text-xl mb-6" style={{ color: '#fff' }}>Contact us</h3>

      {error && (
        <div className="text-sm rounded-xl p-3 mb-4" style={{ background: 'rgba(255,59,48,0.1)', border: '1px solid rgba(255,59,48,0.2)', color: '#FF6B6B' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#aaa' }}>Your name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Jane Doe"
            className="w-full rounded-xl px-4 py-3 outline-none transition-all"
            style={{ background: '#1E2420', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px' }}
            onFocus={(e) => e.target.style.borderColor = '#7A9A6D'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#aaa' }}>Email address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full rounded-xl px-4 py-3 outline-none transition-all"
            style={{ background: '#1E2420', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px' }}
            onFocus={(e) => e.target.style.borderColor = '#7A9A6D'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#aaa' }}>What can we help with? *</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full rounded-xl px-4 py-3 outline-none transition-all appearance-none cursor-pointer"
            style={{ background: '#1E2420', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px' }}
            onFocus={(e) => e.target.style.borderColor = '#7A9A6D'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          >
            <option value="">Select a topic</option>
            <option value="General Support">General question</option>
            <option value="Bug Report">Report a bug</option>
            <option value="Report User">Report a user</option>
            <option value="Account Recovery">Account recovery</option>
            <option value="Change Email">Change my email</option>
            <option value="Change Phone">Change my phone number</option>
            <option value="Account Deletion">Delete my account</option>
            <option value="Safety Concern">Safety concern</option>
            <option value="Feedback">Feedback or suggestion</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#aaa' }}>Message *</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            placeholder="Tell us what's going on..."
            rows={5}
            className="w-full rounded-xl px-4 py-3 outline-none transition-all resize-vertical"
            style={{ background: '#1E2420', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: '15px', fontFamily: 'inherit' }}
            onFocus={(e) => e.target.style.borderColor = '#7A9A6D'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full font-bold py-3.5 rounded-xl transition-opacity disabled:opacity-50"
          style={{ background: '#7A9A6D', color: '#1E2420', fontSize: '16px', border: 'none', cursor: 'pointer' }}
        >
          {loading ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </div>
  );
}

export default function SupportPage() {
  return (
    <div className="min-h-screen" style={{ background: '#1E2420' }}>
      <header className="px-6 h-16 flex items-center justify-between max-w-6xl mx-auto" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: '#7A9A6D' }}>
            <span className="text-white font-bold text-lg leading-none">C</span>
          </div>
          <span className="font-bold text-xl" style={{ color: '#7A9A6D' }}>Chivalry</span>
        </Link>
        <Link href="/" className="text-sm font-medium transition-colors" style={{ color: '#7A9A6D' }}>
          ← Back to Home
        </Link>
      </header>

      <main className="max-w-xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <h1 className="font-bold text-4xl mb-3" style={{ color: '#fff', letterSpacing: '-1px' }}>Help &amp; Support</h1>
          <p style={{ color: '#888', fontSize: '16px' }}>
            We&apos;re here to help. Send us a message and we&apos;ll get back to you within 24 hours.
          </p>
        </div>

        <Suspense fallback={<div style={{ color: '#888', textAlign: 'center' }}>Loading...</div>}>
          <SupportForm />
        </Suspense>

        <div className="flex justify-center gap-6 mt-8">
          <Link href="/privacy" className="text-sm font-medium hover:underline" style={{ color: '#7A9A6D' }}>Privacy Policy</Link>
          <Link href="/terms" className="text-sm font-medium hover:underline" style={{ color: '#7A9A6D' }}>Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
