'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/useProfile';
import { useDiscover, type DiscoverProfile } from '@/lib/useDiscover';
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
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

export default function DiscoverPage() {
  const { profile: myProfile, loading: profileLoading } = useProfile();
  const { currentProfile, remaining, loading, swipe, refetch } = useDiscover(myProfile);
  const router = useRouter();

  const [photoIndex, setPhotoIndex] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [matchModal, setMatchModal] = useState<DiscoverProfile | null>(null);
  const [lastProfileId, setLastProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (currentProfile && currentProfile.id !== lastProfileId) {
      setLastProfileId(currentProfile.id);
      setPhotoIndex(0);
    }
  }, [currentProfile, lastProfileId]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (matchModal) return;
      if (e.key === 'ArrowLeft') handleSwipe('left');
      if (e.key === 'ArrowRight') handleSwipe('right');
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [matchModal, swiping, currentProfile]);

  const handleSwipe = useCallback(
    async (direction: 'left' | 'right') => {
      if (swiping || !currentProfile) return;
      setSwiping(true);
      setSwipeDirection(direction);
      await new Promise((r) => setTimeout(r, 300));
      const result = await swipe(direction);
      setSwipeDirection(null);
      setSwiping(false);
      if (result?.matched) setMatchModal(result.profile);
    },
    [swiping, currentProfile, swipe]
  );

  if (profileLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Finding people near you...</p>
      </div>
    );
  }

  if (!myProfile?.onboarded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-sage-400" />
        </div>
        <h1 className="font-display text-2xl text-sage-800 mb-2">Complete your profile</h1>
        <p className="text-cream-700 max-w-sm mb-6">
          You need to finish setting up your profile before you can start discovering people.
        </p>
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-cream-300 rounded-2xl flex items-center justify-center mb-4">
          <Compass className="w-8 h-8 text-cream-600" />
        </div>
        <h1 className="font-display text-2xl text-sage-800 mb-2">No more profiles</h1>
        <p className="text-cream-700 max-w-sm mb-6">
          You&apos;ve seen everyone nearby. Check back later for new people!
        </p>
        <button onClick={refetch} className="bg-sage-400 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-sage-500 transition-colors">
          Refresh
        </button>
      </div>
    );
  }

  const photos = currentProfile.photos;
  const currentPhoto = photos[photoIndex];
  const photoUrl = currentPhoto?.photo_url?.startsWith('http')
    ? currentPhoto.photo_url
    : `${SUPABASE_STORAGE}${currentPhoto?.photo_url}`;

  return (
    <>
      <div
        className={`relative transition-all duration-300 ${
          swipeDirection === 'left' ? '-translate-x-20 -rotate-6 opacity-0'
            : swipeDirection === 'right' ? 'translate-x-20 rotate-6 opacity-0' : ''
        }`}
      >
        {/* Photo */}
        <div className="relative bg-cream-300 rounded-3xl overflow-hidden aspect-[3/4] max-h-[520px]">
          {currentPhoto && (
            <Image src={photoUrl} alt={currentProfile.name} fill className="object-cover" priority unoptimized />
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
                  {currentProfile.distance !== undefined && <span className="text-white/60 ml-1">{currentProfile.distance} mi away</span>}
                </div>
              </div>
              {currentProfile.verified && <div className="bg-sage-400 text-white text-xs font-medium px-2.5 py-1 rounded-lg">Verified</div>}
            </div>
          </div>
        </div>

        {/* Action buttons — directly after the photo card */}
        <div className="flex items-center justify-center gap-6 py-5">
          <button
            onClick={() => handleSwipe('left')}
            disabled={swiping}
            className="w-16 h-16 bg-white border-2 border-cream-300 rounded-full flex items-center justify-center shadow-lg shadow-cream-300/30 hover:border-red-300 hover:shadow-red-200/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <X className="w-7 h-7 text-red-400" />
          </button>
          <button
            onClick={() => handleSwipe('right')}
            disabled={swiping}
            className="w-20 h-20 bg-sage-400 rounded-full flex items-center justify-center shadow-lg shadow-sage-400/30 hover:bg-sage-500 hover:shadow-sage-500/30 transition-all active:scale-95 disabled:opacity-50"
          >
            <Heart className="w-9 h-9 text-white" fill="white" />
          </button>
        </div>
        <p className="text-center text-xs text-cream-600 -mt-3 mb-4">
          {remaining} {remaining === 1 ? 'person' : 'people'} left
        </p>

        {/* Profile details below buttons */}
        <div className="space-y-4">
          {currentProfile.bio && <p className="text-sage-800 text-[15px] leading-relaxed">{currentProfile.bio}</p>}
          <div className="flex flex-wrap gap-2">
            {currentProfile.profession && (
              <div className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                <Briefcase className="w-3 h-3" />{currentProfile.profession}
              </div>
            )}
            {currentProfile.education && (
              <div className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                <GraduationCap className="w-3 h-3" />{currentProfile.education}
              </div>
            )}
            {currentProfile.height && (
              <div className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                <Ruler className="w-3 h-3" />{currentProfile.height}
              </div>
            )}
          </div>
          {currentProfile.interests.length > 0 && (
            <div>
              <p className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2">Interests</p>
              <div className="flex flex-wrap gap-1.5">
                {currentProfile.interests.map((interest, i) => (
                  <span key={i} className="bg-sage-100 text-sage-600 text-xs font-medium px-3 py-1.5 rounded-lg">{interest}</span>
                ))}
              </div>
            </div>
          )}
          {currentProfile.date_ideas.length > 0 && (
            <div>
              <p className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2">Date ideas</p>
              <div className="space-y-2">
                {currentProfile.date_ideas.map((idea, i) => (
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

      {/* Match modal */}
      {matchModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <Sparkles className="w-10 h-10 text-gold-400 mx-auto mb-4" />
            <h2 className="font-display text-3xl text-sage-800 mb-2">It&apos;s a match!</h2>
            <p className="text-cream-700 mb-6">You and {matchModal.name} liked each other</p>
            {matchModal.photos[0] && (
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-6 border-4 border-sage-400">
                <Image
                  src={matchModal.photos[0].photo_url.startsWith('http') ? matchModal.photos[0].photo_url : `${SUPABASE_STORAGE}${matchModal.photos[0].photo_url}`}
                  alt={matchModal.name} width={96} height={96} className="object-cover w-full h-full" unoptimized
                />
              </div>
            )}
            <div className="flex flex-col gap-3">
              <button onClick={() => { setMatchModal(null); router.push('/matches'); }} className="w-full bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500 transition-colors flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" />Send a message
              </button>
              <button onClick={() => setMatchModal(null)} className="w-full text-cream-700 font-medium py-3 rounded-2xl hover:bg-cream-100 transition-colors">
                Keep swiping
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
