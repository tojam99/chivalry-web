import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Chivalry — Putting dates back into dating',
  description: 'A dating app that focuses on real dates, not endless swiping. Plan actual dates with real people in your city.',
  metadataBase: new URL('https://chivalry.date'),
  openGraph: {
    title: 'Chivalry — Putting dates back into dating',
    description: 'A dating app that focuses on real dates, not endless swiping.',
    url: 'https://chivalry.date',
    siteName: 'Chivalry',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
