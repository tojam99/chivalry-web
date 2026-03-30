'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';

export interface Conversation {
  match_id: string;
  match_status: string;
  other_user: {
    id: string;
    name: string;
    age: number | null;
    photo_url: string | null;
    available_now: boolean;
  };
  last_message: string | null;
  last_message_at: string | null;
  last_message_sender: string | null;
  unread_count: number;
  date_info: {
    title: string;
    location_name: string;
    status: string;
    scheduled_at: string | null;
  } | null;
}

export function useConversations() {
  const supabase = createClient();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const channelRef = useRef<any>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!myProfile) return;
      setMyProfileId(myProfile.id);

      // Single RPC call gets everything
      const { data, error } = await supabase.rpc('get_conversations', {
        my_profile_id: myProfile.id,
      });

      if (error) {
        console.error('[Conversations] RPC error:', error);
        setLoading(false);
        return;
      }

      const convos: Conversation[] = (data || []).map((c: any) => ({
        match_id: c.match_id,
        match_status: c.match_status,
        other_user: {
          id: c.other_user.id,
          name: c.other_user.name,
          age: c.other_user.age,
          photo_url: c.other_user.photo_url,
          available_now: c.other_user.available_now,
        },
        last_message: c.last_message || null,
        last_message_at: c.last_message_at || c.match_created_at,
        last_message_sender: c.last_message_sender || null,
        unread_count: c.unread_count || 0,
        date_info: c.date_info || null,
      }));

      setConversations(convos);
      setLoading(false);
    } catch (err) {
      console.error('[Conversations] Error:', err);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Real-time subscription for new messages
  useEffect(() => {
    if (!myProfileId) return;

    channelRef.current = supabase
      .channel('conversations-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [myProfileId, fetchConversations]);

  return { conversations, loading, myProfileId, refresh: fetchConversations };
}
