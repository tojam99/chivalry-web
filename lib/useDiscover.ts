'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { Profile } from './useProfile';

export interface DiscoverProfile extends Profile {
  photos: { id: string; url: string; position: number }[];
  date_ideas: { id: string; title: string; location_name: string; latitude: number; longitude: number }[];
  interests: string[];
  distance?: number;
}

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function useDiscover(myProfile: Profile | null) {
  const supabase = createClient();
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  const fetchProfiles = useCallback(async () => {
    if (!myProfile?.id) return;
    setLoading(true);

    try {
      // Get exclusion lists in parallel
      const [swipedResult, blockedResult, matchesResult] = await Promise.all([
        supabase.from('swipes').select('swiped_id').eq('swiper_id', myProfile.id),
        supabase.from('reports').select('reported_id').eq('reporter_id', myProfile.id).eq('reason', 'blocked'),
        supabase.from('matches').select('user1_id, user2_id').or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`),
      ]);

      const swipedIds = swipedResult.data?.map((s) => s.swiped_id) || [];
      const blockedIds = blockedResult.data?.map((b) => b.reported_id) || [];
      const matchedIds = (matchesResult.data || []).map((m) =>
        m.user1_id === myProfile.id ? m.user2_id : m.user1_id
      );
      const excludeIds = [myProfile.id, ...swipedIds, ...blockedIds, ...matchedIds];

      console.log('[Discover] My ID:', myProfile.id);
      console.log('[Discover] Swiped:', swipedIds.length, 'Blocked:', blockedIds.length, 'Matched:', matchedIds.length);
      console.log('[Discover] Total excluded:', excludeIds.length);

      // Fetch eligible profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .eq('onboarded', true)
        .eq('is_active', true);

      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      // Gender filter
      const showMe = (myProfile.show_me || '').toLowerCase();
      if (showMe && showMe !== 'everyone') {
        query = query.eq('identification', myProfile.show_me);
      }

      // Age filter
      if (myProfile.age_min && myProfile.age_min > 18) query = query.gte('age', myProfile.age_min);
      if (myProfile.age_max && myProfile.age_max < 99) query = query.lte('age', myProfile.age_max);

      query = query.limit(50);

      const { data: profilesData, error: profilesError } = await query;
      console.log('[Discover] Profiles returned:', profilesData?.length, 'Error:', profilesError);

      if (!profilesData || profilesData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

    // Fetch photos, date ideas, and interests for all profiles
    const profileIds = profilesData.map((p) => p.id);

    const [photosResult, ideasResult, interestsResult] = await Promise.all([
      supabase.from('profile_photos').select('*').in('profile_id', profileIds),
      supabase.from('date_ideas').select('*').in('profile_id', profileIds),
      supabase.from('profile_interests').select('profile_id, interest_id').in('profile_id', profileIds),
    ]);

    console.log('[Discover] Photos:', photosResult.data?.length, 'Error:', photosResult.error?.message);
    console.log('[Discover] Ideas:', ideasResult.data?.length, 'Error:', ideasResult.error?.message);
    console.log('[Discover] Interests:', interestsResult.data?.length, 'Error:', interestsResult.error?.message);

    // If photos query failed, still show profiles without filtering by photos
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

    // Fetch interest names separately to avoid join issues
    const interestIds = (interestsResult.data || []).map((i: any) => i.interest_id).filter(Boolean);
    let interestNames: Record<string, string> = {};
    if (interestIds.length > 0) {
      const { data: interestsData } = await supabase.from('interests').select('id, name').in('id', interestIds);
      (interestsData || []).forEach((i) => { interestNames[i.id] = i.name; });
    }

    const interestsByProfile: Record<string, string[]> = {};
    (interestsResult.data || []).forEach((i: any) => {
      if (!interestsByProfile[i.profile_id]) interestsByProfile[i.profile_id] = [];
      if (interestNames[i.interest_id]) interestsByProfile[i.profile_id].push(interestNames[i.interest_id]);
    });

    // Build final profiles with distance
    const enriched: DiscoverProfile[] = profilesData
      .map((p) => ({
        ...p,
        photos: photosByProfile[p.id] || [],
        date_ideas: ideasByProfile[p.id] || [],
        interests: interestsByProfile[p.id] || [],
        distance:
          myProfile.latitude && p.latitude
            ? Math.round(getDistanceKm(myProfile.latitude, myProfile.longitude, p.latitude, p.longitude) * 0.621371)
            : undefined,
      }))
      .filter((p) => p.photos.length > 0) // Must have at least one photo
      .filter((p) => {
        if (!myProfile.max_distance || !p.distance) return true;
        return p.distance <= myProfile.max_distance;
      });

    setProfiles(enriched);
    setCurrentIndex(0);
    setLoading(false);
    } catch (err) {
      console.error('[Discover] Error:', err);
      setProfiles([]);
      setLoading(false);
    }
  }, [myProfile?.id]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const swipe = useCallback(
    async (direction: 'left' | 'right') => {
      if (currentIndex >= profiles.length) return null;
      const target = profiles[currentIndex];

      await supabase.from('swipes').insert({
        swiper_id: myProfile!.id,
        swiped_id: target.id,
        direction,
      });

      setCurrentIndex((prev) => prev + 1);

      // Check if mutual match on right swipe
      if (direction === 'right') {
        const { data: mutual } = await supabase
          .from('swipes')
          .select('id')
          .eq('swiper_id', target.id)
          .eq('swiped_id', myProfile!.id)
          .eq('direction', 'right')
          .maybeSingle();

        if (mutual) {
          return { matched: true, profile: target };
        }
      }

      return { matched: false, profile: target };
    },
    [profiles, currentIndex, myProfile]
  );

  const currentProfile = currentIndex < profiles.length ? profiles[currentIndex] : null;
  const remaining = profiles.length - currentIndex;

  return { currentProfile, remaining, loading, swipe, refetch: fetchProfiles };
}
