'use client';

import { MessageCircle } from 'lucide-react';

export default function MatchesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
        <MessageCircle className="w-8 h-8 text-sage-400" />
      </div>
      <h1 className="font-display text-2xl text-sage-800 mb-2">Chat</h1>
      <p className="text-cream-700 max-w-sm">
        Message your matches and plan dates together. Coming soon.
      </p>
    </div>
  );
}
