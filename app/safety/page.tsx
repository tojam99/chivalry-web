import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Safety Standards — Chivalry',
  description: 'Our commitment to preventing child sexual abuse and exploitation on Chivalry.',
};

export default function SafetyPage() {
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
        <h1 className="font-display text-4xl text-sage-800 mb-2">Safety Standards</h1>
        <p className="text-cream-700 mb-10">Our commitment to preventing child sexual abuse and exploitation (CSAE) on Chivalry.</p>

        <div className="prose-chivalry">
          <h2>Age requirement</h2>
          <p>Chivalry is strictly for adults aged 18 and over. We enforce this through age verification during account registration. Users must confirm they are at least 18 years old to create an account. Our app is rated &quot;Teen or higher&quot; on the Google Play Store and we have opted in to restrict users that Google has determined to be minors.</p>

          <h2>Zero tolerance policy</h2>
          <p>Chivalry has a zero-tolerance policy for any content or behavior related to child sexual abuse and exploitation (CSAE). This includes, but is not limited to:</p>
          <ul>
            <li>Any sexual or suggestive content involving minors</li>
            <li>Attempts to solicit or groom minors</li>
            <li>Sharing, distributing, or possessing child sexual abuse material (CSAM)</li>
            <li>Any communication intended to exploit a minor</li>
          </ul>

          <h2>Reporting</h2>
          <p>Users can report any concerning behavior or content directly within the app using the built-in report feature. Reports can be submitted from any user&apos;s profile or from within a chat conversation. All reports are reviewed promptly.</p>
          <p>If you encounter any content or behavior that may involve the exploitation of a minor, please report it immediately:</p>
          <ul>
            <li>In-app: Use the report feature on the user&apos;s profile</li>
            <li>Email: <a href="mailto:support@chivalry.date" className="text-sage-400 hover:underline">support@chivalry.date</a></li>
          </ul>

          <h2>Enforcement</h2>
          <p>When we identify or receive reports of CSAE-related content or behavior, we take the following actions:</p>
          <ul>
            <li>Immediate suspension of the offending account</li>
            <li>Preservation of relevant evidence</li>
            <li>Reporting to the National Center for Missing &amp; Exploited Children (NCMEC) via the CyberTipline</li>
            <li>Cooperation with law enforcement authorities as required by law</li>
            <li>Permanent ban of the offending user</li>
          </ul>

          <h2>Prevention measures</h2>
          <p>We employ the following measures to prevent CSAE on our platform:</p>
          <ul>
            <li>Age gating at registration (18+ required)</li>
            <li>User reporting and blocking tools available throughout the app</li>
            <li>Profile review and moderation</li>
            <li>Prompt response to all safety-related reports</li>
          </ul>

          <h2>Contact</h2>
          <p>For any safety concerns or questions about our CSAE prevention practices, please contact us at <a href="mailto:support@chivalry.date" className="text-sage-400 hover:underline">support@chivalry.date</a>.</p>

          <p className="text-cream-600 text-xs mt-12">Last updated: March 17, 2026</p>
        </div>
      </main>
    </div>
  );
}
