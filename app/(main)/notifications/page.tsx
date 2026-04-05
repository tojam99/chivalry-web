'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, MessageCircle, Heart, Calendar, Sparkles, Bell } from 'lucide-react';

function ToggleRow({ icon: Icon, title, description, enabled, onChange }: {
  icon: any; title: string; description: string; enabled: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="w-10 h-10 bg-cream-200 rounded-xl flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-cream-600" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-sage-800">{title}</p>
        <p className="text-xs text-cream-600">{description}</p>
      </div>
      <button onClick={() => onChange(!enabled)}
        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${enabled ? 'bg-sage-400' : 'bg-cream-300'}`}>
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${enabled ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
      </button>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();

  // Local state for notification preferences
  // In a full implementation these would be saved to the user's profile or a notifications_preferences table
  const [prefs, setPrefs] = useState({
    newMatches: true,
    messages: true,
    dateRequests: true,
    dateReminders: true,
    likes: true,
    promotions: false,
  });

  function updatePref(key: string, value: boolean) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
    // TODO: persist to Supabase when notifications_preferences table is created
  }

  return (
    <div className="pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/profile')} className="w-9 h-9 bg-cream-200 rounded-full flex items-center justify-center text-cream-700 hover:bg-cream-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-2xl text-sage-800">Notifications</h1>
      </div>

      {/* Push Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-sage-400" />
          <h3 className="text-base font-bold text-sage-800">Push Notifications</h3>
        </div>
        <div className="bg-cream-100 rounded-2xl overflow-hidden divide-y divide-cream-200">
          <ToggleRow icon={Heart} title="New Matches" description="When someone likes you back" enabled={prefs.newMatches} onChange={(v) => updatePref('newMatches', v)} />
          <ToggleRow icon={MessageCircle} title="Messages" description="New messages from matches" enabled={prefs.messages} onChange={(v) => updatePref('messages', v)} />
          <ToggleRow icon={Calendar} title="Date Requests" description="When someone requests a date" enabled={prefs.dateRequests} onChange={(v) => updatePref('dateRequests', v)} />
          <ToggleRow icon={Calendar} title="Date Reminders" description="Reminders before upcoming dates" enabled={prefs.dateReminders} onChange={(v) => updatePref('dateReminders', v)} />
          <ToggleRow icon={Sparkles} title="Likes" description="When someone likes your profile" enabled={prefs.likes} onChange={(v) => updatePref('likes', v)} />
        </div>
      </div>

      {/* Email Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell className="w-5 h-5 text-sage-400" />
          <h3 className="text-base font-bold text-sage-800">Other</h3>
        </div>
        <div className="bg-cream-100 rounded-2xl overflow-hidden divide-y divide-cream-200">
          <ToggleRow icon={Sparkles} title="Promotions & Tips" description="Occasional tips and offers" enabled={prefs.promotions} onChange={(v) => updatePref('promotions', v)} />
        </div>
      </div>

      <p className="text-xs text-cream-500 text-center">
        You can also manage notifications in your device settings.
      </p>
    </div>
  );
}
