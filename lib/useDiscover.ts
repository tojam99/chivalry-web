import { useState, useEffect, useCallback } from 'react';
import { createClient } from './supabase-browser';
const supabase = createClient();

export interface DiscoverProfile {
  id: string;
  name: string;
  age: number | null;
  bio: string;
  city: string;
  available_now: boolean;
  identification: string;
  profession: string;
  education: string;
  height: string;
  body_type: string;
  ethnicity: string;
  religion: string;
  drinking: string;
  smoking: string;
  workout: string;
  children: string;
  looking_for: string;
  verified: boolean;
  is_seed_profile?: boolean;
  photos: { photo_url: string; sort_order: number }[];
  date_ideas: { id: string; title: string; location_name: string }[];
  interests: string[];
}

export interface DiscoverFilters {
  showMe: string;
  ageMin: number;
  ageMax: number;
  maxDistance: number;
  verifiedOnly: boolean;
  sharedInterests: boolean;
  lookingFor: string;
}

export function useDiscover(filters?: DiscoverFilters) {
  const [profiles, setProfiles] = useState<DiscoverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [matchAlert, setMatchAlert] = useState<{ name: string; photo: string } | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id, show_me, age_min, age_max, max_distance')
        .eq('auth_id', user.id)
        .single();

      if (!myProfile) return;
      setMyProfileId(myProfile.id);

      // Use passed filters or fall back to profile defaults
      const activeFilters = {
        showMe: filters?.showMe || myProfile.show_me || 'Everyone',
        ageMin: filters?.ageMin ?? myProfile.age_min ?? 18,
        ageMax: filters?.ageMax ?? myProfile.age_max ?? 40,
        maxDistance: filters?.maxDistance ?? myProfile.max_distance ?? 25,
        verifiedOnly: filters?.verifiedOnly ?? false,
        sharedInterests: filters?.sharedInterests ?? false,
        lookingFor: filters?.lookingFor ?? '',
      };

      // Get IDs to exclude in parallel
      const [swipedResult, blockedResult, matchesResult, myInterestsResult] = await Promise.all([
        supabase
          .from('swipes')
          .select('swiped_id')
          .eq('swiper_id', myProfile.id),
        supabase
          .from('reports')
          .select('reported_id')
          .eq('reporter_id', myProfile.id)
          .eq('reason', 'blocked'),
        supabase
          .from('matches')
          .select('user1_id, user2_id')
          .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`),
        // Fetch my interests for shared interests filter
        activeFilters.sharedInterests
          ? supabase
              .from('profile_interests')
              .select('interests(name)')
              .eq('profile_id', myProfile.id)
          : Promise.resolve({ data: [] }),
      ]);

      const swipedIds = swipedResult.data?.map((s) => s.swiped_id) || [];
      const blockedIds = blockedResult.data?.map((b) => b.reported_id) || [];
      const matchedIds = (matchesResult.data || []).map((m) =>
        m.user1_id === myProfile.id ? m.user2_id : m.user1_id
      );
      const excludeIds = [myProfile.id, ...swipedIds, ...blockedIds, ...matchedIds];

      const myInterests = (myInterestsResult.data || [])
        .map((pi: any) => pi.interests?.name)
        .filter(Boolean);

      // Build query for regular (non-seed) profiles
      let query = supabase
        .from('profiles')
        .select('id, name, age, bio, city, available_now, identification, profession, education, height, body_type, ethnicity, religion, drinking, smoking, workout, children, looking_for, verified, is_seed_profile')
        .eq('is_active', true)
        .eq('onboarded', true)
        .eq('is_seed_profile', false)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .order('last_active', { ascending: false })
        .limit(20);

      // Gender filter
      if (activeFilters.showMe === 'Women') query = query.eq('identification', 'Female');
      else if (activeFilters.showMe === 'Men') query = query.eq('identification', 'Male');

      // Age filter
      query = query.gte('age', activeFilters.ageMin);
      query = query.lte('age', activeFilters.ageMax);

      // Verified filter
      if (activeFilters.verifiedOnly) {
        query = query.eq('verified', true);
      }

      // Looking for filter
      if (activeFilters.lookingFor) {
        query = query.eq('looking_for', activeFilters.lookingFor);
      }

      // Fetch seed profiles separately (respect all filters, skip distance)
      let seedQuery = supabase
        .from('profiles')
        .select('id, name, age, bio, city, available_now, identification, profession, education, height, body_type, ethnicity, religion, drinking, smoking, workout, children, looking_for, verified, is_seed_profile')
        .eq('is_active', true)
        .eq('onboarded', true)
        .eq('is_seed_profile', true)
        .not('id', 'in', `(${excludeIds.join(',')})`)
        .gte('age', activeFilters.ageMin)
        .lte('age', activeFilters.ageMax)
        .limit(50);

      // Apply gender filter to seed profiles too
      if (activeFilters.showMe === 'Women') seedQuery = seedQuery.eq('identification', 'Female');
      else if (activeFilters.showMe === 'Men') seedQuery = seedQuery.eq('identification', 'Male');

      // Apply verified filter to seed profiles
      if (activeFilters.verifiedOnly) {
        seedQuery = seedQuery.eq('verified', true);
      }

      // Apply looking for filter to seed profiles
      if (activeFilters.lookingFor) {
        seedQuery = seedQuery.eq('looking_for', activeFilters.lookingFor);
      }

      const [regularResult, seedResult] = await Promise.all([
        query,
        seedQuery,
      ]);

      if (regularResult.error) throw regularResult.error;
      if (seedResult.error) throw seedResult.error;

      // Merge: regular profiles first, then seed profiles shuffled in
      const regularProfiles = regularResult.data || [];
      const seedProfiles = (seedResult.data || []).sort(() => Math.random() - 0.5);
      const profilesData = [...regularProfiles, ...seedProfiles];

      if (profilesData.length === 0) {
        setProfiles([]);
        setLoading(false);
        return;
      }

      const profileIds = profilesData.map((p) => p.id);

      // BATCH: Fetch all photos, date ideas, interests in parallel
      const [photosResult, ideasResult, interestsResult] = await Promise.all([
        supabase
          .from('profile_photos')
          .select('profile_id, photo_url, sort_order')
          .in('profile_id', profileIds)
          .order('sort_order'),
        supabase
          .from('date_ideas')
          .select('id, profile_id, title, location_name')
          .in('profile_id', profileIds)
          .order('sort_order'),
        supabase
          .from('profile_interests')
          .select('profile_id, interests(name)')
          .in('profile_id', profileIds),
      ]);

      // Group by profile_id
      const photosByProfile = new Map<string, { photo_url: string; sort_order: number }[]>();
      (photosResult.data || []).forEach((p) => {
        if (!photosByProfile.has(p.profile_id)) photosByProfile.set(p.profile_id, []);
        photosByProfile.get(p.profile_id)!.push({ photo_url: p.photo_url, sort_order: p.sort_order });
      });

      const ideasByProfile = new Map<string, { id: string; title: string; location_name: string }[]>();
      (ideasResult.data || []).forEach((d) => {
        if (!ideasByProfile.has(d.profile_id)) ideasByProfile.set(d.profile_id, []);
        ideasByProfile.get(d.profile_id)!.push({ id: d.id, title: d.title, location_name: d.location_name });
      });

      const interestsByProfile = new Map<string, string[]>();
      (interestsResult.data || []).forEach((pi: any) => {
        if (!interestsByProfile.has(pi.profile_id)) interestsByProfile.set(pi.profile_id, []);
        if (pi.interests?.name) interestsByProfile.get(pi.profile_id)!.push(pi.interests.name);
      });

      // Assemble profiles (only those with photos)
      let fullProfiles = profilesData
        .filter((p) => photosByProfile.has(p.id) && photosByProfile.get(p.id)!.length > 0)
        .map((p) => ({
          ...p,
          photos: photosByProfile.get(p.id) || [],
          date_ideas: ideasByProfile.get(p.id) || [],
          interests: interestsByProfile.get(p.id) || [],
        }));

      // Shared interests: sort profiles with more shared interests first
      if (activeFilters.sharedInterests && myInterests.length > 0) {
        fullProfiles.sort((a, b) => {
          const aShared = a.interests.filter((i) => myInterests.includes(i)).length;
          const bShared = b.interests.filter((i) => myInterests.includes(i)).length;
          return bShared - aShared;
        });
      }

      setProfiles(fullProfiles);
    } catch (err: any) {
      console.error('fetchProfiles error:', err);
    } finally {
      setLoading(false);
    }
  }, [filters?.showMe, filters?.ageMin, filters?.ageMax, filters?.maxDistance, filters?.verifiedOnly, filters?.sharedInterests, filters?.lookingFor]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const recordSwipe = useCallback(async (profileId: string, direction: 'left' | 'right' | 'super') => {
    if (!myProfileId) return;

    // Check if this is a seed profile — if so, just record swipe, no match possible
    const swipedProfile = profiles.find((p) => p.id === profileId);
    const isSeed = swipedProfile?.is_seed_profile === true;

    // Optimistic: check if they already swiped right on us BEFORE we swipe
    let theyLikedUs = false;
    if (!isSeed && (direction === 'right' || direction === 'super')) {
      const { data: theirSwipe } = await supabase
        .from('swipes')
        .select('id')
        .eq('swiper_id', profileId)
        .eq('swiped_id', myProfileId)
        .in('direction', ['right', 'super'])
        .maybeSingle();

      theyLikedUs = !!theirSwipe;
    }

    const { error } = await supabase
      .from('swipes')
      .upsert(
        { swiper_id: myProfileId, swiped_id: profileId, direction },
        { onConflict: 'swiper_id,swiped_id', ignoreDuplicates: true }
      );

    if (error) {
      console.error('recordSwipe error:', error);
      return;
    }

    // Show match modal immediately if they already liked us
    if (theyLikedUs) {
      const matchedProfile = profiles.find((p) => p.id === profileId);
      if (matchedProfile) {
        setMatchAlert({
          name: matchedProfile.name,
          photo: matchedProfile.photos[0]?.photo_url || '',
        });
      }
    }
  }, [myProfileId, profiles]);

  const dismissMatchAlert = useCallback(() => {
    setMatchAlert(null);
  }, []);

  return { profiles, loading, myProfileId, recordSwipe, matchAlert, dismissMatchAlert, refresh: fetchProfiles };
}
