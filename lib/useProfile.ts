import { useState, useEffect, useCallback } from 'react';
import { createClient } from './supabase-browser';

const supabase = createClient();

export interface ProfileData {
  id: string;
  auth_id: string;
  email: string;
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
  language: string;
  drinking: string;
  smoking: string;
  weed: string;
  workout: string;
  children: string;
  looking_for: string;
  age_min: number;
  age_max: number;
  max_distance: number;
  show_me: string;
  verified: boolean;
  premium: boolean;
  premium_expires_at: string | null;
  is_active: boolean;
  hide_rating: boolean;
  onboarded: boolean;
  photos: { id: string; photo_url: string; sort_order: number }[];
  date_ideas: { id: string; title: string; location_name: string; sort_order: number }[];
  interests: string[];
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (!profileData) { setLoading(false); return; }

      const [photosResult, ideasResult, interestsResult] = await Promise.all([
        supabase.from('profile_photos').select('id, photo_url, sort_order').eq('profile_id', profileData.id).order('sort_order'),
        supabase.from('date_ideas').select('id, title, location_name, sort_order').eq('profile_id', profileData.id).order('sort_order'),
        supabase.from('profile_interests').select('interest_id, interests(name)').eq('profile_id', profileData.id),
      ]);

      const interestNames = (interestsResult.data || []).map((pi: any) => pi.interests?.name).filter(Boolean);

      setProfile({
        ...profileData,
        photos: photosResult.data || [],
        date_ideas: ideasResult.data || [],
        interests: interestNames,
      });
    } catch (err: any) {
      console.error('fetchProfile error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const updateField = useCallback(async (field: string, value: any) => {
    if (!profile) return;
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
    await supabase.from('profiles').update({ [field]: value, updated_at: new Date().toISOString() }).eq('id', profile.id);
  }, [profile?.id]);

  const addDateIdea = useCallback(async (title: string, locationName: string) => {
    if (!profile) return;
    const sortOrder = profile.date_ideas.length;
    const { data, error } = await supabase
      .from('date_ideas')
      .insert({ profile_id: profile.id, title, location_name: locationName, sort_order: sortOrder })
      .select().single();
    if (!error && data) setProfile((prev) => prev ? { ...prev, date_ideas: [...prev.date_ideas, data] } : prev);
    return data;
  }, [profile?.id, profile?.date_ideas.length]);

  const updateDateIdea = useCallback(async (id: string, title: string, locationName: string) => {
    await supabase.from('date_ideas').update({ title, location_name: locationName }).eq('id', id);
    setProfile((prev) => prev ? { ...prev, date_ideas: prev.date_ideas.map((d) => d.id === id ? { ...d, title, location_name: locationName } : d) } : prev);
  }, []);

  const deleteDateIdea = useCallback(async (id: string) => {
    await supabase.from('date_ideas').delete().eq('id', id);
    setProfile((prev) => prev ? { ...prev, date_ideas: prev.date_ideas.filter((d) => d.id !== id) } : prev);
  }, []);

  const toggleInterest = useCallback(async (interestName: string) => {
    if (!profile) return;
    const isSelected = profile.interests.includes(interestName);
    if (isSelected) {
      setProfile((prev) => prev ? { ...prev, interests: prev.interests.filter((i) => i !== interestName) } : prev);
      const { data: row } = await supabase.from('interests').select('id').eq('name', interestName).single();
      if (row) await supabase.from('profile_interests').delete().eq('profile_id', profile.id).eq('interest_id', row.id);
    } else {
      if (profile.interests.length >= 10) return 'max_reached';
      setProfile((prev) => prev ? { ...prev, interests: [...prev.interests, interestName] } : prev);
      const { data: row } = await supabase.from('interests').select('id').eq('name', interestName).single();
      if (row) await supabase.from('profile_interests').insert({ profile_id: profile.id, interest_id: row.id });
    }
  }, [profile?.id, profile?.interests]);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!profile) return null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const fileName = `${user.id}/${Date.now()}.jpg`;
      const { error: uploadError } = await supabase.storage.from('profile-photos').upload(fileName, file, { contentType: file.type, upsert: false });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      const { data: photoRow, error: insertError } = await supabase
        .from('profile_photos')
        .insert({ profile_id: profile.id, photo_url: urlData.publicUrl, sort_order: profile.photos.length })
        .select().single();
      if (insertError) throw insertError;
      setProfile((prev) => prev ? { ...prev, photos: [...prev.photos, photoRow].sort((a, b) => a.sort_order - b.sort_order) } : prev);
      return photoRow;
    } catch (err: any) {
      console.error('uploadPhoto error:', err);
      return null;
    }
  }, [profile?.id, profile?.photos.length]);

  const deletePhoto = useCallback(async (photoId: string) => {
    if (!profile) return;
    await supabase.from('profile_photos').delete().eq('id', photoId);
    const remaining = profile.photos.filter((p) => p.id !== photoId).sort((a, b) => a.sort_order - b.sort_order);
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].sort_order !== i) {
        await supabase.from('profile_photos').update({ sort_order: i }).eq('id', remaining[i].id);
        remaining[i].sort_order = i;
      }
    }
    setProfile((prev) => prev ? { ...prev, photos: remaining } : prev);
  }, [profile?.id, profile?.photos]);

  const signOut = useCallback(async () => { await supabase.auth.signOut(); }, []);

  return { profile, setProfile, loading, fetchProfile, updateField, addDateIdea, updateDateIdea, deleteDateIdea, toggleInterest, uploadPhoto, deletePhoto, signOut };
}
