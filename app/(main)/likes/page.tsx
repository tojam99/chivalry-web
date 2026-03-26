'use client';

import { Heart } from 'lucide-react';

export default function LikesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
        <Heart className="w-8 h-8 text-sage-400" />
      </div>
      <h1 className="font-display text-2xl text-sage-800 mb-2">Likes &amp; matches</h1>
      <p className="text-cream-700 max-w-sm">
        See who liked you and your mutual matches. Coming soon.
      </p>
    </div>
  );
}
