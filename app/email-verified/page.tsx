'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=date.chivalry.app&hl=en_US';

export default function EmailVerifiedPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-cream-50 flex items-center justify-center text-cream-600">Loading...</div>}>
      <EmailVerifiedContent />
    </Suspense>
  );
}

function EmailVerifiedContent() {
  const searchParams = useSearchParams();
  const hasError = searchParams.get('error') || searchParams.get('error_description');

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Link href="/" className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 bg-sage-400 rounded-xl flex items-center justify-center">
            <span className="text-white font-display text-xl leading-none">C</span>
          </div>
          <span className="font-display text-2xl text-sage-800">Chivalry</span>
        </Link>

        {hasError ? (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-sage-800 mb-3">Verification failed</h1>
            <p className="text-cream-700 mb-8">
              This link may have expired or already been used. Please try again from the Chivalry app.
            </p>
            <a
              href={PLAY_STORE_URL}
              className="inline-block bg-sage-400 text-white font-medium px-8 py-3.5 rounded-2xl hover:bg-sage-500 transition-colors"
            >
              Get Chivalry on Google Play
            </a>
          </>
        ) : (
          <>
            <div className="w-20 h-20 bg-sage-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-sage-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-sage-800 mb-3">Email verified!</h1>
            <p className="text-cream-700 mb-8">
              Your email has been confirmed. You can close this page and go back to the Chivalry app.
            </p>
            <a
              href={PLAY_STORE_URL}
              className="inline-block bg-sage-400 text-white font-medium px-8 py-3.5 rounded-2xl hover:bg-sage-500 transition-colors"
            >
              Open Chivalry on Google Play
            </a>
          </>
        )}
      </div>
    </div>
  );
}
