'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDates, type DateItem } from '@/lib/useDates';
import {
  Calendar,
  MapPin,
  Clock,
  Star,
  Loader2,
  ChevronRight,
  CheckCircle2,
  CircleDot,
  XCircle,
  Hand,
  Hourglass,
  X,
  Check,
  MessageCircle,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

function resolvePhoto(url: string | null): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
}

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  let dayStr = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
  if (d.toDateString() === now.toDateString()) dayStr = 'Today';
  else if (d.toDateString() === tomorrow.toDateString()) dayStr = 'Tomorrow';
  const timeStr = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  return `${dayStr}, ${timeStr}`;
}

function timeUntil(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Now!';
  const hours = Math.floor(diff / 3600000);
  if (hours < 24) return `${hours}h ${Math.floor((diff % 3600000) / 60000)}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
}

// ── Confirm Modal ──
function ConfirmModal({ open, title, message, confirmText, confirmColor, onConfirm, onClose }: {
  open: boolean; title: string; message: string; confirmText: string; confirmColor?: string;
  onConfirm: () => void; onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <h3 className="font-display text-xl text-sage-800 mb-2">{title}</h3>
        <p className="text-cream-700 text-sm mb-6 whitespace-pre-line">{message}</p>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-cream-200 text-cream-700 font-medium text-sm hover:bg-cream-300 transition-colors">Cancel</button>
          <button onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white transition-colors"
            style={{ backgroundColor: confirmColor || '#7A9A6D' }}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Date/Time Picker Modal ──
function DateTimePickerModal({ open, title, onClose, onSubmit }: {
  open: boolean; title: string; onClose: () => void; onSubmit: (iso: string) => void;
}) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  useEffect(() => {
    if (open) {
      const now = new Date();
      now.setHours(now.getHours() + 2);
      setDate(now.toISOString().split('T')[0]);
      setTime(now.toTimeString().slice(0, 5));
    }
  }, [open]);

  if (!open) return null;

  const handleSubmit = () => {
    const dt = new Date(`${date}T${time}`);
    if (dt <= new Date()) {
      alert('Please pick a time in the future.');
      return;
    }
    onSubmit(dt.toISOString());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
      <div className="bg-cream-50 rounded-t-3xl sm:rounded-3xl w-full max-w-md p-6 pb-10 sm:pb-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display text-xl text-sage-800">{title}</h3>
          <button onClick={onClose} className="text-cream-600 hover:text-sage-800"><X className="w-6 h-6" /></button>
        </div>
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-sage-800 mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400" />
          </div>
          <div>
            <label className="block text-sm font-medium text-sage-800 mb-1.5">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400" />
          </div>
        </div>
        <button onClick={handleSubmit} className="w-full bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500 transition-colors">
          {title.includes('Suggest') ? 'Suggest This Time' : 'Propose This Time'}
        </button>
      </div>
    </div>
  );
}

// ── Star Rating ──
function StarRating({ onRate }: { onRate: (star: number) => void }) {
  const [selected, setSelected] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  return (
    <div className="text-center">
      <div className="flex justify-center gap-2 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button key={star} onClick={() => { if (!submitted) { setSelected(star); setSubmitted(true); onRate(star); } }}
            className="p-1 transition-transform hover:scale-110">
            <Star className={`w-8 h-8 ${star <= selected ? 'text-sage-400 fill-sage-400' : 'text-cream-400'}`} />
          </button>
        ))}
      </div>
      <p className="text-xs text-cream-600">{submitted ? `Rated ${selected}/5` : 'Tap a star to rate'}</p>
    </div>
  );
}

// ── CARD: Pending Pick (your turn to pick a date idea) ──
function PendingPickCard({ date, onPickIdea, onCancel, showConfirm }: {
  date: DateItem; onPickIdea: (ideaId: string) => void; onCancel: () => void;
  showConfirm: (t: string, m: string, c: string, fn: () => void) => void;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <img src={resolvePhoto(date.other_user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <p className="font-bold text-sage-800">{date.other_user.name}</p>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sage-400 text-white px-2 py-0.5 rounded-md">
            <Hand className="w-3 h-3" />Your turn — pick a date!
          </span>
        </div>
      </div>
      {date.date_ideas.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs text-cream-600 font-medium">Their date ideas:</p>
          {date.date_ideas.map((idea) => (
            <button key={idea.id} onClick={() => showConfirm('Pick this date?', `${idea.title}${idea.location_name ? `\n${idea.location_name}` : ''}`, 'Pick This!', () => onPickIdea(idea.id))}
              className="w-full flex items-center gap-3 bg-sage-400 rounded-xl p-3 text-left hover:bg-sage-500 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{idea.title}</p>
                {idea.location_name && <p className="text-xs text-white/70">{idea.location_name}</p>}
              </div>
              <ChevronRight className="w-4 h-4 text-white/60" />
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-cream-600 text-center py-2">No date ideas yet — send them a message!</p>
      )}
      <button onClick={onCancel} className="flex items-center justify-center gap-1 w-full mt-3 pt-3 border-t border-cream-200 text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3" />Cancel Date
      </button>
    </div>
  );
}

// ── CARD: Pending Accept (accept or decline the picked idea) ──
function PendingAcceptCard({ date, onAccept, onDecline, onCancel }: {
  date: DateItem; onAccept: () => void; onDecline: () => void; onCancel: () => void;
}) {
  return (
    <div className={`bg-white border rounded-2xl p-4 mb-3 ${date.is_my_turn ? 'border-sage-200' : 'border-cream-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        <img src={resolvePhoto(date.other_user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <p className="font-bold text-sage-800">{date.other_user.name}</p>
          {date.is_my_turn ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sage-400 text-white px-2 py-0.5 rounded-md"><Hand className="w-3 h-3" />Your turn!</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-cream-200 text-cream-600 px-2 py-0.5 rounded-md"><Hourglass className="w-3 h-3" />Waiting on {date.other_user.name}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-sage-100/50 rounded-xl p-3 mb-3">
        <MapPin className="w-4 h-4 text-sage-400 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-sage-800">{date.title}</p>
          {date.location_name && <p className="text-xs text-cream-600">{date.location_name}</p>}
        </div>
      </div>
      {date.is_my_turn ? (
        <div className="flex gap-2">
          <button onClick={onDecline} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-cream-200 text-cream-700 text-sm font-medium hover:bg-cream-300">
            <X className="w-4 h-4" />Decline
          </button>
          <button onClick={onAccept} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-sage-400 text-white text-sm font-medium hover:bg-sage-500">
            <Check className="w-4 h-4" />Accept
          </button>
        </div>
      ) : (
        <p className="text-sm text-cream-600 text-center italic">Waiting for {date.other_user.name} to respond...</p>
      )}
      <button onClick={onCancel} className="flex items-center justify-center gap-1 w-full mt-3 pt-3 border-t border-cream-200 text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3" />Cancel Date
      </button>
    </div>
  );
}

// ── CARD: Pending Time (propose a date/time) ──
function PendingTimeCard({ date, onProposeTime, onCancel }: {
  date: DateItem; onProposeTime: (time: string) => void; onCancel: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div className={`bg-white border rounded-2xl p-4 mb-3 ${date.is_my_turn ? 'border-sage-200' : 'border-cream-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        <img src={resolvePhoto(date.other_user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <p className="font-bold text-sage-800">{date.other_user.name}</p>
          {date.is_my_turn ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sage-400 text-white px-2 py-0.5 rounded-md"><Hand className="w-3 h-3" />Your turn — pick a time!</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-cream-200 text-cream-600 px-2 py-0.5 rounded-md"><Hourglass className="w-3 h-3" />Waiting on {date.other_user.name}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-sage-100/50 rounded-xl p-3 mb-3">
        <MapPin className="w-4 h-4 text-sage-400 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-sage-800">{date.title}</p>
          {date.location_name && <p className="text-xs text-cream-600">{date.location_name}</p>}
        </div>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-sage-600"><CheckCircle2 className="w-3 h-3" />Accepted</span>
      </div>
      {date.is_my_turn && (
        <button onClick={() => setShowPicker(true)} className="w-full flex items-center justify-center gap-2 bg-sage-400 text-white font-medium py-2.5 rounded-xl hover:bg-sage-500 transition-colors mb-1">
          <Calendar className="w-4 h-4" />Propose Date & Time
        </button>
      )}
      <button onClick={onCancel} className="flex items-center justify-center gap-1 w-full mt-3 pt-3 border-t border-cream-200 text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3" />Cancel Date
      </button>
      <DateTimePickerModal open={showPicker} title="Propose Date & Time" onClose={() => setShowPicker(false)} onSubmit={onProposeTime} />
    </div>
  );
}

// ── CARD: Pending Confirm (confirm or suggest different time) ──
function PendingConfirmCard({ date, onConfirm, onSuggestDifferent, onCancel }: {
  date: DateItem; onConfirm: () => void; onSuggestDifferent: (time: string) => void; onCancel: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);
  return (
    <div className={`bg-white border rounded-2xl p-4 mb-3 ${date.is_my_turn ? 'border-sage-200' : 'border-cream-200'}`}>
      <div className="flex items-center gap-3 mb-3">
        <img src={resolvePhoto(date.other_user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <p className="font-bold text-sage-800">{date.other_user.name}</p>
          {date.is_my_turn ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-sage-400 text-white px-2 py-0.5 rounded-md"><Hand className="w-3 h-3" />Your turn!</span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-cream-200 text-cream-600 px-2 py-0.5 rounded-md"><Hourglass className="w-3 h-3" />Waiting on {date.other_user.name}</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 bg-sage-100/50 rounded-xl p-3 mb-2">
        <MapPin className="w-4 h-4 text-sage-400 shrink-0" />
        <div><p className="text-sm font-semibold text-sage-800">{date.title}</p>{date.location_name && <p className="text-xs text-cream-600">{date.location_name}</p>}</div>
      </div>
      <div className="flex items-center gap-2 bg-sage-100/30 rounded-xl p-3 mb-3">
        <Clock className="w-4 h-4 text-sage-400 shrink-0" />
        <div>
          <p className="text-xs text-cream-600">{date.proposed_by_name || 'They'} suggested:</p>
          <p className="text-sm font-semibold text-sage-800">{formatDateTime(date.proposed_time)}</p>
        </div>
      </div>
      {date.is_my_turn ? (
        <div className="flex gap-2">
          <button onClick={() => setShowPicker(true)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-cream-200 text-sage-600 text-sm font-medium hover:bg-cream-300">
            <Clock className="w-4 h-4" />Different Time
          </button>
          <button onClick={onConfirm} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-sage-400 text-white text-sm font-medium hover:bg-sage-500">
            <Check className="w-4 h-4" />Confirm!
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-sm text-cream-600 italic mb-2">Waiting for {date.other_user.name} to confirm...</p>
          <button onClick={() => setShowPicker(true)} className="inline-flex items-center gap-1 text-sage-400 text-sm font-medium hover:underline">
            <Clock className="w-4 h-4" />Change Time
          </button>
        </div>
      )}
      <button onClick={onCancel} className="flex items-center justify-center gap-1 w-full mt-3 pt-3 border-t border-cream-200 text-red-400 text-xs font-medium">
        <XCircle className="w-3 h-3" />Cancel Date
      </button>
      <DateTimePickerModal open={showPicker} title="Suggest a Different Time" onClose={() => setShowPicker(false)} onSubmit={onSuggestDifferent} />
    </div>
  );
}

// ── CARD: Confirmed ──
function ConfirmedCard({ date, onCancel, router }: {
  date: DateItem; onCancel: () => void; router: any;
}) {
  const countdown = timeUntil(date.scheduled_at);
  return (
    <div className="bg-white border border-sage-200/50 rounded-2xl p-4 mb-3">
      {countdown && (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-sage-400 text-white px-2.5 py-1 rounded-lg mb-2">
          <Clock className="w-3 h-3" />{countdown}
        </span>
      )}
      <div className="flex items-center gap-3 mb-3">
        <img src={resolvePhoto(date.other_user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-sage-400" />
        <div className="flex-1">
          <p className="font-bold text-sage-800">{date.other_user.name}</p>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage-600"><CheckCircle2 className="w-3 h-3" />Confirmed!</span>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-sage-100/50 rounded-xl p-3 mb-2">
        <MapPin className="w-4 h-4 text-sage-400" />
        <div><p className="text-sm font-semibold text-sage-800">{date.title}</p>{date.location_name && <p className="text-xs text-cream-600">{date.location_name}</p>}</div>
      </div>
      <div className="flex items-center gap-2 bg-sage-100/30 rounded-xl p-3 mb-3">
        <Calendar className="w-4 h-4 text-sage-400" />
        <p className="text-sm font-semibold text-sage-600">{formatDateTime(date.scheduled_at)}</p>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-cream-200 text-cream-700 text-sm font-medium hover:bg-cream-300">
          <XCircle className="w-4 h-4 text-red-400" />Cancel
        </button>
        <button onClick={() => router.push(`/matches/${date.match_id}`)} className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl bg-sage-100 text-sage-600 text-sm font-medium hover:bg-sage-200 border border-sage-200">
          <MessageCircle className="w-4 h-4" />Message
        </button>
      </div>
    </div>
  );
}

// ── CARD: Needs Rating ──
function NeedsRatingCard({ date, onRate }: { date: DateItem; onRate: (rating: number) => void }) {
  return (
    <div className="bg-white border border-sage-200/50 rounded-2xl p-4 mb-3">
      <div className="flex items-center gap-3 mb-3">
        <img src={resolvePhoto(date.other_user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover" />
        <div className="flex-1">
          <p className="font-bold text-sage-800">{date.other_user.name}</p>
          <p className="text-xs font-semibold text-sage-400">How was your date?</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-sage-100/50 rounded-xl p-3 mb-2">
        <MapPin className="w-4 h-4 text-sage-400" />
        <div><p className="text-sm font-semibold text-sage-800">{date.title}</p></div>
      </div>
      <p className="text-xs text-cream-600 text-center mb-3">{formatDateTime(date.scheduled_at)}</p>
      <StarRating onRate={onRate} />
    </div>
  );
}

// ── CARD: Completed/Past ──
function CompletedCard({ date }: { date: DateItem }) {
  const myRating = date.is_user1 ? date.rating_by_user1 : date.rating_by_user2;
  return (
    <div className="flex items-center gap-3 bg-white border border-cream-200 rounded-2xl p-4 mb-3">
      <img src={resolvePhoto(date.other_user.photo_url)} alt="" className="w-12 h-12 rounded-full object-cover opacity-80" />
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sage-800 truncate">{date.other_user.name}</p>
        <p className="text-xs text-cream-600 flex items-center gap-1"><MapPin className="w-3 h-3 text-sage-400" />{date.title}</p>
        <p className="text-[11px] text-cream-500">{formatDateTime(date.scheduled_at)}</p>
      </div>
      {myRating && (
        <div className="text-right shrink-0">
          <div className="flex gap-0.5">{[1,2,3,4,5].map((s) => <Star key={s} className={`w-3.5 h-3.5 ${s <= myRating ? 'text-sage-400 fill-sage-400' : 'text-cream-300'}`} />)}</div>
          <p className="text-[11px] text-cream-600 mt-0.5">{myRating}/5</p>
        </div>
      )}
    </div>
  );
}

// ═══ MAIN PAGE ═══
export default function DatesPage() {
  const {
    dates, loading, myProfileId,
    pickDateIdea, acceptDateIdea, declineDateIdea,
    proposeTime, confirmTime, suggestDifferentTime,
    cancelDate, rateDate, refresh,
  } = useDates();

  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<'all' | 'upcoming' | 'pending' | 'rate' | 'past'>('all');
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; title: string; message: string; confirmText: string; confirmColor?: string; onConfirm: () => void }>({
    open: false, title: '', message: '', confirmText: '', onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, confirmText: string, onConfirm: () => void, confirmColor?: string) => {
    setConfirmModal({ open: true, title, message, confirmText, confirmColor, onConfirm });
  };

  const now = new Date();
  const upcoming = dates.filter((d) => d.status === 'confirmed' && d.scheduled_at && new Date(d.scheduled_at) > now);
  const needsRating = dates.filter((d) => {
    const myRating = d.is_user1 ? d.rating_by_user1 : d.rating_by_user2;
    if (myRating) return false;
    if (d.status === 'completed') return true;
    if (d.status === 'confirmed' && d.scheduled_at && new Date(d.scheduled_at) <= now) return true;
    return false;
  });
  const pending = dates.filter((d) => ['pending_pick', 'pending_accept', 'pending_time', 'pending_confirm'].includes(d.status));
  const past = dates.filter((d) => d.status === 'completed' || d.status === 'rated');
  const myTurnCount = pending.filter((d) => d.is_my_turn).length;

  const sortedPending = [...pending].sort((a, b) => (a.is_my_turn === b.is_my_turn ? 0 : a.is_my_turn ? -1 : 1));

  const showUpcoming = activeFilter === 'all' || activeFilter === 'upcoming';
  const showPending = activeFilter === 'all' || activeFilter === 'pending';
  const showRate = activeFilter === 'all' || activeFilter === 'rate';
  const showPast = activeFilter === 'all' || activeFilter === 'past';

  const filters = [
    { key: 'all' as const, label: 'All' },
    { key: 'upcoming' as const, label: `Soon ${upcoming.length}` },
    { key: 'pending' as const, label: `Pending ${pending.length}` },
    { key: 'rate' as const, label: `Rate ${needsRating.length}` },
    { key: 'past' as const, label: `Past ${past.length}` },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Loading dates...</p>
      </div>
    );
  }

  if (dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 bg-gold-400/20 rounded-2xl flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-gold-600" />
        </div>
        <h1 className="font-display text-2xl text-sage-800 mb-2">No dates yet</h1>
        <p className="text-cream-700 max-w-sm">Match with someone and pick a date idea!</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-2">
        <h1 className="font-display text-2xl text-sage-800">My Dates</h1>
        <p className="text-sm text-cream-600 mt-1">
          {upcoming.length} upcoming · {needsRating.length > 0 ? `${needsRating.length} to rate` : myTurnCount > 0 ? `${myTurnCount} need your response` : `${pending.length} pending`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2 scrollbar-hide">
        {filters.map((f) => (
          <button key={f.key} onClick={() => setActiveFilter(f.key)}
            className={`text-xs font-medium px-3.5 py-2 rounded-full whitespace-nowrap transition-colors ${
              activeFilter === f.key ? 'bg-cream-400/50 text-sage-800' : 'bg-cream-200 text-cream-600 hover:bg-cream-300'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Upcoming */}
      {showUpcoming && upcoming.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3 mt-2"><Calendar className="w-4 h-4 text-sage-400" /><h2 className="text-base font-bold text-sage-800">Upcoming</h2></div>
          {upcoming.map((d) => <ConfirmedCard key={d.id} date={d} router={router} onCancel={() => showConfirm('Cancel Date', 'Do you want to cancel this date entirely?', 'Cancel Entirely', () => cancelDate(d.id, true), '#C4756A')} />)}
        </>
      )}

      {/* Pending */}
      {showPending && sortedPending.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3 mt-4">
            <Hourglass className="w-4 h-4 text-sage-400" />
            <h2 className="text-base font-bold text-sage-800">Pending</h2>
            {myTurnCount > 0 && <span className="ml-auto text-[11px] font-bold bg-sage-400 text-white px-2 py-0.5 rounded-lg">{myTurnCount} need response</span>}
          </div>
          {sortedPending.map((d) => {
            const handleCancel = () => showConfirm('Cancel Date', 'Do you want to cancel this date entirely?', 'Cancel Entirely', () => cancelDate(d.id, true), '#C4756A');
            if (d.status === 'pending_pick') return <PendingPickCard key={d.id} date={d} onPickIdea={(ideaId) => pickDateIdea(d.id, ideaId, d.other_user.id)} onCancel={handleCancel} showConfirm={showConfirm} />;
            if (d.status === 'pending_accept') return <PendingAcceptCard key={d.id} date={d} onAccept={() => acceptDateIdea(d.id, d.is_user1 ? d.other_user.id : myProfileId!)} onDecline={() => declineDateIdea(d.id, d.is_user1 ? d.other_user.id : myProfileId!)} onCancel={handleCancel} />;
            if (d.status === 'pending_time') return <PendingTimeCard key={d.id} date={d} onProposeTime={(time) => proposeTime(d.id, time, d.other_user.id)} onCancel={handleCancel} />;
            if (d.status === 'pending_confirm') return <PendingConfirmCard key={d.id} date={d} onConfirm={() => confirmTime(d.id)} onSuggestDifferent={(time) => suggestDifferentTime(d.id, time, d.other_user.id)} onCancel={handleCancel} />;
            return null;
          })}
        </>
      )}

      {/* Needs Rating */}
      {showRate && needsRating.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3 mt-4"><Star className="w-4 h-4 text-sage-400" /><h2 className="text-base font-bold text-sage-800">Rate Your Date</h2></div>
          {needsRating.map((d) => <NeedsRatingCard key={d.id} date={d} onRate={(rating) => rateDate(d.id, rating, d.is_user1)} />)}
        </>
      )}

      {/* Past */}
      {showPast && past.length > 0 && (
        <>
          <div className="flex items-center gap-2 mb-3 mt-4"><CheckCircle2 className="w-4 h-4 text-cream-500" /><h2 className="text-base font-bold text-sage-800">Past Dates</h2></div>
          {past.map((d) => <CompletedCard key={d.id} date={d} />)}
        </>
      )}

      <ConfirmModal open={confirmModal.open} title={confirmModal.title} message={confirmModal.message}
        confirmText={confirmModal.confirmText} confirmColor={confirmModal.confirmColor}
        onConfirm={confirmModal.onConfirm} onClose={() => setConfirmModal((p) => ({ ...p, open: false }))} />
    </div>
  );
}
