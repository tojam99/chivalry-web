import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Minimal nav */}
      <nav className="px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-sage-400 rounded-xl flex items-center justify-center">
            <span className="text-white font-display text-lg leading-none">C</span>
          </div>
          <span className="font-display text-xl text-sage-800">Chivalry</span>
        </Link>
      </nav>

      {/* Auth content */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
