'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AuthRedirect() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/') return;

    const hash = window.location.hash;
    if (!hash) return;

    if (hash.includes('access_token')) {
      // Instant redirect — no React router, no flash
      window.location.replace('/email-verified' + hash);
    }
  }, [pathname]);

  return null;
}
