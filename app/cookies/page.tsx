import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookies Policy — Chivalry',
  description: 'How Chivalry uses cookies and similar technologies.',
};

export default function CookiesPage() {
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

      <main className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-sage-800 mb-2">Cookies Policy</h1>
        <p className="text-cream-700 mb-10">How Chivalry uses cookies and similar technologies.</p>

        <div className="prose-chivalry">
          <h2>What are cookies</h2>
          <p>Cookies are small text files stored on your device when you visit a website or use an app. They help us remember your preferences, keep you signed in, and understand how you use our service.</p>

          <h2>How we use cookies</h2>
          <p>Chivalry uses a minimal number of cookies and similar technologies for the following purposes:</p>
          <ul>
            <li><strong>Authentication:</strong> We use session tokens to keep you signed in securely. These are essential for the app to function and cannot be disabled.</li>
            <li><strong>Preferences:</strong> We store your app preferences (such as filter settings) locally on your device to improve your experience.</li>
            <li><strong>Security:</strong> We use cookies to help protect your account from unauthorized access and to detect suspicious activity.</li>
          </ul>

          <h2>What we don&apos;t do</h2>
          <p>Chivalry does not use cookies for:</p>
          <ul>
            <li>Advertising or ad tracking</li>
            <li>Selling data to third parties</li>
            <li>Cross-site tracking</li>
            <li>Building advertising profiles</li>
          </ul>

          <h2>Third-party services</h2>
          <p>Our app uses Supabase for authentication and data storage. Supabase may set cookies or tokens necessary for secure authentication. These are strictly functional and are not used for tracking or advertising purposes.</p>

          <h2>Managing cookies</h2>
          <p>Since Chivalry is primarily a mobile app, most data is stored locally on your device rather than through traditional browser cookies. You can clear this data at any time by:</p>
          <ul>
            <li>Logging out of the app (clears your session)</li>
            <li>Clearing the app&apos;s data in your device settings</li>
            <li>Uninstalling the app</li>
          </ul>

          <h2>Changes to this policy</h2>
          <p>We may update this Cookies Policy from time to time. Any changes will be posted on this page with an updated revision date.</p>

          <h2>Contact us</h2>
          <p>If you have any questions about our use of cookies, please contact us at <Link href="/support" className="text-sage-400 hover:underline">our support page</Link>.</p>

          <p className="text-cream-600 text-xs mt-12">Last updated: March 17, 2026</p>
        </div>
      </main>
    </div>
  );
}
