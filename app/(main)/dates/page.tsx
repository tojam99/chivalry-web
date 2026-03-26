'use client';

import { Calendar } from 'lucide-react';

export default function DatesPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-gold-400/20 rounded-2xl flex items-center justify-center mb-4">
        <Calendar className="w-8 h-8 text-gold-600" />
      </div>
      <h1 className="font-display text-2xl text-sage-800 mb-2">My dates</h1>
      <p className="text-cream-700 max-w-sm">
        Your upcoming, pending, and past dates will show here. Coming soon.
      </p>
    </div>
  );
}
