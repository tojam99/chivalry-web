'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useConversations } from '@/lib/useConversations';
import {
  MessageCircle,
  Calendar,
  ChevronRight,
  Loader2,
  Search,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

function thumbUrl(url: string, width: number = 200): string {
  if (!url) return '';
  if (url.includes('supabase.co/storage/v1/object/public/')) {
    const base = url.replace('/object/public/', '/render/image/public/');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}width=${width}&resize=contain&quality=60`;
  }
  return url;
}

function resolvePhotoUrl(url: string | null): string {
  if (!url) return '';
  return url.startsWith('http') ? thumbUrl(url) : thumbUrl(`${SUPABASE_STORAGE}${url}`);
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return `${Math.floor(days / 7)}w`;
}

export default function MatchesPage() {
  const { conversations, loading, myProfileId } = useConversations();
  const [filter, setFilter] = useState<'all' | 'unread' | 'dates'>('all');
  const [search, setSearch] = useState('');

  const unreadCount = conversations.filter((c) => c.unread_count > 0).length;
  const withDates = conversations.filter((c) => c.date_info);
  const onlineUsers = conversations.filter((c) => c.other_user.available_now);

  const filtered = conversations
    .filter((c) => {
      if (filter === 'unread') return c.unread_count > 0;
      if (filter === 'dates') return c.date_info;
      return true;
    })
    .filter((c) =>
      search ? c.other_user.name.toLowerCase().includes(search.toLowerCase()) : true
    );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="-mx-4">
      {/* Header */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="font-display text-2xl text-sage-800">Messages</h1>
          {unreadCount > 0 && (
            <span className="bg-sage-400 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>

        {/* Search */}
        {conversations.length > 5 && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cream-600" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-cream-100 border border-cream-300 rounded-xl text-sm text-sage-800 placeholder:text-cream-600 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
            />
          </div>
        )}
      </div>

      {/* Online now */}
      {onlineUsers.length > 0 && (
        <div className="px-4 pb-4">
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
            {onlineUsers.map((convo) => (
              <Link
                key={convo.match_id}
                href={`/matches/${convo.match_id}`}
                className="flex flex-col items-center gap-1.5 shrink-0"
              >
                <div className="relative">
                  <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-sage-400">
                    {convo.other_user.photo_url ? (
                      <Image
                        src={resolvePhotoUrl(convo.other_user.photo_url)}
                        alt={convo.other_user.name}
                        width={56}
                        height={56}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-cream-300" />
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-[2.5px] border-cream-50" />
                </div>
                <span className="text-[11px] text-cream-700 truncate max-w-[56px]">
                  {convo.other_user.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 px-4 pb-4">
        {[
          { key: 'all' as const, label: 'All' },
          { key: 'unread' as const, label: `Unread (${unreadCount})` },
          { key: 'dates' as const, label: `With dates (${withDates.length})` },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-xs font-medium px-3.5 py-1.5 rounded-full transition-colors ${
              filter === f.key
                ? 'bg-sage-100 text-sage-600'
                : 'bg-cream-200 text-cream-700 hover:bg-cream-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Conversation list */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center px-4">
          <div className="w-16 h-16 bg-sage-100 rounded-2xl flex items-center justify-center mb-4">
            <MessageCircle className="w-8 h-8 text-sage-400" />
          </div>
          <h2 className="font-display text-xl text-sage-800 mb-2">
            {conversations.length === 0 ? 'No messages yet' : 'Nothing here'}
          </h2>
          <p className="text-cream-700 text-sm max-w-xs">
            {conversations.length === 0
              ? 'Match with someone to start chatting!'
              : filter === 'unread'
              ? "You're all caught up!"
              : 'No conversations with dates yet'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-cream-200">
          {filtered.map((convo) => {
            const isFromMe = convo.last_message_sender === myProfileId;

            return (
              <Link
                key={convo.match_id}
                href={`/matches/${convo.match_id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-cream-100 transition-colors"
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div className="w-13 h-13 rounded-full overflow-hidden" style={{ width: 52, height: 52 }}>
                    {convo.other_user.photo_url ? (
                      <Image
                        src={resolvePhotoUrl(convo.other_user.photo_url)}
                        alt={convo.other_user.name}
                        width={52}
                        height={52}
                        className="object-cover w-full h-full"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full bg-cream-300 rounded-full" />
                    )}
                  </div>
                  {convo.other_user.available_now && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-cream-50" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[15px] truncate ${
                      convo.unread_count > 0 ? 'font-bold text-sage-800' : 'font-semibold text-sage-800'
                    }`}>
                      {convo.other_user.name}
                      {convo.other_user.age ? `, ${convo.other_user.age}` : ''}
                    </span>
                    <span className={`text-[11px] shrink-0 ml-2 ${
                      convo.unread_count > 0 ? 'text-sage-400 font-semibold' : 'text-cream-600'
                    }`}>
                      {timeAgo(convo.last_message_at)}
                    </span>
                  </div>

                  <p className={`text-[13px] truncate ${
                    convo.unread_count > 0 ? 'text-sage-700 font-medium' : 'text-cream-700'
                  }`}>
                    {convo.last_message
                      ? isFromMe
                        ? `You: ${convo.last_message}`
                        : convo.last_message
                      : 'New match! Say hi 👋'}
                  </p>

                  {convo.date_info && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <div className="flex items-center gap-1 bg-cream-200 text-sage-700 text-[11px] font-medium px-2 py-0.5 rounded-md">
                        <Calendar className="w-3 h-3" />
                        <span className="truncate max-w-[140px]">{convo.date_info.title || 'Plan a date'}</span>
                        <ChevronRight className="w-3 h-3 text-cream-600" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Unread badge */}
                {convo.unread_count > 0 && (
                  <div className="w-6 h-6 bg-sage-400 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-white">{convo.unread_count}</span>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
