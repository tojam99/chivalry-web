'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';

export interface ChatMessage {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ChatMatch {
  id: string;
  other_user: {
    id: string;
    name: string;
    age: number | null;
    photo_url: string | null;
    available_now: boolean;
  };
  date_info: {
    id: string;
    title: string;
    location_name: string;
    status: string;
    scheduled_at: string | null;
  } | null;
}

export function useChat(matchId: string) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [matchInfo, setMatchInfo] = useState<ChatMatch | null>(null);
  const [myProfileId, setMyProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  // Fetch match info and messages
  const fetchChat = useCallback(async () => {
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

      // Get match
      const { data: match } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id')
        .eq('id', matchId)
        .single();

      if (!match) return;

      const otherUserId = match.user1_id === myProfile.id ? match.user2_id : match.user1_id;

      // Get other user profile + photo
      const { data: otherProfile } = await supabase
        .from('profiles')
        .select('id, name, age, available_now')
        .eq('id', otherUserId)
        .single();

      const { data: photos } = await supabase
        .from('profile_photos')
        .select('photo_url')
        .eq('profile_id', otherUserId)
        .order('sort_order', { ascending: true })
        .limit(1);

      // Get date info
      const { data: dateInfo } = await supabase
        .from('dates')
        .select('id, title, location_name, status, scheduled_at')
        .eq('match_id', matchId)
        .not('status', 'eq', 'cancelled')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setMatchInfo({
        id: match.id,
        other_user: {
          id: otherProfile?.id || otherUserId,
          name: otherProfile?.name || 'Unknown',
          age: otherProfile?.age || null,
          photo_url: photos?.[0]?.photo_url || null,
          available_now: otherProfile?.available_now || false,
        },
        date_info: dateInfo || null,
      });

      // Fetch messages
      const { data: msgs } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);

      // Mark unread messages as read
      await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .eq('sender_id', otherUserId)
        .is('read_at', null);

      setLoading(false);
    } catch (err) {
      console.error('[Chat] Error:', err);
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    fetchChat();
  }, [fetchChat]);

  // Real-time subscription
  useEffect(() => {
    if (!matchId || !myProfileId) return;

    channelRef.current = supabase
      .channel(`chat-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          const newMsg = payload.new as ChatMessage;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });

          // Mark as read if from the other person
          if (newMsg.sender_id !== myProfileId) {
            supabase
              .from('messages')
              .update({ read_at: new Date().toISOString() })
              .eq('id', newMsg.id)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [matchId, myProfileId]);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!myProfileId || !content.trim()) return;

      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: myProfileId,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('[Chat] Send error:', error);
        return null;
      }

      return data;
    },
    [matchId, myProfileId]
  );

  return { messages, matchInfo, myProfileId, loading, sendMessage, refresh: fetchChat };
}
