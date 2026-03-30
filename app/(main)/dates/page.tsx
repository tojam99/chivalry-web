'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useProfile } from '@/lib/useProfile';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  MapPin,
  Clock,
  Star,
  Loader2,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  XCircle,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

function thumbUrl(url: string, width: number = 200): string {
  if (!url) return '';
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const base = url.replace('/object/public/', '/render/image/public/');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}width=${width}&resize=contain&quality=60`;
  }
  return url;
}

function resolvePhotoUrl(url: string | null): string {
  if (!url) return '';
  return url.startsWith('http') ? thumbUrl(url) : thumbUrl(`${SUPABASE_STORAGE}${url}`);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending_pick: { label: 'Pick a date idea', color: 'text-gold-600', bg: 'bg-gold-400/15', icon: CircleDot },
  pending_accept: { label: 'Waiting for response', color: 'text-gold-600', bg: 'bg-gold-400/15', icon: Clock },
  proposed: { label: 'Date proposed', color: 'text-blue-600', bg: 'bg-blue-100', icon: Calendar },
  confirmed: { label: 'Confirmed', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  completed: { label: 'Completed', color: 'text-sage-600', bg: 'bg-sage-100', icon: CheckCircle2 },
  rated: { label: 'Rated', color: 'text-sage-600', bg: 'bg-sage-100', icon: Star },
  cancelled: { label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', icon: XCircle },
};

interface DateItem {
  id: string;
  match_id: string;
  title: string;
  location_name: string;
  status: string;
  scheduled_at: string | null;
  proposed_time: string | null;
  duration_minutes: number | null;
  rating_by_user1: number | null;
  rating_by_user2: number | null;
  created_at: string;
  waiting_on: string | null;
  other_user: {
    id: string;
    name: string;
    age: number | null;
    photo_url: string | null;
  };
}

export default function DatesPage() {
  const supabase = createClient();
  const { profile: myProfile, loading: profileLoading } = useProfile();
  const [dates, setDates] = useState<DateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const router = useRouter();

  const fetchDates = useCallback(async () => {
    if (!myProfile?.id) return;

    try {
      // Get all matches where I'm involved
      const { data: matches } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`);

      if (!matches || matches.length === 0) {
        setDates([]);
        setLoading(false);
        return;
      }

      const matchIds = matches.map((m) => m.id);
      const matchMap: Record<string, string> = {};
      matches.forEach((m) => {
        matchMap[m.id] = m.user1_id === myProfile.id ? m.user2_id : m.user1_id;
      });

      // Fetch all dates
      const { data: datesData } = await supabase
        .from('dates')
        .select('*')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      if (!datesData || datesData.length === 0) {
        setDates([]);
        setLoading(false);
        return;
      }

      // Get other user profiles
      const otherUserIds = [...new Set(Object.values(matchMap))];
      const [profilesResult, photosResult] = await Promise.all([
        supabase.from('profiles').select('id, name, age').in('id', otherUserIds),
        supabase.from('profile_photos').select('profile_id, photo_url, sort_order').in('profile_id', otherUserIds).order('sort_order', { ascending: true }),
      ]);

      const profilesById: Record<string, any> = {};
      (profilesResult.data || []).forEach((p) => { profilesById[p.id] = p; });

      const photoMap: Record<string, string> = {};
      (photosResult.data || []).forEach((p) => {
        if (!photoMap[p.profile_id]) photoMap[p.profile_id] = p.photo_url;
      });

      const enriched: DateItem[] = datesData.map((d) => {
        const otherUserId = matchMap[d.match_id];
        const otherProfile = profilesById[otherUserId];
        return {
          ...d,
          other_user: {
            id: otherUserId,
            name: otherProfile?.name || 'Unknown',
            age: otherProfile?.age || null,
            photo_url: photoMap[otherUserId] || null,
          },
        };
      });

      setDates(enriched);
      setLoading(false);
    } catch (err) {
      console.error('[Dates] Error:', err);
      setLoading(false);
    }
  }, [myProfile?.id]);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  const upcomingStatuses = ['pending_pick', 'pending_accept', 'proposed', 'confirmed'];
  const pastStatuses = ['completed', 'rated', 'cancelled'];

  const upcoming = dates.filter((d) => upcomingStatuses.includes(d.status));
  const past = dates.filter((d) => pastStatuses.includes(d.status));
  const displayed = tab === 'upcoming' ? upcoming : past;

  if (profileLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Loading dates...</p>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-gold-400/20 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-gold-600" />
        </div>
        <h1 className="font-display text-2xl text-sage-800 mb-2">No dates yet</h1>
        <p className="text-cream-700 max-w-sm">
          Match with someone and plan a date to see it here!
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-sage-800 mb-4">My dates</h1>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('upcoming')}
          className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
            tab === 'upcoming'
              ? 'bg-sage-400 text-white'
              : 'bg-cream-200 text-cream-700 hover:bg-cream-300'
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setTab('past')}
          className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${
            tab === 'past'
              ? 'bg-sage-400 text-white'
              : 'bg-cream-200 text-cream-700 hover:bg-cream-300'
          }`}
        >
          Past ({past.length})
        </button>
      </div>

      {displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-cream-700">
            {tab === 'upcoming' ? 'No upcoming dates' : 'No past dates'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((date) => {
            const statusConfig = STATUS_CONFIG[date.status] || {
              label: date.status,
              color: 'text-cream-700',
              bg: 'bg-cream-200',
              icon: CircleDot,
            };
            const StatusIcon = statusConfig.icon;

            return (
              <div
                key={date.id}
                className="bg-white border border-cream-200 rounded-2xl p-4 hover:border-cream-400 transition-colors cursor-pointer"
                onClick={() => router.push(`/matches/${date.match_id}`)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    {date.other_user.photo_url ? (
                      <Image
                        src={resolvePhotoUrl(date.other_user.photo_url)}
                        alt={date.other_user.name}
                        width={48}
                        height={48}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-cream-300" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-[15px] font-bold text-sage-800 truncate">
                        {date.title}
                      </h3>
                      <ChevronRight className="w-4 h-4 text-cream-500 shrink-0" />
                    </div>

                    <p className="text-[13px] text-cream-700 mb-2">
                      with {date.other_user.name}
                      {date.other_user.age ? `, ${date.other_user.age}` : ''}
                    </p>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status badge */}
                      <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${statusConfig.bg} ${statusConfig.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusConfig.label}
                      </span>

                      {/* Location */}
                      {date.location_name && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-cream-700">
                          <MapPin className="w-3 h-3" />
                          {date.location_name}
                        </span>
                      )}

                      {/* Scheduled time */}
                      {(date.scheduled_at || date.proposed_time) && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-cream-700">
                          <Clock className="w-3 h-3" />
                          {new Date(date.scheduled_at || date.proposed_time!).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      )}
                    </div>

                    {/* Ratings for completed dates */}
                    {(date.status === 'rated' || date.status === 'completed') &&
                      (date.rating_by_user1 || date.rating_by_user2) && (
                        <div className="flex items-center gap-1 mt-2">
                          <Star className="w-3.5 h-3.5 text-gold-400" fill="#C8A96E" />
                          <span className="text-[12px] font-medium text-sage-800">
                            {date.rating_by_user1 || date.rating_by_user2}/5
                          </span>
                        </div>
                      )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
