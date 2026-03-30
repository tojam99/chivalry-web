'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useChat } from '@/lib/useChat';
import {
  ArrowLeft,
  Send,
  Calendar,
  ChevronRight,
  Loader2,
  Check,
  CheckCheck,
  Circle,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

function resolvePhotoUrl(url: string | null, width: number = 200): string {
  if (!url) return '';
  const full = url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
  if (full.includes('supabase.co/storage/v1/object/public/')) {
    const base = full.replace('/object/public/', '/render/image/public/');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}width=${width}&resize=contain&quality=60`;
  }
  return full;
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}

function friendlyStatus(status: string): string {
  const map: Record<string, string> = {
    pending_pick: 'Pick a date idea',
    pending_accept: 'Waiting for response',
    proposed: 'Date proposed',
    confirmed: 'Date confirmed',
    completed: 'Date completed',
    rated: 'Rated',
    cancelled: 'Cancelled',
  };
  return map[status] || status.replace(/_/g, ' ');
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { messages, matchInfo, myProfileId, loading, sendMessage } = useChat(matchId);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    if (!loading) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [loading]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput('');
    setSending(true);
    await sendMessage(content);
    setSending(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Loading conversation...</p>
      </div>
    );
  }

  if (!matchInfo) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-cream-700 mb-4">Conversation not found</p>
        <button
          onClick={() => router.push('/matches')}
          className="text-sage-400 font-medium hover:underline"
        >
          Back to messages
        </button>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  let currentDate = '';
  messages.forEach((msg) => {
    const msgDate = formatDateHeader(msg.created_at);
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  });

  return (
    <div className="flex flex-col -mx-4 -my-6" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-200 bg-cream-50 shrink-0">
        <button
          onClick={() => router.push('/matches')}
          className="text-cream-700 hover:text-sage-600 transition-colors p-1 -ml-1"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="relative">
          <div className="w-10 h-10 rounded-full overflow-hidden">
            {matchInfo.other_user.photo_url ? (
              <Image
                src={resolvePhotoUrl(matchInfo.other_user.photo_url)}
                alt={matchInfo.other_user.name}
                width={40}
                height={40}
                className="object-cover w-full h-full"
                unoptimized
              />
            ) : (
              <div className="w-full h-full bg-cream-300 rounded-full" />
            )}
          </div>
          {matchInfo.other_user.available_now && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-cream-50" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-[15px] font-bold text-sage-800 truncate">
            {matchInfo.other_user.name}
            {matchInfo.other_user.age ? `, ${matchInfo.other_user.age}` : ''}
          </h2>
          {matchInfo.other_user.available_now && (
            <p className="text-[11px] text-green-600 font-medium">Available now</p>
          )}
        </div>
      </div>

      {/* Date card */}
      {matchInfo.date_info && (
        <div className="px-4 py-2.5 border-b border-cream-200 bg-cream-100/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-gold-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-sage-800 truncate">
                {matchInfo.date_info.title}
              </p>
              <p className="text-[11px] text-cream-700 truncate">
                {matchInfo.date_info.location_name} · {friendlyStatus(matchInfo.date_info.status)}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-cream-600 shrink-0" />
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-cream-200">
              {matchInfo.other_user.photo_url ? (
                <Image
                  src={resolvePhotoUrl(matchInfo.other_user.photo_url, 160)}
                  alt={matchInfo.other_user.name}
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full bg-cream-300" />
              )}
            </div>
            <p className="font-display text-lg text-sage-800 mb-1">
              You matched with {matchInfo.other_user.name}!
            </p>
            <p className="text-cream-700 text-sm">Send a message to get things started</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              {/* Date header */}
              <div className="flex justify-center my-4">
                <span className="text-[11px] font-medium text-cream-600 bg-cream-200 px-3 py-1 rounded-full">
                  {group.date}
                </span>
              </div>

              {group.messages.map((msg, idx) => {
                const isMe = msg.sender_id === myProfileId;
                const nextMsg = group.messages[idx + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;

                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${
                      isLastInGroup ? 'mb-2' : 'mb-0.5'
                    }`}
                  >
                    <div
                      className={`max-w-[75%] px-3.5 py-2 ${
                        isMe
                          ? 'bg-sage-400 text-white rounded-2xl rounded-br-md'
                          : 'bg-cream-200 text-sage-800 rounded-2xl rounded-bl-md'
                      }`}
                    >
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <div className={`flex items-center gap-1 mt-0.5 ${
                        isMe ? 'justify-end' : 'justify-start'
                      }`}>
                        <span className={`text-[10px] ${
                          isMe ? 'text-white/60' : 'text-cream-600'
                        }`}>
                          {formatTime(msg.created_at)}
                        </span>
                        {isMe && (
                          msg.read_at
                            ? <CheckCheck className="w-3 h-3 text-white/70" />
                            : <Check className="w-3 h-3 text-white/50" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-cream-200 bg-cream-50 shrink-0">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-cream-100 border border-cream-300 rounded-2xl px-4 py-2.5 text-[14px] text-sage-800 placeholder:text-cream-600 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-10 h-10 bg-sage-400 rounded-full flex items-center justify-center text-white hover:bg-sage-500 transition-colors disabled:opacity-40 disabled:hover:bg-sage-400 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
