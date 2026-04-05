'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useSearchParams } from 'next/navigation';
import { useDiscover, type DiscoverFilters } from '@/lib/useDiscover';
import { createClient } from '@/lib/supabase-browser';
import FilterModal from '@/components/FilterModal';
import PricingModal from '@/components/PricingModal';
import {
  Heart, X, MapPin, ChevronLeft, ChevronRight, Sparkles, MessageCircle,
  Coffee, Compass, Loader2, Info, ShieldCheck, Leaf, Search, Calendar,
  SlidersHorizontal, Send, Undo2, Maximize2, Zap, Check,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';
function resolvePhoto(url: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
}

export default function DiscoverPage() {
  const supabase = createClient();
  const [filters, setFilters] = useState<DiscoverFilters>({ showMe: 'Everyone', ageMin: 18, ageMax: 99, maxDistance: 100, verifiedOnly: false, sharedInterests: false });
  const [showFilters, setShowFilters] = useState(false);
  const { profiles, loading, recordSwipe, matchAlert, dismissMatchAlert, refresh, myProfileId } = useDiscover(filters);
  const router = useRouter();

  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [photoIndex, setPhotoIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [lastSwiped, setLastSwiped] = useState<{ id: string; direction: string } | null>(null);
  const [swipeAnimation, setSwipeAnimation] = useState<'left' | 'right' | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState(false);
  const [headerMount, setHeaderMount] = useState<HTMLElement | null>(null);
  const [showPricing, setShowPricing] = useState(false);
  const [myAuthId, setMyAuthId] = useState<string>('');
  const [checkoutToast, setCheckoutToast] = useState<string | null>(null);
  const searchParams = useSearchParams();

  // Detect checkout success return
  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      const type = searchParams.get('type') || '';
      if (type.startsWith('credits_')) {
        setCheckoutToast('Credits added! You can now request a date.');
      }
      // Clean URL
      window.history.replaceState({}, '', '/discover');
      // Refresh credits
      setTimeout(() => {
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (!user) return;
          supabase.from('profiles').select('date_request_credits, premium').eq('auth_id', user.id).single().then(({ data }) => {
            if (data) {
              setDateCredits(data.date_request_credits || 0);
              setIsPremium(data.premium || false);
            }
          });
        });
      }, 1000);
      // Auto-dismiss toast
      setTimeout(() => setCheckoutToast(null), 5000);
    }
  }, []);

  // Mount filter button into mobile header
  useEffect(() => {
    const el = document.getElementById('mobile-header-action');
    if (el) setHeaderMount(el);
    return () => { if (el) el.innerHTML = ''; };
  }, []);

  // Date request state
  const [dateCredits, setDateCredits] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [confirmRequest, setConfirmRequest] = useState<{
    visible: boolean;
    idea: { id: string; title: string; location_name: string } | null;
    profileId: string | null;
    profileName: string | null;
  }>({ visible: false, idea: null, profileId: null, profileName: null });
  const [noCreditsModal, setNoCreditsModal] = useState(false);
  const [successAlert, setSuccessAlert] = useState<string | null>(null);

  // Fetch credits
  useEffect(() => {
    async function fetchCredits() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyAuthId(user.id);
      const { data } = await supabase.from('profiles').select('date_request_credits, premium').eq('auth_id', user.id).single();
      if (data) {
        setDateCredits(data.date_request_credits || 0);
        setIsPremium(data.premium || false);
      }
    }
    fetchCredits();
  }, [confirmRequest.visible]);

  const visibleProfiles = profiles.filter((p) => !swipedIds.has(p.id));
  const currentProfile = visibleProfiles[0] || null;
  const remaining = visibleProfiles.length;

  const preloadUrls = useMemo(() => {
    const urls: string[] = [];
    visibleProfiles.slice(0, 5).forEach((p) => {
      p.photos.forEach((photo) => { urls.push(resolvePhoto(photo.photo_url)); });
    });
    return urls;
  }, [visibleProfiles.map((p) => p.id).slice(0, 5).join(',')]);

  const prevId = useRef<string | null>(null);
  useEffect(() => {
    if (currentProfile && currentProfile.id !== prevId.current) {
      prevId.current = currentProfile.id;
      setPhotoIndex(0);
    }
  }, [currentProfile]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (matchAlert || animating || confirmRequest.visible) return;
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchAlert, animating, currentProfile, confirmRequest.visible]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (animating || !currentProfile) return;
      setAnimating(true);
      setSwipeAnimation(direction);
      const profileId = currentProfile.id;
      setLastSwiped({ id: profileId, direction });
      
      setTimeout(() => {
        setSwipedIds((prev) => new Set(prev).add(profileId));
        recordSwipe(profileId, direction);
        setSwipeAnimation(null);
        setAnimating(false);
      }, 300);
    },
    [animating, currentProfile, recordSwipe]
  );

  async function handleRewind() {
    if (!lastSwiped || !myProfileId) return;
    // Remove from swiped set so they reappear
    setSwipedIds((prev) => {
      const next = new Set(prev);
      next.delete(lastSwiped.id);
      return next;
    });
    // Delete the swipe from DB
    await supabase.from('swipes').delete()
      .eq('swiper_id', myProfileId)
      .eq('swiped_id', lastSwiped.id);
    setLastSwiped(null);
  }

  // Date request handlers
  function handleDateRequest(idea: { id: string; title: string; location_name: string }) {
    if (!currentProfile) return;
    if (dateCredits > 0 || isPremium) {
      setConfirmRequest({ visible: true, idea, profileId: currentProfile.id, profileName: currentProfile.name });
    } else {
      setNoCreditsModal(true);
    }
  }

  async function confirmDateRequestAction() {
    if (!confirmRequest.idea || !confirmRequest.profileId || !myProfileId) return;
    try {
      // Find or create match
      const { data: matchData } = await supabase
        .from('matches')
        .select('id')
        .or(`and(user1_id.eq.${myProfileId},user2_id.eq.${confirmRequest.profileId}),and(user1_id.eq.${confirmRequest.profileId},user2_id.eq.${myProfileId})`)
        .eq('status', 'active')
        .maybeSingle();

      let matchId = matchData?.id;

      if (!matchId) {
        // Also record swipe right so they show as liked
        await supabase.from('swipes').upsert(
          { swiper_id: myProfileId, swiped_id: confirmRequest.profileId, direction: 'right' },
          { onConflict: 'swiper_id,swiped_id' }
        );

        const { data: newMatch, error: matchError } = await supabase
          .from('matches')
          .insert({ user1_id: myProfileId, user2_id: confirmRequest.profileId, status: 'active' })
          .select('id')
          .single();
        if (matchError) throw matchError;
        matchId = newMatch.id;
      }

      // Check for existing active date
      const { data: existingDates } = await supabase
        .from('dates')
        .select('id')
        .eq('match_id', matchId)
        .in('status', ['pending_pick', 'pending_accept', 'pending_time', 'pending_confirm', 'confirmed']);

      if (existingDates && existingDates.length > 0) {
        setConfirmRequest({ visible: false, idea: null, profileId: null, profileName: null });
        setSuccessAlert('There is already an active date with this person.');
        setTimeout(() => setSuccessAlert(null), 3000);
        return;
      }

      // Deduct credit
      if (dateCredits > 0 && !isPremium) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.rpc('use_date_request_credit', { user_auth_id: user.id });
          setDateCredits((prev) => prev - 1);
        }
      }

      // Create date
      await supabase.from('dates').insert({
        match_id: matchId,
        title: confirmRequest.idea.title,
        location_name: confirmRequest.idea.location_name,
        status: 'pending_accept',
        proposed_by: myProfileId,
        proposed_by_name: 'You',
        waiting_on: confirmRequest.profileId,
      });

      const ideaTitle = confirmRequest.idea.title;
      const otherName = confirmRequest.profileName;
      setConfirmRequest({ visible: false, idea: null, profileId: null, profileName: null });

      // Remove from visible list
      if (confirmRequest.profileId) {
        setSwipedIds((prev) => new Set(prev).add(confirmRequest.profileId!));
      }

      setSuccessAlert(`Date request for "${ideaTitle}" sent to ${otherName}!`);
      setTimeout(() => setSuccessAlert(null), 4000);
    } catch (err: any) {
      console.error('Date request error:', err);
      setConfirmRequest({ visible: false, idea: null, profileId: null, profileName: null });
      setSuccessAlert('Failed to send date request. Please try again.');
      setTimeout(() => setSuccessAlert(null), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Finding people near you...</p>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div>
        <div className="flex justify-end mb-3">
          <button onClick={() => setShowFilters(true)} className="flex items-center gap-1.5 text-sm text-cream-600 hover:text-sage-600 bg-cream-200 px-3 py-1.5 rounded-xl hover:bg-cream-300 transition-colors">
            <SlidersHorizontal className="w-4 h-4" />Filters
          </button>
        </div>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
          <div className="w-16 h-16 bg-cream-300 rounded-2xl flex items-center justify-center mb-4">
            <Compass className="w-8 h-8 text-cream-600" />
          </div>
          <h1 className="font-bold text-2xl text-sage-800 mb-2">No more profiles</h1>
          <p className="text-cream-700 max-w-sm mb-6">Try adjusting your filters or check back later!</p>
          <button onClick={() => { setSwipedIds(new Set()); refresh(); }} className="bg-sage-400 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-sage-500 transition-colors">Refresh</button>
        </div>
        <FilterModal open={showFilters} onClose={() => setShowFilters(false)} filters={filters} onApply={(f) => { setFilters(f); setSwipedIds(new Set()); }} />
      </div>
    );
  }

  const photos = currentProfile.photos;
  const currentPhoto = photos[photoIndex];
  const photoUrl = resolvePhoto(currentPhoto?.photo_url || '');

  return (
    <>
      {/* Hidden preloader */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }} aria-hidden="true">
        {preloadUrls.map((url) => (<img key={url} src={url} alt="" />))}
      </div>

      {/* Desktop filter button — full width, hidden on mobile */}
      <div className="hidden md:block mb-3">
        <button onClick={() => setShowFilters(true)} className="w-full flex items-center justify-center gap-2 text-sm text-cream-600 hover:text-sage-600 bg-cream-200 px-4 py-2.5 rounded-xl hover:bg-cream-300 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {/* Card */}
      <div key={currentProfile.id} className={`transition-all duration-300 ${
        swipeAnimation === 'left' ? '-translate-x-full opacity-0 rotate-[-8deg]' :
        swipeAnimation === 'right' ? 'translate-x-full opacity-0 rotate-[8deg]' : ''
      }`}>
        <div className="relative bg-cream-300 rounded-3xl overflow-hidden aspect-[3/4] max-h-[520px] w-full cursor-pointer"
          onClick={() => setExpandedPhoto(true)}>
          {currentPhoto && (<img src={photoUrl} alt={currentProfile.name} className="absolute inset-0 w-full h-full object-cover" />)}
          {/* Photo nav — stop propagation so tap-to-expand doesn't fire */}
          <div className="absolute inset-0 flex">
            <button className="w-1/2 h-full" onClick={(e) => { e.stopPropagation(); setPhotoIndex(Math.max(0, photoIndex - 1)); }} />
            <button className="w-1/2 h-full" onClick={(e) => { e.stopPropagation(); setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1)); }} />
          </div>
          {photos.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
              {photos.map((_, i) => (<div key={i} className={`h-1 rounded-full flex-1 max-w-12 transition-all ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />))}
            </div>
          )}
          {photoIndex > 0 && (<button onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex - 1); }} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40"><ChevronLeft className="w-4 h-4" /></button>)}
          {photoIndex < photos.length - 1 && (<button onClick={(e) => { e.stopPropagation(); setPhotoIndex(photoIndex + 1); }} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40"><ChevronRight className="w-4 h-4" /></button>)}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div className="flex-1 min-w-0">
                {/* Available Now — above the name like mobile app */}
                {currentProfile.available_now && (
                  <div className="mb-1.5">
                    <span className="bg-green-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide inline-flex items-center gap-1">
                      <Zap className="w-3 h-3" />Available Now
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-white font-bold text-3xl">{currentProfile.name}, {currentProfile.age}</h2>
                </div>
                {(currentProfile.profession || currentProfile.education) && (
                  <p className="text-white/80 text-sm mt-0.5">
                    {[currentProfile.profession, currentProfile.education].filter(Boolean).join(' · ')}
                  </p>
                )}
                {(currentProfile as any).avg_rating > 0 && (
                  <div className="flex items-center gap-1 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className={`text-sm ${i < Math.round((currentProfile as any).avg_rating) ? 'text-gold-400' : 'text-white/30'}`}>★</span>
                    ))}
                    <span className="text-white/70 text-xs ml-0.5">{(currentProfile as any).avg_rating} ({(currentProfile as any).total_dates || 0} dates)</span>
                  </div>
                )}
                {currentProfile.city && (
                  <div className="flex items-center gap-1.5 text-white/70 text-sm mt-1">
                    <MapPin className="w-3.5 h-3.5" /><span>{currentProfile.city}</span>
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                {currentProfile.verified && <div className="bg-sage-400 text-white text-xs font-medium px-2.5 py-1 rounded-lg">Verified</div>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action buttons — Pass / Rewind / Like (rewind in middle, matching mobile app) */}
      <div className="flex items-center justify-center gap-5 py-5">
        {/* Pass */}
        <button onClick={() => handleSwipe('left')} disabled={animating}
          className="w-14 h-14 bg-white border-2 border-cream-300 rounded-full flex items-center justify-center shadow-lg hover:border-red-300 hover:shadow-xl transition-all active:scale-90 disabled:opacity-50">
          <X className="w-7 h-7 text-red-400" />
        </button>
        {/* Rewind (center) */}
        <button onClick={handleRewind} disabled={!lastSwiped || animating}
          className="w-12 h-12 bg-white border-2 border-cream-300 rounded-full flex items-center justify-center shadow-md hover:border-sage-300 hover:shadow-lg transition-all active:scale-90 disabled:opacity-30 disabled:hover:border-cream-300 disabled:hover:shadow-md"
          title="Undo last swipe">
          <Undo2 className="w-5 h-5 text-sage-400" />
        </button>
        {/* Like */}
        <button onClick={() => handleSwipe('right')} disabled={animating}
          className="w-14 h-14 bg-sage-400 rounded-full flex items-center justify-center shadow-lg hover:bg-sage-500 hover:shadow-xl transition-all active:scale-90 disabled:opacity-50">
          <Heart className="w-7 h-7 text-white" fill="white" />
        </button>
      </div>
      {/* <p className="text-center text-xs text-cream-500 -mt-2 mb-5">{remaining} {remaining === 1 ? 'person' : 'people'} left</p> */}

      {/* Profile details */}
      <div className="space-y-5">
        {currentProfile.bio && <p className="text-sage-800 text-[15px] leading-relaxed">{currentProfile.bio}</p>}

          {/* Request a Date — tappable date idea pills */}
          {currentProfile.date_ideas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Request a Date</p></div>
              <div className="space-y-2">
                {currentProfile.date_ideas.map((idea, i) => (
                  <button key={i} onClick={() => handleDateRequest(idea)}
                    className="w-full flex items-center gap-3 bg-sage-400 rounded-xl p-3 text-left hover:bg-sage-500 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{idea.title}</p>
                      {idea.location_name && <p className="text-xs text-white/70">{idea.location_name}</p>}
                    </div>
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0"><Calendar className="w-3.5 h-3.5 text-white" /></div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          {(currentProfile.identification || currentProfile.profession || currentProfile.education || currentProfile.height || currentProfile.body_type || currentProfile.ethnicity || currentProfile.religion) && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Basic info</p></div>
              <div className="bg-cream-100 rounded-xl divide-y divide-cream-200">
                {currentProfile.verified && (
                  <div className="flex items-center gap-2 px-4 py-2.5"><ShieldCheck className="w-4 h-4 text-sage-600" /><span className="text-sm font-semibold text-sage-600">Verified Profile</span></div>
                )}
                {[
                  { label: 'Identification', value: currentProfile.identification },
                  { label: 'Profession', value: currentProfile.profession },
                  { label: 'Education', value: currentProfile.education },
                  { label: 'Height', value: currentProfile.height },
                  { label: 'Body Type', value: currentProfile.body_type },
                  { label: 'Ethnicity', value: currentProfile.ethnicity },
                  { label: 'Religion', value: currentProfile.religion },
                ].filter((r) => r.value).map((r) => (
                  <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-cream-600">{r.label}</span>
                    <span className="text-sm font-medium text-sage-800">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Lifestyle */}
          {(currentProfile.drinking || currentProfile.smoking || currentProfile.workout || currentProfile.children) && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Lifestyle</p></div>
              <div className="bg-cream-100 rounded-xl divide-y divide-cream-200">
                {[
                  { label: 'Drinking', value: currentProfile.drinking },
                  { label: 'Smoking', value: currentProfile.smoking },
                  { label: 'Workout', value: currentProfile.workout },
                  { label: 'Children', value: currentProfile.children },
                ].filter((r) => r.value).map((r) => (
                  <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                    <span className="text-sm text-cream-600">{r.label}</span>
                    <span className="text-sm font-medium text-sage-800">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interests */}
          {currentProfile.interests.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Interests</p></div>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile.interests.map((interest, i) => (<span key={i} className="bg-sage-100 text-sage-600 text-xs font-medium px-3 py-1.5 rounded-lg">{interest}</span>))}
              </div>
            </div>
          )}

          {/* Looking For */}
          {currentProfile.looking_for && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Search className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Looking for</p></div>
              <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-600 text-sm font-medium px-4 py-2 rounded-xl"><Heart className="w-4 h-4" />{currentProfile.looking_for}</div>
            </div>
          )}
      </div>

      {/* Success/Error Alert */}
      {successAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] bg-sage-400 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium max-w-sm text-center">
          {successAlert}
        </div>
      )}

      {/* Confirm Date Request Modal */}
      {confirmRequest.visible && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-cream-50 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
            {/* Green header */}
            <div className="bg-gradient-to-b from-sage-400 to-sage-500 py-6 px-5 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white">Request a Date</h3>
              <p className="text-white/80 text-sm mt-1">with {confirmRequest.profileName || 'this person'}</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Date idea details */}
              {confirmRequest.idea && (
                <div className="bg-cream-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-sage-400 rounded-full flex items-center justify-center shrink-0">
                      <Heart className="w-4 h-4 text-white" fill="white" />
                    </div>
                    <p className="text-base font-bold text-sage-800 flex-1">{confirmRequest.idea.title}</p>
                  </div>
                  {confirmRequest.idea.location_name && (
                    <div className="flex items-center gap-2 ml-12 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-sage-400" />
                      <p className="text-sm text-cream-600">{confirmRequest.idea.location_name}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Credits info */}
              {!isPremium && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-amber-600">🎟️</span>
                  <p className="text-sm text-amber-900 flex-1">
                    1 credit will be used. You have <span className="font-bold">{dateCredits}</span> remaining.
                  </p>
                </div>
              )}

              {/* Buttons */}
              <button onClick={confirmDateRequestAction}
                className="w-full flex items-center justify-center gap-2 bg-sage-400 text-white font-bold py-4 rounded-2xl hover:bg-sage-500 transition-colors text-base">
                <Send className="w-5 h-5" />Send Date Request
              </button>
              <button onClick={() => setConfirmRequest({ visible: false, idea: null, profileId: null, profileName: null })}
                className="w-full py-3 text-center text-cream-600 font-semibold hover:text-sage-800 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* No Credits Modal */}
      {noCreditsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-6">
          <div className="bg-cream-50 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🎟️</span>
            </div>
            <h3 className="font-bold text-xl text-sage-800 mb-2">No Date Request Credits</h3>
            <p className="text-cream-700 text-sm mb-6">You need credits to send date requests. Purchase a credit pack to get started.</p>
            <button onClick={() => { setNoCreditsModal(false); setShowPricing(true); }} className="w-full bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500 transition-colors mb-2">Get Credits</button>
            <button onClick={() => setNoCreditsModal(false)} className="w-full text-cream-600 font-medium py-2 rounded-2xl hover:bg-cream-200 transition-colors text-sm">Not now</button>
          </div>
        </div>
      )}

      {/* Pricing Modal */}
      <PricingModal
        open={showPricing}
        onClose={() => setShowPricing(false)}
        profileId={myProfileId || ''}
        authId={myAuthId}
        mode="credits"
      />

      {/* Match modal */}
      {matchAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-gold-400 mx-auto mb-4" />
            <h2 className="font-bold text-3xl text-sage-800 mb-2">It&apos;s a match!</h2>
            <p className="text-cream-700 mb-6">You and {matchAlert.name} liked each other</p>
            {matchAlert.photo && (
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-sage-400">
                <img src={resolvePhoto(matchAlert.photo)} alt={matchAlert.name} className="object-cover w-full h-full" />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button onClick={() => { dismissMatchAlert(); router.push('/matches'); }} className="w-full bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />Send a message
              </button>
              <button onClick={dismissMatchAlert} className="w-full text-cream-700 font-medium py-3 rounded-2xl hover:bg-cream-100 transition-colors">Keep swiping</button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded photo lightbox */}
      {expandedPhoto && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setExpandedPhoto(false)}>
          <button onClick={() => setExpandedPhoto(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors z-10">
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-3xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img src={photoUrl} alt={currentProfile.name} className="w-full h-full object-contain rounded-xl" />
            {/* Photo nav in lightbox */}
            {photos.length > 1 && (
              <>
                <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-6">
                  {photos.map((_, i) => (<div key={i} className={`h-1 rounded-full flex-1 max-w-12 ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />))}
                </div>
                {photoIndex > 0 && (
                  <button onClick={() => setPhotoIndex(photoIndex - 1)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {photoIndex < photos.length - 1 && (
                  <button onClick={() => setPhotoIndex(photoIndex + 1)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Checkout success toast */}
      {checkoutToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium flex items-center gap-2">
          <Check className="w-4 h-4" />
          {checkoutToast}
        </div>
      )}

      <FilterModal open={showFilters} onClose={() => setShowFilters(false)} filters={filters}
        onApply={(f) => { setFilters(f); setSwipedIds(new Set()); }} />

      {/* Mobile: render filter into header via portal */}
      {headerMount && createPortal(
        <button onClick={() => setShowFilters(true)}
          className="w-9 h-9 bg-cream-200 rounded-lg flex items-center justify-center text-cream-700 hover:bg-cream-300 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />
        </button>,
        headerMount
      )}
    </>
  );
}
