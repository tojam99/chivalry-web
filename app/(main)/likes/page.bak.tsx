'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/useProfile';
import { createClient } from '@/lib/supabase-browser';
import { Heart, Loader2, X, MessageCircle, Sparkles } from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

function thumbUrl(url: string, width: number = 300): string {
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

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

interface LikeProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  photo_url: string | null;
  city: string | null;
  swiped_at: string;
}

export default function LikesPage() {
  const supabase = createClient();
  const { profile: myProfile, loading: profileLoading } = useProfile();
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);
  const [matchModal, setMatchModal] = useState<LikeProfile | null>(null);
  const router = useRouter();

  const fetchLikes = useCallback(async () => {
    if (!myProfile?.id) return;

    try {
      const { data: swipes } = await supabase
        .from('swipes')
        .select('swiper_id, created_at')
        .eq('swiped_id', myProfile.id)
        .in('direction', ['right', 'super'])
        .order('created_at', { ascending: false });

      if (!swipes || swipes.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      // Exclude people I already matched with
      const { data: matches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`);

      const matchedIds = new Set(
        (matches || []).map((m) =>
          m.user1_id === myProfile.id ? m.user2_id : m.user1_id
        )
      );

      // Also exclude people I already swiped on
      const { data: mySwipes } = await supabase
        .from('swipes')
        .select('swiped_id')
        .eq('swiper_id', myProfile.id);

      const swipedIds = new Set((mySwipes || []).map((s) => s.swiped_id));

      const unmatchedSwipes = swipes.filter(
        (s) => !matchedIds.has(s.swiper_id) && !swipedIds.has(s.swiper_id)
      );

      if (unmatchedSwipes.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      const swiperIds = unmatchedSwipes.map((s) => s.swiper_id);
      const swipeTimeMap: Record<string, string> = {};
      unmatchedSwipes.forEach((s) => { swipeTimeMap[s.swiper_id] = s.created_at; });

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, age, city, bio')
        .in('id', swiperIds);

      const { data: photos } = await supabase
        .from('profile_photos')
        .select('profile_id, photo_url, sort_order')
        .in('profile_id', swiperIds)
        .order('sort_order', { ascending: true });

      const photoMap: Record<string, string> = {};
      (photos || []).forEach((p) => {
        if (!photoMap[p.profile_id]) photoMap[p.profile_id] = p.photo_url;
      });

      const likeProfiles: LikeProfile[] = (profiles || []).map((p) => ({
        id: p.id,
        name: p.name,
        age: p.age,
        bio: p.bio,
        photo_url: photoMap[p.id] || null,
        city: p.city,
        swiped_at: swipeTimeMap[p.id],
      }));

      likeProfiles.sort((a, b) => new Date(b.swiped_at).getTime() - new Date(a.swiped_at).getTime());

      setLikes(likeProfiles);
      setLoading(false);
    } catch (err) {
      console.error('[Likes] Error:', err);
      setLoading(false);
    }
  }, [myProfile?.id]);

  useEffect(() => {
    fetchLikes();
  }, [fetchLikes]);

  async function handleLikeBack(like: LikeProfile) {
    if (actioning) return;
    setActioning(like.id);

    try {
      const { error } = await supabase.from('swipes').insert({
        swiper_id: myProfile!.id,
        swiped_id: like.id,
        direction: 'right',
      });

      if (error) {
        console.error('[Likes] Swipe error:', error);
        setActioning(null);
        return;
      }

      setMatchModal(like);
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
      setExpandedId(null);
    } catch (err) {
      console.error('[Likes] Error:', err);
    }
    setActioning(null);
  }

  async function handlePass(like: LikeProfile) {
    if (actioning) return;
    setActioning(like.id);

    try {
      await supabase.from('swipes').insert({
        swiper_id: myProfile!.id,
        swiped_id: like.id,
        direction: 'left',
      });

      setLikes((prev) => prev.filter((l) => l.id !== like.id));
      setExpandedId(null);
    } catch (err) {
      console.error('[Likes] Pass error:', err);
    }
    setActioning(null);
  }

  if (profileLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Loading likes...</p>
      </div>
    );
  }

  if (likes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
          <Heart className="w-8 h-8 text-sage-400" />
        </div>
        <h1 className="font-display text-2xl text-sage-800 mb-2">No likes yet</h1>
        <p className="text-cream-700 max-w-sm">
          When someone likes your profile, they&apos;ll appear here. Keep swiping!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-sage-800">Likes</h1>
        <span className="bg-sage-400 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
          {likes.length} {likes.length === 1 ? 'person' : 'people'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {likes.map((like) => (
          <div key={like.id} className="relative">
            <div
              className={`relative bg-cream-100 rounded-2xl overflow-hidden aspect-[3/4] group cursor-pointer transition-all ${
                expandedId === like.id ? 'ring-2 ring-sage-400' : ''
              }`}
              onClick={() => setExpandedId(expandedId === like.id ? null : like.id)}
            >
              {like.photo_url ? (
                <Image
                  src={resolvePhotoUrl(like.photo_url)}
                  alt={like.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-cream-300" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute bottom-3 left-3 right-3">
                <p className="text-white font-bold text-[15px]">
                  {like.name}, {like.age}
                </p>
                {like.city && (
                  <p className="text-white/70 text-[12px]">{like.city}</p>
                )}
                <p className="text-white/50 text-[11px] mt-0.5">{timeAgo(like.swiped_at)}</p>
              </div>

              <div className="absolute top-3 right-3 w-8 h-8 bg-sage-400 rounded-full flex items-center justify-center">
                <Heart className="w-4 h-4 text-white" fill="white" />
              </div>
            </div>

            {/* Action buttons — shown when tapped */}
            {expandedId === like.id && (
              <div className="mt-2 flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handlePass(like); }}
                  disabled={actioning === like.id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-cream-200 text-cream-700 text-sm font-medium py-2.5 rounded-xl hover:bg-cream-300 transition-colors disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Pass
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleLikeBack(like); }}
                  disabled={actioning === like.id}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-sage-400 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-sage-500 transition-colors disabled:opacity-50"
                >
                  {actioning === like.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Heart className="w-4 h-4" fill="white" />
                  )}
                  Like back
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Match modal */}
      {matchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl text-sage-800 mb-2">It&apos;s a match!</h2>
            <p className="text-cream-700 mb-6">You and {matchModal.name} liked each other</p>

            {matchModal.photo_url && (
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-sage-400">
                <Image
                  src={resolvePhotoUrl(matchModal.photo_url)}
                  alt={matchModal.name}
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => { setMatchModal(null); router.push('/matches'); }}
                className="w-full bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500 transition-colors flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Send a message
              </button>
              <button
                onClick={() => setMatchModal(null)}
                className="w-full text-cream-700 font-medium py-3 rounded-2xl hover:bg-cream-100 transition-colors"
              >
                Keep browsing likes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
