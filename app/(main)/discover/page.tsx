'use client';

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useDiscover, type DiscoverFilters } from '@/lib/useDiscover';
import FilterModal from '@/components/FilterModal';
import {
  Heart,
  X,
  MapPin,
  Briefcase,
  GraduationCap,
  Ruler,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Coffee,
  Compass,
  Loader2,
  Info,
  ShieldCheck,
  Leaf,
  Search,
  Calendar,
  SlidersHorizontal,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

function resolvePhoto(url: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
}

export default function DiscoverPage() {
  const [filters, setFilters] = useState<DiscoverFilters>({ showMe: 'Everyone', ageMin: 18, ageMax: 99, maxDistance: 100, verifiedOnly: false, sharedInterests: false });
  const [showFilters, setShowFilters] = useState(false);
  const { profiles, loading, recordSwipe, matchAlert, dismissMatchAlert, refresh, myProfileId } = useDiscover(filters);
  const [dateRequestAlert, setDateRequestAlert] = useState<string | null>(null);
  const router = useRouter();

  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [photoIndex, setPhotoIndex] = useState(0);
  const [animating, setAnimating] = useState(false);

  const visibleProfiles = profiles.filter((p) => !swipedIds.has(p.id));
  const currentProfile = visibleProfiles[0] || null;
  const remaining = visibleProfiles.length;

  // Collect ALL photo URLs from the next 5 visible profiles for preloading
  const preloadUrls = useMemo(() => {
    const urls: string[] = [];
    visibleProfiles.slice(0, 5).forEach((p) => {
      p.photos.forEach((photo) => {
        urls.push(resolvePhoto(photo.photo_url));
      });
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
      if (matchAlert || animating) return;
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchAlert, animating, currentProfile]);

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      if (animating || !currentProfile) return;
      setAnimating(true);
      const profileId = currentProfile.id;
      setSwipedIds((prev) => new Set(prev).add(profileId));
      recordSwipe(profileId, direction);
      setTimeout(() => setAnimating(false), 200);
    },
    [animating, currentProfile, recordSwipe]
  );

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
          <h1 className="font-display text-2xl text-sage-800 mb-2">No more profiles</h1>
          <p className="text-cream-700 max-w-sm mb-6">
            You&apos;ve seen everyone nearby. Try adjusting your filters or check back later!
          </p>
          <button
            onClick={() => { setSwipedIds(new Set()); refresh(); }}
            className="bg-sage-400 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-sage-500 transition-colors"
          >
            Refresh
          </button>
        </div>
        <FilterModal open={showFilters} onClose={() => setShowFilters(false)} filters={filters}
          onApply={(f) => { setFilters(f); setSwipedIds(new Set()); }} />
      </div>
    );
  }

  const photos = currentProfile.photos;
  const currentPhoto = photos[photoIndex];
  const photoUrl = resolvePhoto(currentPhoto?.photo_url || '');

  return (
    <>
      {/* Hidden preloader — browser downloads and caches all these images */}
      <div style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', opacity: 0 }} aria-hidden="true">
        {preloadUrls.map((url) => (
          <img key={url} src={url} alt="" />
        ))}
      </div>

      {/* Filter button */}
      <div className="flex justify-end mb-3">
        <button onClick={() => setShowFilters(true)} className="flex items-center gap-1.5 text-sm text-cream-600 hover:text-sage-600 bg-cream-200 px-3 py-1.5 rounded-xl hover:bg-cream-300 transition-colors">
          <SlidersHorizontal className="w-4 h-4" />Filters
        </button>
      </div>

      {/* Card */}
      <div key={currentProfile.id}>
        {/* Photo */}
        <div className="relative bg-cream-300 rounded-3xl overflow-hidden aspect-[3/4] max-h-[520px]">
          {currentPhoto && (
            <img
              src={photoUrl}
              alt={currentProfile.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 flex">
            <button className="w-1/2 h-full" onClick={() => setPhotoIndex(Math.max(0, photoIndex - 1))} />
            <button className="w-1/2 h-full" onClick={() => setPhotoIndex(Math.min(photos.length - 1, photoIndex + 1))} />
          </div>
          {photos.length > 1 && (
            <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
              {photos.map((_, i) => (
                <div key={i} className={`h-1 rounded-full flex-1 max-w-12 transition-all ${i === photoIndex ? 'bg-white' : 'bg-white/40'}`} />
              ))}
            </div>
          )}
          {photoIndex > 0 && (
            <button onClick={() => setPhotoIndex(photoIndex - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {photoIndex < photos.length - 1 && (
            <button onClick={() => setPhotoIndex(photoIndex + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/40 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-white font-display text-3xl">{currentProfile.name}, {currentProfile.age}</h2>
                <div className="flex items-center gap-1.5 text-white/80 text-sm mt-1">
                  {currentProfile.city && (<><MapPin className="w-3.5 h-3.5" /><span>{currentProfile.city}</span></>)}
                </div>
              </div>
              {currentProfile.verified && <div className="bg-sage-400 text-white text-xs font-medium px-2.5 py-1 rounded-lg">Verified</div>}
            </div>
          </div>
        </div>

        {/* Swipe buttons */}
        <div className="flex items-center justify-center gap-6 py-5">
          <button
            onClick={() => handleSwipe('left')}
            disabled={animating}
            className="w-16 h-16 bg-white border-2 border-cream-300 rounded-full flex items-center justify-center shadow-lg shadow-cream-300/30 hover:border-red-300 hover:shadow-red-200/30 transition-all active:scale-90 disabled:opacity-50"
          >
            <X className="w-7 h-7 text-red-400" />
          </button>
          <button
            onClick={() => handleSwipe('right')}
            disabled={animating}
            className="w-20 h-20 bg-sage-400 rounded-full flex items-center justify-center shadow-lg shadow-sage-400/30 hover:bg-sage-500 hover:shadow-sage-500/30 transition-all active:scale-90 disabled:opacity-50"
          >
            <Heart className="w-9 h-9 text-white" fill="white" />
          </button>
        </div>
        <p className="text-center text-xs text-cream-600 -mt-3 mb-4">
          {remaining} {remaining === 1 ? 'person' : 'people'} left
        </p>

        {/* Profile details */}
        <div className="space-y-5">
          {/* Bio */}
          {currentProfile.bio && <p className="text-sage-800 text-[15px] leading-relaxed">{currentProfile.bio}</p>}

          {/* Date Ideas — tappable to request a date */}
          {currentProfile.date_ideas.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Request a Date</p></div>
              <div className="space-y-2">
                {currentProfile.date_ideas.map((idea, i) => (
                  <button key={i} onClick={() => {
                    setDateRequestAlert(`Date request for "${idea.title}" sent! Like them to match first.`);
                    handleSwipe('right');
                    setTimeout(() => setDateRequestAlert(null), 3000);
                  }}
                    className="w-full flex items-center gap-3 bg-sage-400 rounded-xl p-3 text-left hover:bg-sage-500 transition-colors">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{idea.title}</p>
                      {idea.location_name && <p className="text-xs text-white/70">{idea.location_name}</p>}
                    </div>
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-white" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Basic Info */}
          {(currentProfile.identification || currentProfile.profession || currentProfile.education || currentProfile.height || currentProfile.body_type || currentProfile.ethnicity || currentProfile.religion) && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Basic info</p></div>
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
              <div className="flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Lifestyle</p></div>
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
              <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Interests</p></div>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile.interests.map((interest, i) => (
                  <span key={i} className="bg-sage-100 text-sage-600 text-xs font-medium px-3 py-1.5 rounded-lg">{interest}</span>
                ))}
              </div>
            </div>
          )}

          {/* Looking For */}
          {currentProfile.looking_for && (
            <div>
              <div className="flex items-center gap-2 mb-2"><Search className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Looking for</p></div>
              <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-600 text-sm font-medium px-4 py-2 rounded-xl">
                <Heart className="w-4 h-4" />{currentProfile.looking_for}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Match modal */}
      {/* Date request toast */}
      {dateRequestAlert && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-sage-400 text-white px-5 py-3 rounded-2xl shadow-lg text-sm font-medium max-w-sm text-center animate-pulse">
          {dateRequestAlert}
        </div>
      )}

      {/* Match modal */}
      {matchAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl text-sage-800 mb-2">It&apos;s a match!</h2>
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
              <button onClick={dismissMatchAlert} className="w-full text-cream-700 font-medium py-3 rounded-2xl hover:bg-cream-100 transition-colors">
                Keep swiping
              </button>
            </div>
          </div>
        </div>
      )}

      <FilterModal open={showFilters} onClose={() => setShowFilters(false)} filters={filters}
        onApply={(f) => { setFilters(f); setSwipedIds(new Set()); }} />
    </>
  );
}
