'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useChat } from '@/lib/useChat';
import { useActions } from '@/lib/useActions';
import { ActionModal } from '@/components/ActionModal';
import { createClient } from '@/lib/supabase-browser';
import {
  ArrowLeft, Send, Calendar, ChevronRight, ChevronLeft, Loader2, Check, CheckCheck,
  MoreVertical, Heart, MapPin, X, Coffee, Info, ShieldCheck, Leaf, Sparkles, Search,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';
function resolvePhoto(url: string | null): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
}
function formatTime(dateStr: string): string { return new Date(dateStr).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); }
function formatDateHeader(dateStr: string): string {
  const d = new Date(dateStr); const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.floor((today.getTime() - msgDate.getTime()) / 86400000);
  if (diffDays === 0) return 'Today'; if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'long' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
}
function friendlyStatus(status: string): string {
  const map: Record<string, string> = {
    pending_pick: 'Pick a date idea', pending_accept: 'Waiting for response', pending_time: 'Pick a time',
    pending_confirm: 'Confirm time', confirmed: 'Date confirmed', completed: 'Completed', rated: 'Rated', cancelled: 'Cancelled',
  };
  return map[status] || status.replace(/_/g, ' ');
}

// Profile view modal — shows the other user's full profile with date request ability
function ProfileViewModal({ open, onClose, userId, matchId, myProfileId, onDateRequested }: {
  open: boolean; onClose: () => void; userId: string; matchId: string; myProfileId: string | null;
  onDateRequested: () => void;
}) {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<{ photo_url: string }[]>([]);
  const [dateIdeas, setDateIdeas] = useState<{ id: string; title: string; location_name: string }[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true); setPhotoIdx(0); setSuccessMsg(null);
    (async () => {
      const [pRes, phRes, diRes, iRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('profile_photos').select('photo_url, sort_order').eq('profile_id', userId).order('sort_order'),
        supabase.from('date_ideas').select('id, title, location_name').eq('profile_id', userId),
        supabase.from('profile_interests').select('interests(name)').eq('profile_id', userId),
      ]);
      setProfile(pRes.data);
      setPhotos(phRes.data || []);
      setDateIdeas(diRes.data || []);
      setInterests((iRes.data || []).map((i: any) => i.interests?.name).filter(Boolean));
      setLoading(false);
    })();
  }, [open, userId]);

  async function handleRequestDate(idea: { id: string; title: string; location_name: string }) {
    if (!myProfileId || requesting) return;
    setRequesting(true);
    try {
      // Check existing active date
      const { data: existing } = await supabase.from('dates').select('id').eq('match_id', matchId)
        .in('status', ['pending_pick', 'pending_accept', 'pending_time', 'pending_confirm', 'confirmed']);
      if (existing && existing.length > 0) {
        setSuccessMsg('There is already an active date with this person.');
        setRequesting(false);
        return;
      }
      await supabase.from('dates').insert({
        match_id: matchId, title: idea.title, location_name: idea.location_name,
        status: 'pending_accept', proposed_by: myProfileId, proposed_by_name: 'You', waiting_on: userId,
      });
      setSuccessMsg(`Date request for "${idea.title}" sent!`);
      onDateRequested();
    } catch (err) { console.error(err); setSuccessMsg('Failed to send. Try again.'); }
    setRequesting(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-6 px-4">
        <div className="bg-cream-50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
          {/* Close button */}
          <div className="flex items-center justify-between px-5 pt-5">
            <button onClick={onClose} className="text-cream-600 hover:text-sage-800"><X className="w-6 h-6" /></button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 text-sage-400 animate-spin" /></div>
          ) : profile ? (
            <>
              {/* Photo */}
              <div className="relative aspect-[3/4] max-h-[420px] mx-5 mt-3 rounded-2xl overflow-hidden bg-cream-300">
                {photos[photoIdx] && (<img src={resolvePhoto(photos[photoIdx].photo_url)} alt="" className="absolute inset-0 w-full h-full object-cover" />)}
                {photos.length > 1 && (
                  <div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">
                    {photos.map((_, i) => (<div key={i} className={`h-1 rounded-full flex-1 max-w-12 ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />))}
                  </div>
                )}
                {photoIdx > 0 && (<button onClick={() => setPhotoIdx(photoIdx - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"><ChevronLeft className="w-4 h-4" /></button>)}
                {photoIdx < photos.length - 1 && (<button onClick={() => setPhotoIdx(photoIdx + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"><ChevronRight className="w-4 h-4" /></button>)}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <h2 className="text-white font-display text-2xl">{profile.name}, {profile.age}</h2>
                  {profile.city && <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5"><MapPin className="w-3 h-3" /><span>{profile.city}</span></div>}
                </div>
              </div>

              <div className="px-5 pb-6 space-y-4 mt-4">
                {/* Success message */}
                {successMsg && (
                  <div className="bg-sage-100 border border-sage-200 text-sage-700 text-sm font-medium px-4 py-3 rounded-xl text-center">{successMsg}</div>
                )}

                {/* Bio */}
                {profile.bio && <p className="text-sage-800 text-[15px] leading-relaxed">{profile.bio}</p>}

                {/* Request a Date */}
                {dateIdeas.length > 0 && !successMsg && (
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Request a Date</p></div>
                    <div className="space-y-2">
                      {dateIdeas.map((idea) => (
                        <button key={idea.id} onClick={() => handleRequestDate(idea)} disabled={requesting}
                          className="w-full flex items-center gap-3 bg-sage-400 rounded-xl p-3 text-left hover:bg-sage-500 transition-colors disabled:opacity-50">
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{idea.title}</p>
                            {idea.location_name && <p className="text-xs text-white/70">{idea.location_name}</p>}
                          </div>
                          <Calendar className="w-4 h-4 text-white/60 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Basic Info */}
                {(profile.identification || profile.profession || profile.education || profile.height || profile.body_type || profile.ethnicity || profile.religion) && (
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Basic info</p></div>
                    <div className="bg-cream-100 rounded-xl divide-y divide-cream-200">
                      {[
                        { label: 'Identification', value: profile.identification },
                        { label: 'Profession', value: profile.profession },
                        { label: 'Education', value: profile.education },
                        { label: 'Height', value: profile.height },
                        { label: 'Body Type', value: profile.body_type },
                        { label: 'Ethnicity', value: profile.ethnicity },
                        { label: 'Religion', value: profile.religion },
                      ].filter((r) => r.value).map((r) => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm text-cream-600">{r.label}</span>
                          <span className="text-sm font-medium text-sage-800">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lifestyle */}
                {(profile.drinking || profile.smoking || profile.workout || profile.children) && (
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Lifestyle</p></div>
                    <div className="bg-cream-100 rounded-xl divide-y divide-cream-200">
                      {[
                        { label: 'Drinking', value: profile.drinking },
                        { label: 'Smoking', value: profile.smoking },
                        { label: 'Workout', value: profile.workout },
                        { label: 'Children', value: profile.children },
                      ].filter((r) => r.value).map((r) => (
                        <div key={r.label} className="flex items-center justify-between px-4 py-2.5">
                          <span className="text-sm text-cream-600">{r.label}</span>
                          <span className="text-sm font-medium text-sage-800">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                {interests.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Interests</p></div>
                    <div className="flex flex-wrap gap-1.5">
                      {interests.map((i, idx) => (<span key={idx} className="bg-sage-100 text-sage-600 text-xs font-medium px-3 py-1.5 rounded-lg">{i}</span>))}
                    </div>
                  </div>
                )}

                {/* Looking For */}
                {profile.looking_for && (
                  <div>
                    <div className="flex items-center gap-2 mb-2"><Search className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Looking for</p></div>
                    <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-600 text-sm font-medium px-4 py-2 rounded-xl"><Heart className="w-4 h-4" />{profile.looking_for}</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-cream-600">Profile not found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;
  const { messages, matchInfo, myProfileId, loading, sendMessage, refresh: refreshChat } = useChat(matchId);
  const { showActions, modalState, closeModal } = useActions(myProfileId);

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  useEffect(() => { if (!loading) setTimeout(() => inputRef.current?.focus(), 100); }, [loading]);

  async function handleSend() {
    if (!input.trim() || sending) return;
    const content = input.trim(); setInput(''); setSending(true);
    await sendMessage(content); setSending(false); inputRef.current?.focus();
  }
  function handleKeyDown(e: React.KeyboardEvent) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }

  if (loading) {
    return (<div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" /><p className="text-cream-700">Loading conversation...</p></div>);
  }
  if (!matchInfo) {
    return (<div className="flex flex-col items-center justify-center min-h-[60vh] text-center"><p className="text-cream-700 mb-4">Conversation not found</p><button onClick={() => router.push('/matches')} className="text-sage-400 font-medium hover:underline">Back to messages</button></div>);
  }

  const groupedMessages: { date: string; messages: typeof messages }[] = [];
  let currentDate = '';
  messages.forEach((msg) => {
    const msgDate = formatDateHeader(msg.created_at);
    if (msgDate !== currentDate) { currentDate = msgDate; groupedMessages.push({ date: msgDate, messages: [] }); }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  });

  return (
    <div className="flex flex-col -mx-4 -my-6" style={{ height: 'calc(100vh - 8rem)' }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-cream-200 bg-cream-50 shrink-0">
        <button onClick={() => router.push('/matches')} className="text-cream-700 hover:text-sage-600 p-1 -ml-1"><ArrowLeft className="w-5 h-5" /></button>
        {/* Clickable avatar + name → opens profile */}
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden">
              {matchInfo.other_user.photo_url ? (
                <img src={resolvePhoto(matchInfo.other_user.photo_url)} alt={matchInfo.other_user.name} className="object-cover w-full h-full" />
              ) : <div className="w-full h-full bg-cream-300 rounded-full" />}
            </div>
            {matchInfo.other_user.available_now && <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-cream-50" />}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-sage-800 truncate">{matchInfo.other_user.name}{matchInfo.other_user.age ? `, ${matchInfo.other_user.age}` : ''}</h2>
            {matchInfo.other_user.available_now && <p className="text-[11px] text-green-600 font-medium">Available now</p>}
          </div>
        </button>
        <button onClick={() => showActions(matchId, matchInfo.other_user.id, matchInfo.other_user.name, () => router.push('/matches'))} className="text-cream-600 hover:text-sage-800 p-1">
          <MoreVertical className="w-5 h-5" />
        </button>
      </div>

      {/* Date banner — existing date OR Request a Date */}
      {matchInfo.date_info ? (
        <button onClick={() => router.push('/dates')} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-cream-200 bg-cream-100/50 shrink-0 hover:bg-cream-100 transition-colors w-full text-left">
          <div className="w-8 h-8 bg-gold-400/20 rounded-lg flex items-center justify-center shrink-0"><Calendar className="w-4 h-4 text-gold-600" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-sage-800 truncate">{matchInfo.date_info.title || 'Plan a date'}</p>
            <p className="text-[11px] text-cream-700 truncate">{matchInfo.date_info.location_name ? `${matchInfo.date_info.location_name} · ` : ''}{friendlyStatus(matchInfo.date_info.status)}</p>
          </div>
          <ChevronRight className="w-4 h-4 text-cream-600 shrink-0" />
        </button>
      ) : (
        <button onClick={() => setShowProfile(true)} className="flex items-center gap-2.5 px-4 py-2.5 border-b border-cream-200 bg-sage-50 shrink-0 hover:bg-sage-100 transition-colors w-full text-left">
          <Heart className="w-4 h-4 text-sage-400 shrink-0" />
          <span className="text-[13px] font-semibold text-sage-600 flex-1">Request a Date</span>
          <ChevronRight className="w-4 h-4 text-sage-400 shrink-0" />
        </button>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-cream-200">
              {matchInfo.other_user.photo_url ? (<img src={resolvePhoto(matchInfo.other_user.photo_url)} alt={matchInfo.other_user.name} className="object-cover w-full h-full" />) : <div className="w-full h-full bg-cream-300" />}
            </div>
            <p className="font-display text-lg text-sage-800 mb-1">You matched with {matchInfo.other_user.name}!</p>
            <p className="text-cream-700 text-sm">Send a message to get things started</p>
          </div>
        ) : (
          groupedMessages.map((group) => (
            <div key={group.date}>
              <div className="flex justify-center my-4"><span className="text-[11px] font-medium text-cream-600 bg-cream-200 px-3 py-1 rounded-full">{group.date}</span></div>
              {group.messages.map((msg, idx) => {
                const isMe = msg.sender_id === myProfileId;
                const nextMsg = group.messages[idx + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender_id !== msg.sender_id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-2' : 'mb-0.5'}`}>
                    <div className={`max-w-[75%] px-3.5 py-2 ${isMe ? 'bg-sage-400 text-white rounded-2xl rounded-br-md' : 'bg-cream-200 text-sage-800 rounded-2xl rounded-bl-md'}`}>
                      <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                      <div className={`flex items-center gap-1 mt-0.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-cream-600'}`}>{formatTime(msg.created_at)}</span>
                        {isMe && (msg.read_at ? <CheckCheck className="w-3 h-3 text-white/70" /> : <Check className="w-3 h-3 text-white/50" />)}
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

      {/* Input */}
      <div className="px-4 py-3 border-t border-cream-200 bg-cream-50 shrink-0">
        <div className="flex items-center gap-2">
          <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type a message..." className="flex-1 bg-cream-100 border border-cream-300 rounded-2xl px-4 py-2.5 text-[14px] text-sage-800 placeholder:text-cream-600 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400" />
          <button onClick={handleSend} disabled={!input.trim() || sending} className="w-10 h-10 bg-sage-400 rounded-full flex items-center justify-center text-white hover:bg-sage-500 disabled:opacity-40 shrink-0"><Send className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Profile View Modal */}
      <ProfileViewModal
        open={showProfile}
        onClose={() => setShowProfile(false)}
        userId={matchInfo.other_user.id}
        matchId={matchId}
        myProfileId={myProfileId}
        onDateRequested={() => { refreshChat(); }}
      />

      <ActionModal state={modalState} onClose={closeModal} />
    </div>
  );
}
