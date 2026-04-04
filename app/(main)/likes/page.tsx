'use client';

import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/useProfile';
import { createClient } from '@/lib/supabase-browser';
import {
  Heart,
  Loader2,
  X,
  MessageCircle,
  Sparkles,
  MapPin,
  Briefcase,
  GraduationCap,
  Ruler,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Crown,
  Lock,
} from 'lucide-react';

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

function resolvePhotoUrl(url: string | null, width: number = 300): string {
  if (!url) return '';
  return url.startsWith('http') ? thumbUrl(url, width) : thumbUrl(`${SUPABASE_STORAGE}${url}`, width);
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

function isPremiumActive(profile: { premium: boolean; premium_expires_at: string | null }): boolean {
  if (!profile.premium) return false;
  if (!profile.premium_expires_at) return true; // premium with no expiry = lifetime
  return new Date(profile.premium_expires_at) > new Date();
}

interface LikeProfile {
  id: string;
  name: string;
  age: number;
  bio: string | null;
  city: string | null;
  profession: string | null;
  education: string | null;
  height: string | null;
  verified: boolean;
  photos: { id: string; photo_url: string; sort_order: number }[];
  date_ideas: { id: string; title: string; location_name: string }[];
  interests: string[];
  swiped_at: string;
}

export default function LikesPage() {
  const supabase = createClient();
  const { profile: myProfile, loading: profileLoading } = useProfile();
  const [likes, setLikes] = useState<LikeProfile[]>([]);
  const [matches, setMatches] = useState<{ match_id: string; id: string; name: string; age: number | null; photo_url: string | null; last_message: string | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'likes' | 'matches'>('likes');
  const [selectedProfile, setSelectedProfile] = useState<LikeProfile | null>(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [actioning, setActioning] = useState(false);
  const [matchModal, setMatchModal] = useState<LikeProfile | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const router = useRouter();

  const isPremium = myProfile ? isPremiumActive(myProfile) : false;

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

      const [matchesResult, mySwipesResult] = await Promise.all([
        supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`),
        supabase.from('swipes').select('swiped_id').eq('swiper_id', myProfile.id),
      ]);

      const matchedIds = new Set((matchesResult.data || []).map((m) => m.user1_id === myProfile.id ? m.user2_id : m.user1_id));
      const swipedIds = new Set((mySwipesResult.data || []).map((s) => s.swiped_id));
      const unmatchedSwipes = swipes.filter((s) => !matchedIds.has(s.swiper_id) && !swipedIds.has(s.swiper_id));

      if (unmatchedSwipes.length === 0) {
        setLikes([]);
        setLoading(false);
        return;
      }

      const swiperIds = unmatchedSwipes.map((s) => s.swiper_id);
      const swipeTimeMap: Record<string, string> = {};
      unmatchedSwipes.forEach((s) => { swipeTimeMap[s.swiper_id] = s.created_at; });

      const [profilesResult, photosResult, ideasResult, interestsResult] = await Promise.all([
        supabase.from('profiles').select('id, name, age, city, bio, profession, education, height, verified').in('id', swiperIds),
        supabase.from('profile_photos').select('id, profile_id, photo_url, sort_order').in('profile_id', swiperIds).order('sort_order', { ascending: true }),
        supabase.from('date_ideas').select('id, profile_id, title, location_name').in('profile_id', swiperIds),
        supabase.from('profile_interests').select('profile_id, interest_id').in('profile_id', swiperIds),
      ]);

      const interestIds = (interestsResult.data || []).map((i: any) => i.interest_id).filter(Boolean);
      let interestNames: Record<string, string> = {};
      if (interestIds.length > 0) {
        const { data: idata } = await supabase.from('interests').select('id, name').in('id', interestIds);
        (idata || []).forEach((i) => { interestNames[i.id] = i.name; });
      }

      const photosByProfile: Record<string, any[]> = {};
      (photosResult.data || []).forEach((p) => {
        if (!photosByProfile[p.profile_id]) photosByProfile[p.profile_id] = [];
        photosByProfile[p.profile_id].push(p);
      });
      const ideasByProfile: Record<string, any[]> = {};
      (ideasResult.data || []).forEach((d) => {
        if (!ideasByProfile[d.profile_id]) ideasByProfile[d.profile_id] = [];
        ideasByProfile[d.profile_id].push(d);
      });
      const interestsByProfile: Record<string, string[]> = {};
      (interestsResult.data || []).forEach((i: any) => {
        if (!interestsByProfile[i.profile_id]) interestsByProfile[i.profile_id] = [];
        if (interestNames[i.interest_id]) interestsByProfile[i.profile_id].push(interestNames[i.interest_id]);
      });

      const likeProfiles: LikeProfile[] = (profilesResult.data || []).map((p) => ({
        ...p,
        photos: photosByProfile[p.id] || [],
        date_ideas: ideasByProfile[p.id] || [],
        interests: interestsByProfile[p.id] || [],
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

  useEffect(() => { fetchLikes(); }, [fetchLikes]);

  // Fetch matches
  const fetchMatches = useCallback(async () => {
    if (!myProfile?.id) return;
    try {
      const { data: matchesData } = await supabase.from('matches').select('id, user1_id, user2_id, created_at')
        .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`).eq('status', 'active').order('created_at', { ascending: false });
      if (!matchesData || matchesData.length === 0) { setMatches([]); return; }
      const otherIds = matchesData.map((m) => m.user1_id === myProfile.id ? m.user2_id : m.user1_id);
      const [profilesRes, photosRes, msgsRes] = await Promise.all([
        supabase.from('profiles').select('id, name, age').in('id', otherIds),
        supabase.from('profile_photos').select('profile_id, photo_url').in('profile_id', otherIds).order('sort_order', { ascending: true }),
        supabase.from('messages').select('match_id, content, created_at').in('match_id', matchesData.map((m) => m.id)).order('created_at', { ascending: false }),
      ]);
      const profilesMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));
      const photosMap = new Map<string, string>();
      (photosRes.data || []).forEach((p) => { if (!photosMap.has(p.profile_id)) photosMap.set(p.profile_id, p.photo_url); });
      const lastMsgMap = new Map<string, string>();
      (msgsRes.data || []).forEach((m) => { if (!lastMsgMap.has(m.match_id)) lastMsgMap.set(m.match_id, m.content); });
      setMatches(matchesData.map((m) => {
        const otherId = m.user1_id === myProfile.id ? m.user2_id : m.user1_id;
        const p = profilesMap.get(otherId);
        return { match_id: m.id, id: otherId, name: p?.name || 'Unknown', age: p?.age || null, photo_url: photosMap.get(otherId) || null, last_message: lastMsgMap.get(m.id) || null };
      }));
    } catch (err) { console.error('fetchMatches error:', err); }
  }, [myProfile?.id]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  async function handleLikeBack(like: LikeProfile) {
    if (actioning) return;
    setActioning(true);
    try {
      const { error } = await supabase.from('swipes').insert({
        swiper_id: myProfile!.id,
        swiped_id: like.id,
        direction: 'right',
      });
      if (error) { console.error('[Likes] Swipe error:', error); setActioning(false); return; }
      setSelectedProfile(null);
      setMatchModal(like);
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
    } catch (err) { console.error('[Likes] Error:', err); }
    setActioning(false);
  }

  async function handlePass(like: LikeProfile) {
    if (actioning) return;
    setActioning(true);
    try {
      await supabase.from('swipes').insert({ swiper_id: myProfile!.id, swiped_id: like.id, direction: 'left' });
      setSelectedProfile(null);
      setLikes((prev) => prev.filter((l) => l.id !== like.id));
    } catch (err) { console.error('[Likes] Pass error:', err); }
    setActioning(false);
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
        <h1 className="font-bold text-2xl text-sage-800 mb-2">No likes yet</h1>
        <p className="text-cream-700 max-w-sm">When someone likes your profile, they&apos;ll appear here. Keep swiping!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-bold text-2xl text-sage-800">Likes & Matches</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('likes')} className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${activeTab === 'likes' ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>
          Likes ({likes.length})
        </button>
        <button onClick={() => setActiveTab('matches')} className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${activeTab === 'matches' ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>
          Matches ({matches.length})
        </button>
      </div>

      {/* Matches tab */}
      {activeTab === 'matches' && (
        <div>
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mb-4"><MessageCircle className="w-8 h-8 text-sage-400" /></div>
              <h2 className="font-bold text-xl text-sage-800 mb-2">No matches yet</h2>
              <p className="text-cream-700 text-sm max-w-sm">Keep swiping! When you and someone both like each other, you&apos;ll match.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {matches.map((m) => (
                <button key={m.match_id} onClick={() => router.push(`/matches/${m.match_id}`)}
                  className="w-full flex items-center gap-3 bg-white border border-cream-200 rounded-2xl p-3 hover:border-sage-300 transition-colors text-left">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0">
                    {m.photo_url ? <img src={resolvePhotoUrl(m.photo_url, 120)} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-cream-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-sage-800">{m.name}{m.age ? `, ${m.age}` : ''}</p>
                    <p className="text-xs text-cream-600 truncate">{m.last_message || 'New match! Say hi 👋'}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cream-500 shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Likes tab */}
      {activeTab === 'likes' && (<>

      {/* Upgrade banner for non-premium */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-gold-400/20 to-sage-100 border border-gold-400/30 rounded-2xl p-5 mb-6 text-center">
          <Crown className="w-8 h-8 text-gold-600 mx-auto mb-2" />
          <h3 className="font-bold text-lg text-sage-800 mb-1">See who likes you</h3>
          <p className="text-cream-700 text-sm mb-3">Upgrade to Premium to see and match with people who already like you.</p>
          <button className="bg-gold-400 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-gold-600 transition-colors text-sm">
            Upgrade to Premium
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {likes.map((like) => (
          <div
            key={like.id}
            className="relative bg-cream-100 rounded-2xl overflow-hidden aspect-[3/4] cursor-pointer group"
            onClick={() => {
              if (isPremium) {
                setSelectedProfile(like);
                setPhotoIndex(0);
              } else {
                setShowUpgradeModal(true);
              }
            }}
          >
            {like.photos[0] ? (
              <Image
                src={resolvePhotoUrl(like.photos[0].photo_url)}
                alt={like.name}
                fill
                className={`object-cover ${!isPremium ? 'blur-lg scale-110' : ''}`}
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-cream-300" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

            {/* Lock overlay for non-premium */}
            {!isPremium && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Lock className="w-6 h-6 text-white" />
                </div>
              </div>
            )}

            <div className="absolute bottom-3 left-3 right-3">
              <p className={`text-white font-bold text-[15px] ${!isPremium ? 'blur-sm' : ''}`}>
                {like.name}, {like.age}
              </p>
              {like.city && (
                <p className={`text-white/70 text-[12px] ${!isPremium ? 'blur-sm' : ''}`}>{like.city}</p>
              )}
              <p className="text-white/50 text-[11px] mt-0.5">{timeAgo(like.swiped_at)}</p>
            </div>

            <div className="absolute top-3 right-3 w-8 h-8 bg-sage-400 rounded-full flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
          </div>
        ))}
      </div>

      </>)}

      {/* Full profile modal (premium only) */}
      {selectedProfile && isPremium && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="min-h-full flex items-start justify-center py-6 px-4">
            <div className="bg-cream-50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between px-5 pt-5">
                <button onClick={() => setSelectedProfile(null)} className="text-cream-600 hover:text-sage-800 transition-colors">
                  <X className="w-6 h-6" />
                </button>
                <p className="text-xs text-cream-600">Liked you {timeAgo(selectedProfile.swiped_at)}</p>
              </div>

              <div className="relative aspect-[3/4] max-h-[420px] mx-5 mt-3 rounded-2xl overflow-hidden bg-cream-300">
                {selectedProfile.photos[photoIndex] && (
                  <Image src={resolvePhotoUrl(selectedProfile.photos[photoIndex].photo_url, 600)} alt={selectedProfile.name} fill className="object-cover" unoptimized />
                )}
                {selectedProfile.photos.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
                    {selectedProfile.photos.map((_, i) => (
                      <div key={i} className={`h-1 rounded-full flex-1 max-w-12 transition-all ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
                    ))}
                  </div>
                )}
                {photoIndex > 0 && (
                  <button onClick={() => setPhotoIndex(photoIndex - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {photoIndex < selectedProfile.photos.length - 1 && (
                  <button onClick={() => setPhotoIndex(photoIndex + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-white font-bold text-2xl">{selectedProfile.name}, {selectedProfile.age}</h2>
                  {selectedProfile.city && (
                    <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5">
                      <MapPin className="w-3 h-3" /><span>{selectedProfile.city}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 py-5 px-5">
                <button onClick={() => handlePass(selectedProfile)} disabled={actioning}
                  className="flex-1 flex items-center justify-center gap-2 bg-cream-200 text-cream-700 font-medium py-3 rounded-2xl hover:bg-cream-300 transition-colors disabled:opacity-50">
                  <X className="w-5 h-5" />Pass
                </button>
                <button onClick={() => handleLikeBack(selectedProfile)} disabled={actioning}
                  className="flex-[2] flex items-center justify-center gap-2 bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500 transition-colors disabled:opacity-50">
                  {actioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Heart className="w-5 h-5" fill="white" />}
                  Like back
                </button>
              </div>

              <div className="px-5 pb-6 space-y-4">
                {selectedProfile.bio && <p className="text-sage-800 text-[15px] leading-relaxed">{selectedProfile.bio}</p>}
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.profession && (
                    <span className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                      <Briefcase className="w-3 h-3" />{selectedProfile.profession}
                    </span>
                  )}
                  {selectedProfile.education && (
                    <span className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                      <GraduationCap className="w-3 h-3" />{selectedProfile.education}
                    </span>
                  )}
                  {selectedProfile.height && (
                    <span className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                      <Ruler className="w-3 h-3" />{selectedProfile.height}
                    </span>
                  )}
                </div>
                {selectedProfile.interests.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2">Interests</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedProfile.interests.map((interest, i) => (
                        <span key={i} className="bg-sage-100 text-sage-600 text-xs font-medium px-3 py-1.5 rounded-lg">{interest}</span>
                      ))}
                    </div>
                  </div>
                )}
                {selectedProfile.date_ideas.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2">Date ideas</p>
                    <div className="space-y-2">
                      {selectedProfile.date_ideas.map((idea, i) => (
                        <div key={i} className="flex items-center gap-3 bg-cream-100 rounded-xl p-3">
                          <div className="w-9 h-9 bg-gold-400/20 rounded-lg flex items-center justify-center shrink-0">
                            <Coffee className="w-4 h-4 text-gold-600" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-sage-800">{idea.title}</p>
                            {idea.location_name && <p className="text-xs text-cream-600">{idea.location_name}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Match modal */}
      {matchModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-gold-400 mx-auto mb-4" />
            <h2 className="font-bold text-3xl text-sage-800 mb-2">It&apos;s a match!</h2>
            <p className="text-cream-700 mb-6">You and {matchModal.name} liked each other</p>
            {matchModal.photos[0] && (
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-sage-400">
                <Image src={resolvePhotoUrl(matchModal.photos[0].photo_url)} alt={matchModal.name} width={96} height={96} className="object-cover w-full h-full" unoptimized />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button onClick={() => { setMatchModal(null); router.push('/matches'); }} className="w-full bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />Send a message
              </button>
              <button onClick={() => setMatchModal(null)} className="w-full text-cream-700 font-medium py-3 rounded-2xl hover:bg-cream-100 transition-colors">
                Keep browsing likes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upgrade modal for non-premium */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Crown className="w-10 h-10 text-gold-600 mx-auto mb-4" />
            <h2 className="font-bold text-2xl text-sage-800 mb-2">Upgrade to Premium</h2>
            <p className="text-cream-700 mb-6">See who likes you, match instantly, and never miss a connection.</p>
            <div className="flex flex-col gap-3">
              <button className="w-full bg-gold-400 text-white font-medium py-3 rounded-2xl hover:bg-gold-600 transition-colors">
                Upgrade now
              </button>
              <button onClick={() => setShowUpgradeModal(false)} className="w-full text-cream-700 font-medium py-3 rounded-2xl hover:bg-cream-100 transition-colors">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
