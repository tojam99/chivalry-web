'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase-browser';

export interface Profile {
  id: string;
  auth_id: string;
  name: string;
  age: number;
  bio: string;
  city: string;
  latitude: number;
  longitude: number;
  identification: string;
  profession: string;
  education: string;
  height: string;
  looking_for: string;
  age_min: number;
  age_max: number;
  max_distance: number;
  show_me: string;
  verified: boolean;
  onboarded: boolean;
  available_now: boolean;
  photos?: { id: string; url: string; position: number }[];
  date_ideas?: { id: string; title: string; location_name: string }[];
}

export function useProfile() {
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('auth_id', user.id)
        .single();

      if (data) setProfile(data);
      setLoading(false);
    }
    fetchProfile();
  }, []);

  return { profile, loading, setProfile };
}
