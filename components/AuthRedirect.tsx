'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function AuthRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Only run on the homepage (where Supabase redirects to)
    if (pathname !== '/') return;

    const hash = window.location.hash;
    if (!hash) return;

    // Check if this is an email verification redirect (has access_token + type=email_change or type=magiclink)
    if (hash.includes('access_token') && (hash.includes('type=email_change') || hash.includes('type=signup') || hash.includes('type=magiclink'))) {
      router.replace('/email-verified' + hash);
    }
  }, [pathname, router]);

  return null;
}
