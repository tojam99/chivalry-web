'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Mail, Phone, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-cream-600">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/discover';
  const supabase = createClient();

  const [mode, setMode] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  async function handleGoogleLogin() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${redirect}`,
      },
    });
    if (error) setError(error.message);
  }

  async function handleSendOTP() {
    setLoading(true);
    setError('');
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setOtpSent(true);
      setLoading(false);
    }
  }

  async function handleVerifyOTP(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const formattedPhone = phone.startsWith('+') ? phone : `+1${phone.replace(/\D/g, '')}`;
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push(redirect);
      router.refresh();
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="font-display text-3xl text-sage-800 mb-2">Welcome back</h1>
        <p className="text-cream-700">Log in to find your next great date</p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleLogin}
        className="w-full flex items-center justify-center gap-3 bg-white border border-cream-300 rounded-2xl py-3.5 px-4 text-sage-800 font-medium hover:bg-cream-100 transition-colors mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-cream-300" />
        <span className="text-sm text-cream-600">or</span>
        <div className="flex-1 h-px bg-cream-300" />
      </div>

      {/* Mode toggle */}
      <div className="flex bg-cream-200 rounded-xl p-1 mb-6">
        <button
          onClick={() => { setMode('email'); setError(''); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'email'
              ? 'bg-white text-sage-800 shadow-sm'
              : 'text-cream-700 hover:text-sage-800'
          }`}
        >
          <Mail className="w-4 h-4" />
          Email
        </button>
        <button
          onClick={() => { setMode('phone'); setError(''); setOtpSent(false); }}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
            mode === 'phone'
              ? 'bg-white text-sage-800 shadow-sm'
              : 'text-cream-700 hover:text-sage-800'
          }`}
        >
          <Phone className="w-4 h-4" />
          Phone
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      {/* Email form */}
      {mode === 'email' && (
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sage-800 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-800 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 pr-12 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-cream-600 hover:text-sage-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-sage-400 text-white font-medium py-3.5 rounded-2xl hover:bg-sage-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Log in
          </button>
        </form>
      )}

      {/* Phone form */}
      {mode === 'phone' && !otpSent && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-sage-800 mb-1.5">Phone number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(615) 555-1234"
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 placeholder:text-cream-500 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
            />
          </div>
          <button
            onClick={handleSendOTP}
            disabled={loading || !phone}
            className="w-full bg-sage-400 text-white font-medium py-3.5 rounded-2xl hover:bg-sage-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Send verification code
          </button>
        </div>
      )}

      {/* OTP verification */}
      {mode === 'phone' && otpSent && (
        <form onSubmit={handleVerifyOTP} className="space-y-4">
          <p className="text-sm text-cream-700 mb-2">
            We sent a code to <span className="font-medium text-sage-800">{phone}</span>
          </p>
          <div>
            <label className="block text-sm font-medium text-sage-800 mb-1.5">Verification code</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 text-center text-2xl tracking-[0.3em] placeholder:text-cream-500 placeholder:text-base placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading || otp.length < 6}
            className="w-full bg-sage-400 text-white font-medium py-3.5 rounded-2xl hover:bg-sage-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Verify &amp; log in
          </button>
          <button
            type="button"
            onClick={() => { setOtpSent(false); setOtp(''); }}
            className="w-full text-sm text-cream-700 hover:text-sage-600 py-2"
          >
            Use a different number
          </button>
        </form>
      )}

      {/* Sign up link */}
      <p className="text-center text-sm text-cream-700 mt-8">
        Don&apos;t have an account?{' '}
        <Link href="/auth/signup" className="text-sage-400 font-medium hover:text-sage-600 transition-colors">
          Sign up
        </Link>
      </p>
    </div>
  );
}
