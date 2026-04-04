'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import {
  Heart,
  Calendar,
  MessageCircle,
  Compass,
  User,
  LogOut,
  Sparkles,
} from 'lucide-react';

const navItems = [
  { href: '/discover', label: 'Discover', icon: Compass },
  { href: '/likes', label: 'Likes', icon: Heart },
  { href: '/dates', label: 'Dates', icon: Calendar },
  { href: '/matches', label: 'Chat', icon: MessageCircle },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <div className="h-screen bg-cream-50 flex flex-col overflow-hidden" style={{ height: '100dvh' }}>
      {/* Prevent iOS bounce */}
      <style jsx global>{`
        html, body {
          overflow: hidden;
          height: 100%;
          overscroll-behavior: none;
          position: fixed;
          width: 100%;
        }
      `}</style>
      {/* Top bar — desktop */}
      <header className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-cream-50/80 backdrop-blur-xl border-b border-cream-300/50 h-16 items-center px-6">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/discover" className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-sage-400 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg leading-none">C</span>
            </div>
            <span className="font-bold text-xl text-sage-800">Chivalry</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sage-100 text-sage-600'
                      : 'text-cream-700 hover:bg-cream-200 hover:text-sage-800'
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-sm text-cream-600 hover:text-sage-600 transition-colors px-3 py-2"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </header>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50 bg-cream-50/80 backdrop-blur-xl border-b border-cream-300/50 h-14 flex items-center justify-between px-4">
        <Link href="/discover" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sage-400 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-base leading-none">C</span>
          </div>
          <span className="font-bold text-lg text-sage-800">Chivalry</span>
        </Link>
        {/* Filter button — only on discover page, other pages show nothing */}
        <div id="mobile-header-action" />
      </header>

      {/* Main content — only this area scrolls */}
      <main className="flex-1 min-h-0 pt-14 md:pt-16 pb-20 md:pb-6 overflow-y-auto overscroll-contain">
        <div className="max-w-2xl mx-auto px-4 py-6">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-cream-50/90 backdrop-blur-xl border-t border-cream-300/50 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-colors ${
                  isActive ? 'text-sage-400' : 'text-cream-600'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
