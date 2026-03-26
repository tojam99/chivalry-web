import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — Chivalry',
  description: 'Terms of service for the Chivalry dating app.',
};

export default function TermsPage() {
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
        <h1 className="font-display text-4xl text-sage-800 mb-2">Terms of Service</h1>
        <p className="text-cream-600 text-sm mb-10">Last updated: March 13, 2026</p>

        <div className="prose-chivalry">
          <p>Welcome to Chivalry. By using our app, you agree to these Terms of Service. Please read them carefully.</p>

          <h2>1. Eligibility</h2>
          <p>You must be at least 18 years old to use Chivalry. By creating an account, you confirm that you are at least 18 years of age and have the legal capacity to enter into these terms.</p>

          <h2>2. Your account</h2>
          <p>You are responsible for maintaining the security of your account. You agree to:</p>
          <ul>
            <li>Provide accurate and truthful information in your profile</li>
            <li>Use only your own photos that you have the right to use</li>
            <li>Keep your login credentials secure</li>
            <li>Not create multiple accounts</li>
            <li>Not share your account with others</li>
          </ul>

          <h2>3. Acceptable use</h2>
          <p>When using Chivalry, you agree NOT to:</p>
          <ul>
            <li>Harass, threaten, or bully other users</li>
            <li>Post content that is illegal, offensive, or sexually explicit</li>
            <li>Use the app for commercial purposes, solicitation, or advertising</li>
            <li>Impersonate another person or misrepresent your identity</li>
            <li>Use automated systems or bots to interact with the app</li>
            <li>Attempt to extract data from the app or other users</li>
            <li>Violate any applicable laws or regulations</li>
            <li>Use the platform to scam, deceive, or defraud other users</li>
          </ul>

          <h2>4. Safety</h2>
          <p>Chivalry facilitates connections between users but is not responsible for the behavior of any user. When meeting someone in person:</p>
          <ul>
            <li>Always meet in public places</li>
            <li>Tell a friend or family member about your plans</li>
            <li>Trust your instincts — if something feels off, leave</li>
            <li>Do not share financial information with matches</li>
            <li>Report any concerning behavior through the app</li>
          </ul>

          <h2>5. Content ownership</h2>
          <p>You retain ownership of content you post on Chivalry (photos, bio, etc.). By posting content, you grant us a non-exclusive, worldwide license to use, display, and distribute your content within the app for the purpose of operating the service.</p>

          <h2>6. Date ideas &amp; locations</h2>
          <p>Date ideas and locations suggested on profiles are user-generated. Chivalry does not endorse, verify, or guarantee the safety of any suggested venue or activity. Users are responsible for verifying locations and ensuring their own safety.</p>

          <h2>7. Reporting &amp; blocking</h2>
          <p>If another user violates these terms or makes you uncomfortable, you can:</p>
          <ul>
            <li>Block them — they will no longer be able to see your profile or contact you</li>
            <li>Report them — our team will review and take appropriate action</li>
            <li>Unmatch — remove the connection between you</li>
          </ul>
          <p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>

          <h2>8. Premium features</h2>
          <p>Chivalry may offer premium features and in-app purchases. Pricing and availability are subject to change. Purchases are non-refundable unless required by applicable law.</p>

          <h2>9. Account deletion</h2>
          <p>You can delete your account at any time through the app settings. Upon deletion, your profile will be deactivated and no longer visible to other users. Some data may be retained for legal and safety purposes.</p>

          <h2>10. Disclaimers</h2>
          <p>Chivalry is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that you will find a match, that the app will be uninterrupted or error-free, or that other users will be truthful in their profiles.</p>

          <h2>11. Limitation of liability</h2>
          <p>To the maximum extent permitted by law, Chivalry shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the app, including but not limited to damages from interactions with other users.</p>

          <h2>12. Changes to these terms</h2>
          <p>We may update these Terms from time to time. Continued use of the app after changes constitutes acceptance of the new terms. Material changes will be communicated through the app or via email.</p>

          <h2>13. Governing law</h2>
          <p>These terms are governed by the laws of the State of Tennessee, United States, without regard to conflict of law provisions.</p>

          <h2>14. Contact</h2>
          <p>Questions about these Terms? Visit our <Link href="/support" className="text-sage-400 hover:underline">Support page</Link> or email us at support@chivalry.date.</p>
        </div>
      </main>
    </div>
  );
}
