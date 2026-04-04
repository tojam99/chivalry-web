'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { Eye, EyeOff, Loader2, Check } from 'lucide-react';

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };
  const passwordValid = passwordChecks.length && passwordChecks.upper && passwordChecks.number;

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordValid) return;
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/discover`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  }

  async function handleGoogleSignup() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/discover`,
      },
    });
    if (error) setError(error.message);
  }

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-8 h-8 text-sage-400" />
        </div>
        <h1 className="font-bold text-3xl text-sage-800 mb-3">Check your email</h1>
        <p className="text-cream-700 mb-2">
          We sent a confirmation link to <span className="font-medium text-sage-800">{email}</span>
        </p>
        <p className="text-sm text-cream-600">
          Click the link in the email to activate your account and start setting up your profile.
        </p>
        <Link
          href="/auth/login"
          className="inline-block mt-8 text-sage-400 font-medium hover:text-sage-600 transition-colors text-sm"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="font-bold text-3xl text-sage-800 mb-2">Create your account</h1>
        <p className="text-cream-700">Join Chivalry and start going on real dates</p>
      </div>

      {/* Google OAuth */}
      <button
        onClick={handleGoogleSignup}
        className="w-full flex items-center justify-center gap-3 bg-white border border-cream-300 rounded-2xl py-3.5 px-4 text-sage-800 font-medium hover:bg-cream-100 transition-colors mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Continue with Google
      </button>

      <div className="flex items-center gap-4 my-6">
        <div className="flex-1 h-px bg-cream-300" />
        <span className="text-sm text-cream-600">or sign up with email</span>
        <div className="flex-1 h-px bg-cream-300" />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
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
              placeholder="Create a strong password"
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
          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              {[
                { check: passwordChecks.length, label: 'At least 8 characters' },
                { check: passwordChecks.upper, label: 'One uppercase letter' },
                { check: passwordChecks.number, label: 'One number' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      item.check ? 'bg-sage-400' : 'bg-cream-300'
                    }`}
                  >
                    {item.check && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className={`text-xs ${item.check ? 'text-sage-600' : 'text-cream-600'}`}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={loading || !passwordValid}
          className="w-full bg-sage-400 text-white font-medium py-3.5 rounded-2xl hover:bg-sage-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Create account
        </button>
      </form>

      <p className="text-center text-xs text-cream-600 mt-6 leading-relaxed">
        By signing up, you agree to our{' '}
        <Link href="/terms" className="text-sage-400 hover:underline">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="text-sage-400 hover:underline">
          Privacy Policy
        </Link>
        . You must be 18 or older.
      </p>

      <p className="text-center text-sm text-cream-700 mt-6">
        Already have an account?{' '}
        <Link href="/auth/login" className="text-sage-400 font-medium hover:text-sage-600 transition-colors">
          Log in
        </Link>
      </p>
    </div>
  );
}
