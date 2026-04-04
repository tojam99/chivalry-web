import { useState, useEffect, useCallback } from 'react';
import { createClient } from './supabase-browser';

const supabase = createClient();

export interface DateItem {
  id: string;
  match_id: string;
  title: string | null;
  location_name: string | null;
  scheduled_at: string | null;
  proposed_time: string | null;
  proposed_by: string | null;
  proposed_by_name: string | null;
  status: string;
  waiting_on: string | null;
  rating_by_user1: number | null;
  rating_by_user2: number | null;
  other_user: {
    id: string;
    name: string;
    age: number | null;
    photo_url: string | null;
    available_now: boolean;
  };
  date_ideas: { id: string; title: string; location_name: string }[];
  is_user1: boolean;
  is_my_turn: boolean;
  created_at: string;
}

export function useDates() {
  const [dates, setDates] = useState<DateItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [myName, setMyName] = useState<string>('');

  const fetchDates = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('auth_id', user.id)
        .single();

      if (!myProfile) return;
      setMyProfileId(myProfile.id);
      setMyName(myProfile.name || '');

      const [matchesResult, allDatesResult] = await Promise.all([
        supabase
          .from('matches')
          .select('id, user1_id, user2_id')
          .or(`user1_id.eq.${myProfile.id},user2_id.eq.${myProfile.id}`)
          .eq('status', 'active'),
        supabase
          .from('dates')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      const matchesData = matchesResult.data || [];
      if (matchesData.length === 0) {
        setDates([]);
        setLoading(false);
        return;
      }

      const matchIds = matchesData.map((m) => m.id);
      const matchMap = new Map(matchesData.map((m) => [m.id, m]));

      const datesData = (allDatesResult.data || []).filter((d) => matchIds.includes(d.match_id));

      if (datesData.length === 0) {
        setDates([]);
        setLoading(false);
        return;
      }

      const otherUserIds = Array.from(new Set(matchesData.map((m) =>
        m.user1_id === myProfile.id ? m.user2_id : m.user1_id
      )));

      const [profilesResult, photosResult, ideasResult] = await Promise.all([
        supabase.from('profiles').select('id, name, age, available_now').in('id', otherUserIds),
        supabase.from('profile_photos').select('profile_id, photo_url').in('profile_id', otherUserIds).order('sort_order', { ascending: true }),
        supabase.from('date_ideas').select('id, profile_id, title, location_name').in('profile_id', otherUserIds),
      ]);

      const profilesMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));
      const photosMap = new Map<string, string>();
      (photosResult.data || []).forEach((p) => {
        if (!photosMap.has(p.profile_id)) photosMap.set(p.profile_id, p.photo_url);
      });

      const ideasByProfile = new Map<string, { id: string; title: string; location_name: string }[]>();
      (ideasResult.data || []).forEach((d) => {
        if (!ideasByProfile.has(d.profile_id)) ideasByProfile.set(d.profile_id, []);
        ideasByProfile.get(d.profile_id)!.push({ id: d.id, title: d.title, location_name: d.location_name });
      });

      const dateItems: DateItem[] = datesData.map((d) => {
        const match = matchMap.get(d.match_id);
        if (!match) return null;

        const isUser1 = match.user1_id === myProfile.id;
        const otherUserId = isUser1 ? match.user2_id : match.user1_id;
        const otherProfile = profilesMap.get(otherUserId);

        return {
          id: d.id,
          match_id: d.match_id,
          title: d.title,
          location_name: d.location_name,
          scheduled_at: d.scheduled_at,
          proposed_time: d.proposed_time,
          proposed_by: d.proposed_by,
          proposed_by_name: d.proposed_by_name,
          status: d.status,
          waiting_on: d.waiting_on,
          rating_by_user1: d.rating_by_user1,
          rating_by_user2: d.rating_by_user2,
          other_user: {
            id: otherUserId,
            name: otherProfile?.name || 'Unknown',
            age: otherProfile?.age || null,
            photo_url: photosMap.get(otherUserId) || null,
            available_now: otherProfile?.available_now || false,
          },
          date_ideas: ideasByProfile.get(otherUserId) || [],
          is_user1: isUser1,
          is_my_turn: d.waiting_on === myProfile.id || !d.waiting_on,
          created_at: d.created_at,
        };
      }).filter(Boolean) as DateItem[];

      setDates(dateItems);
    } catch (err: any) {
      console.error('useDates error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDates();
  }, [fetchDates]);

  // Step 1: Pick a date idea
  const pickDateIdea = useCallback(async (dateId: string, ideaId: string, otherUserId: string) => {
    const { data: idea } = await supabase
      .from('date_ideas')
      .select('title, location_name, latitude, longitude')
      .eq('id', ideaId)
      .single();

    if (!idea) return;

    const { error } = await supabase
      .from('dates')
      .update({
        date_idea_id: ideaId,
        title: idea.title,
        location_name: idea.location_name,
        latitude: idea.latitude,
        longitude: idea.longitude,
        status: 'pending_accept',
        proposed_by: myProfileId,
        waiting_on: otherUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dateId);

    if (error) console.error('pickDateIdea error:', error);
    else fetchDates();
  }, [myProfileId, fetchDates]);

  // Step 2: Accept the picked date idea
  const acceptDateIdea = useCallback(async (dateId: string, proposerId: string) => {
    const { error } = await supabase
      .from('dates')
      .update({
        status: 'pending_time',
        waiting_on: proposerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dateId);

    if (error) console.error('acceptDateIdea error:', error);
    else fetchDates();
  }, [fetchDates]);

  // Step 2b: Decline the date idea
  const declineDateIdea = useCallback(async (dateId: string, proposerId: string) => {
    const { error } = await supabase
      .from('dates')
      .update({
        status: 'pending_pick',
        title: null,
        location_name: null,
        date_idea_id: null,
        waiting_on: proposerId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dateId);

    if (error) console.error('declineDateIdea error:', error);
    else fetchDates();
  }, [fetchDates]);

  // Step 3: Propose a date/time
  const proposeTime = useCallback(async (dateId: string, proposedTime: string, otherUserId: string) => {
    const { error } = await supabase
      .from('dates')
      .update({
        proposed_time: proposedTime,
        proposed_by: myProfileId,
        proposed_by_name: myName,
        status: 'pending_confirm',
        waiting_on: otherUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dateId);

    if (error) console.error('proposeTime error:', error);
    else fetchDates();
  }, [myProfileId, myName, fetchDates]);

  // Step 4: Confirm the proposed time
  const confirmTime = useCallback(async (dateId: string) => {
    const { data: dateData } = await supabase
      .from('dates')
      .select('proposed_time, status')
      .eq('id', dateId)
      .single();

    if (!dateData || dateData.status === 'confirmed') return;

    const { data: updateResult, error } = await supabase
      .from('dates')
      .update({
        scheduled_at: dateData.proposed_time,
        status: 'confirmed',
        waiting_on: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dateId)
      .eq('status', 'pending_confirm')
      .select('id');

    if (error) {
      console.error('confirmTime error:', error);
      return;
    }

    if (updateResult && updateResult.length > 0) {
      try {
        await supabase.rpc('send_date_confirmed_email', { date_id: dateId });
      } catch (emailErr) {
        console.error('Date confirmation email error:', emailErr);
      }
    }

    fetchDates();
  }, [fetchDates]);

  // Step 4b: Suggest a different time
  const suggestDifferentTime = useCallback(async (dateId: string, newTime: string, otherUserId: string) => {
    const { error } = await supabase
      .from('dates')
      .update({
        proposed_time: newTime,
        proposed_by: myProfileId,
        proposed_by_name: myName,
        status: 'pending_confirm',
        waiting_on: otherUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dateId);

    if (error) console.error('suggestDifferentTime error:', error);
    else fetchDates();
  }, [myProfileId, myName, fetchDates]);

  // Cancel a date
  const cancelDate = useCallback(async (dateId: string, fullCancel: boolean = false) => {
    if (fullCancel) {
      await supabase.from('dates').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', dateId);
    } else {
      await supabase.from('dates').update({
        status: 'pending_pick', title: null, location_name: null, date_idea_id: null,
        scheduled_at: null, proposed_time: null, proposed_by: null, proposed_by_name: null,
        waiting_on: myProfileId, updated_at: new Date().toISOString(),
      }).eq('id', dateId);
    }
    fetchDates();
  }, [fetchDates, myProfileId]);

  // Rate a date
  const rateDate = useCallback(async (dateId: string, rating: number, isUser1: boolean) => {
    const field = isUser1 ? 'rating_by_user1' : 'rating_by_user2';
    const otherField = isUser1 ? 'rating_by_user2' : 'rating_by_user1';

    const { data: currentDate } = await supabase
      .from('dates')
      .select('rating_by_user1, rating_by_user2')
      .eq('id', dateId)
      .single();

    const otherRated = currentDate?.[otherField] != null;
    const newStatus = otherRated ? 'rated' : 'confirmed';

    await supabase.from('dates').update({ [field]: rating, status: newStatus, updated_at: new Date().toISOString() }).eq('id', dateId);
    fetchDates();
  }, [fetchDates]);

  return {
    dates, loading, myProfileId,
    pickDateIdea, acceptDateIdea, declineDateIdea,
    proposeTime, confirmTime, suggestDifferentTime,
    cancelDate, rateDate, refresh: fetchDates,
  };
}
