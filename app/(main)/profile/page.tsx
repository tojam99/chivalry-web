'use client';

import { User } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
        <User className="w-8 h-8 text-sage-400" />
      </div>
      <h1 className="font-display text-2xl text-sage-800 mb-2">Profile</h1>
      <p className="text-cream-700 max-w-sm">
        Edit your photos, bio, date ideas, and preferences. Coming soon.
      </p>
    </div>
  );
}
