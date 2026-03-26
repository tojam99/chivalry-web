import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — Chivalry',
  description: 'Privacy policy for the Chivalry dating app.',
};

export default function PrivacyPage() {
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
        <h1 className="font-display text-4xl text-sage-800 mb-2">Privacy Policy</h1>
        <p className="text-cream-600 text-sm mb-10">Last updated: March 13, 2026</p>

        <div className="prose-chivalry">
          <p>Chivalry (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Chivalry mobile application and website. This page informs you of our policies regarding the collection, use, and disclosure of personal information when you use our app.</p>

          <h2>1. Information we collect</h2>
          <p>When you create an account, we collect:</p>
          <ul>
            <li><strong>Account information:</strong> Name, email address, phone number, date of birth, gender</li>
            <li><strong>Profile information:</strong> Photos, bio, profession, education, interests, date ideas</li>
            <li><strong>Location data:</strong> Your city and approximate GPS coordinates to show nearby users</li>
            <li><strong>Usage data:</strong> Swipe actions, matches, messages, date activity</li>
            <li><strong>Device information:</strong> Device type, operating system, push notification tokens</li>
          </ul>

          <h2>2. How we use your information</h2>
          <p>We use your information to:</p>
          <ul>
            <li>Create and maintain your account</li>
            <li>Show your profile to other users</li>
            <li>Match you with compatible people nearby</li>
            <li>Facilitate the date negotiation process</li>
            <li>Send notifications about matches, messages, and dates</li>
            <li>Send transactional emails (verification, date confirmations)</li>
            <li>Improve our services and user experience</li>
            <li>Enforce our Terms of Service and protect user safety</li>
          </ul>

          <h2>3. Information sharing</h2>
          <p>We do not sell your personal information. We may share information with:</p>
          <ul>
            <li><strong>Other users:</strong> Your profile information (name, age, photos, bio, date ideas) is visible to other users as part of the dating experience</li>
            <li><strong>Service providers:</strong> We use third-party services for authentication (Supabase), email delivery (Postmark), phone verification (Twilio), and location services (Google Maps)</li>
            <li><strong>Legal requirements:</strong> We may disclose information if required by law or to protect user safety</li>
          </ul>

          <h2>4. Data storage &amp; security</h2>
          <p>Your data is stored securely using Supabase&apos;s infrastructure with row-level security policies. Photos are stored in encrypted cloud storage. We use industry-standard security measures to protect your information.</p>

          <h2>5. Your rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data through the app</li>
            <li>Update your profile information at any time</li>
            <li>Delete your account through the app settings</li>
            <li>Request a copy of your data by contacting support</li>
          </ul>

          <h2>6. Location data</h2>
          <p>We collect location data only when you explicitly grant permission. Your precise location is used to determine your city for matching purposes. You can revoke location permissions at any time through your device settings.</p>

          <h2>7. Push notifications</h2>
          <p>We send push notifications for matches, messages, and date updates. You can manage notification preferences in the app settings or disable them through your device settings.</p>

          <h2>8. Age restriction</h2>
          <p>Chivalry is intended for users aged 18 and older. We do not knowingly collect information from anyone under the age of 18. If we discover that we have collected information from a minor, we will delete it immediately.</p>

          <h2>9. Data retention</h2>
          <p>We retain your data for as long as your account is active. When you delete your account, your profile is deactivated and no longer visible to other users. We may retain certain data for legitimate business purposes and legal compliance.</p>

          <h2>10. Changes to this policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of changes by posting the new policy on this page and updating the &quot;Last updated&quot; date.</p>

          <h2>11. Contact us</h2>
          <p>If you have questions about this Privacy Policy, please visit our <Link href="/support" className="text-sage-400 hover:underline">Support page</Link> or email us at support@chivalry.date.</p>
        </div>
      </main>
    </div>
  );
}
