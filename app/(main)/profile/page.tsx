'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/useProfile';
import { createClient } from '@/lib/supabase-browser';
import PlacePicker from '@/components/PlacePicker';
import {
  MapPin, Briefcase, GraduationCap, Ruler, Heart, Coffee, Plus, LogOut, X,
  Camera, Trash2, ChevronRight, ChevronLeft, Loader2, Check, Zap, Edit3, Eye,
  Info, Leaf, Sparkles, Search, ShieldCheck, Star, GripVertical,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';
function resolvePhoto(url: string | null): string { if (!url) return ''; return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`; }

const HEIGHT_OPTIONS = ["4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\"","6'3\"","6'4\"","6'5\"","6'6\"","6'7\"","6'8\""];
const BODY_OPTIONS = ['Slim', 'Average', 'Athletic', 'Curvy', 'Heavy'];
const ETHNICITY_OPTIONS = ['Asian', 'Black / African', 'Hispanic / Latino', 'Middle Eastern', 'Native American', 'Pacific Islander', 'White / Caucasian', 'Mixed', 'Other', 'Prefer not to say'];
const RELIGION_OPTIONS = ['Agnostic', 'Atheist', 'Buddhist', 'Catholic', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Sikh', 'Spiritual', 'Other', 'Prefer not to say'];
const DRINKING_OPTIONS = ['Never', 'Socially', 'Often'];
const WORKOUT_OPTIONS = ['Never', 'Sometimes', 'Often', 'Daily'];
const CHILDREN_OPTIONS = ["Don't want", 'Someday', 'Have & want more', "Have & don't want more"];
const LOOKING_FOR_OPTIONS = ['Relationship', 'Something casual', 'Not sure yet', 'New friends'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];
const SHOW_ME_OPTIONS = ['Everyone', 'Women', 'Men'];

function DropdownField({ label, value, options, onChange, icon }: { label: string; value: string; options: string[]; onChange: (v: string) => void; icon?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center gap-3 px-4 py-3 bg-cream-100 rounded-xl hover:bg-cream-200 transition-colors text-left">
        {icon && <span className="text-cream-600 shrink-0">{icon}</span>}
        <span className="flex-1 text-sm text-cream-600">{label}</span>
        <span className="text-sm font-medium text-sage-800">{value || 'Not set'}</span>
        <ChevronRight className={`w-4 h-4 text-cream-500 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-cream-300 rounded-xl shadow-lg z-20 max-h-60 overflow-y-auto">
          {options.map((opt) => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-cream-100 flex items-center justify-between ${value === opt ? 'text-sage-600 font-medium bg-sage-50' : 'text-sage-800'}`}>
              {opt}{value === opt && <Check className="w-4 h-4 text-sage-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function EditableTextField({ label, value, onChange, maxLength = 30, icon }: { label: string; value: string; onChange: (v: string) => void; maxLength?: number; icon?: React.ReactNode }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setLocal(value); }, [value]);
  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);
  return editing ? (
    <div className="flex items-center gap-2 px-4 py-2 bg-cream-100 rounded-xl">
      {icon && <span className="text-cream-600 shrink-0">{icon}</span>}
      <span className="text-sm text-cream-600 shrink-0">{label}</span>
      <input ref={inputRef} value={local} onChange={(e) => setLocal(e.target.value.slice(0, maxLength))}
        onBlur={() => { onChange(local.trim()); setEditing(false); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { onChange(local.trim()); setEditing(false); } }}
        className="flex-1 text-sm font-medium text-sage-800 bg-white border border-cream-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-sage-400/30 text-right" />
      <span className="text-[10px] text-cream-500">{local.length}/{maxLength}</span>
    </div>
  ) : (
    <button onClick={() => setEditing(true)} className="w-full flex items-center gap-3 px-4 py-3 bg-cream-100 rounded-xl hover:bg-cream-200 transition-colors text-left">
      {icon && <span className="text-cream-600 shrink-0">{icon}</span>}
      <span className="flex-1 text-sm text-cream-600">{label}</span>
      <span className="text-sm font-medium text-sage-800">{value || 'Tap to set'}</span>
      <Edit3 className="w-3.5 h-3.5 text-cream-500" />
    </button>
  );
}

// ── Profile Preview Modal ──
function ProfilePreview({ profile, photos, interests, dateIdeas, onClose }: {
  profile: any; photos: any[]; interests: string[]; dateIdeas: any[]; onClose: () => void;
}) {
  const [photoIdx, setPhotoIdx] = useState(0);
  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-6 px-4">
        <div className="bg-cream-50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
          <div className="flex items-center justify-between px-5 pt-5">
            <button onClick={onClose} className="text-cream-600 hover:text-sage-800"><X className="w-6 h-6" /></button>
            <span className="text-xs text-cream-600 font-medium">Profile Preview</span>
            <div className="w-6" />
          </div>
          <div className="relative aspect-[3/4] max-h-[420px] mx-5 mt-3 rounded-2xl overflow-hidden bg-cream-300">
            {photos[photoIdx] && (<img src={resolvePhoto(photos[photoIdx].photo_url)} alt="" className="absolute inset-0 w-full h-full object-cover" />)}
            {photos.length > 1 && (<div className="absolute top-3 left-0 right-0 flex justify-center gap-1.5 px-4">{photos.map((_: any, i: number) => (<div key={i} className={`h-1 rounded-full flex-1 max-w-12 ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />))}</div>)}
            {photoIdx > 0 && (<button onClick={() => setPhotoIdx(photoIdx-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"><ChevronLeft className="w-4 h-4" /></button>)}
            {photoIdx < photos.length-1 && (<button onClick={() => setPhotoIdx(photoIdx+1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"><ChevronRight className="w-4 h-4" /></button>)}
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-3 left-3 right-3">
              <div className="flex items-center gap-2"><h2 className="text-white font-bold text-2xl">{profile.name}, {profile.age}</h2>{profile.verified && <ShieldCheck className="w-5 h-5 text-green-400" />}</div>
              {(profile.profession || profile.education) && (
                <p className="text-white/80 text-sm mt-0.5">{[profile.profession, profile.education].filter(Boolean).join(' · ')}</p>
              )}
              {profile.city && <div className="flex items-center gap-1 text-white/70 text-sm mt-0.5"><MapPin className="w-3 h-3" />{profile.city}</div>}
            </div>
          </div>
          {profile.available_now && (<div className="mx-5 mt-3 bg-green-500 rounded-xl py-2 px-4 flex items-center justify-center gap-2"><Zap className="w-4 h-4 text-white" /><span className="text-white text-sm font-bold uppercase tracking-wide">Available Now!</span></div>)}
          <div className="px-5 pb-6 space-y-4 mt-4">
            {profile.bio && <p className="text-sage-800 text-[15px] leading-relaxed">{profile.bio}</p>}
            {dateIdeas.filter((d: any) => d.title?.trim()).length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2"><Heart className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Date Ideas</p></div>
                {dateIdeas.filter((d: any) => d.title?.trim()).map((idea: any) => (
                  <div key={idea.id} className="flex items-center gap-3 bg-sage-400 rounded-xl p-3 mb-2">
                    <div className="flex-1"><p className="text-sm font-bold text-white">{idea.title}</p>{idea.location_name && <p className="text-xs text-white/70">{idea.location_name}</p>}</div>
                  </div>
                ))}
              </div>
            )}
            {(profile.identification || profile.profession || profile.education || profile.height || profile.body_type || profile.ethnicity || profile.religion) && (
              <div>
                <div className="flex items-center gap-2 mb-2"><Info className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Basic info</p></div>
                <div className="bg-cream-100 rounded-xl divide-y divide-cream-200">
                  {[{l:'Identification',v:profile.identification},{l:'Profession',v:profile.profession},{l:'Education',v:profile.education},{l:'Height',v:profile.height},{l:'Body Type',v:profile.body_type},{l:'Ethnicity',v:profile.ethnicity},{l:'Religion',v:profile.religion}].filter(r=>r.v).map(r=>(
                    <div key={r.l} className="flex items-center justify-between px-4 py-2.5"><span className="text-sm text-cream-600">{r.l}</span><span className="text-sm font-medium text-sage-800">{r.v}</span></div>
                  ))}
                </div>
              </div>
            )}
            {(profile.drinking || profile.smoking || profile.workout || profile.children) && (
              <div>
                <div className="flex items-center gap-2 mb-2"><Leaf className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Lifestyle</p></div>
                <div className="bg-cream-100 rounded-xl divide-y divide-cream-200">
                  {[{l:'Drinking',v:profile.drinking},{l:'Smoking',v:profile.smoking},{l:'Workout',v:profile.workout},{l:'Children',v:profile.children}].filter(r=>r.v).map(r=>(
                    <div key={r.l} className="flex items-center justify-between px-4 py-2.5"><span className="text-sm text-cream-600">{r.l}</span><span className="text-sm font-medium text-sage-800">{r.v}</span></div>
                  ))}
                </div>
              </div>
            )}
            {interests.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2"><Sparkles className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Interests</p></div>
                <div className="flex flex-wrap gap-1.5">{interests.map((i,idx)=>(<span key={idx} className="bg-sage-100 text-sage-600 text-xs font-medium px-3 py-1.5 rounded-lg">{i}</span>))}</div>
              </div>
            )}
            {profile.looking_for && (
              <div>
                <div className="flex items-center gap-2 mb-2"><Search className="w-4 h-4 text-sage-400" /><p className="text-xs font-bold text-cream-600 uppercase tracking-wide">Looking for</p></div>
                <div className="inline-flex items-center gap-2 bg-sage-100 text-sage-600 text-sm font-medium px-4 py-2 rounded-xl"><Heart className="w-4 h-4" />{profile.looking_for}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { profile, setProfile, loading, updateField, addDateIdea, deleteDateIdea, toggleInterest, uploadPhoto, deletePhoto, signOut } = useProfile();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allInterests, setAllInterests] = useState<string[]>([]);
  const [editingBio, setEditingBio] = useState(false);
  const [localBio, setLocalBio] = useState('');
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaLocation, setNewIdeaLocation] = useState('');
  const [newIdeaLocationFull, setNewIdeaLocationFull] = useState('');
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showIdeaLocationPicker, setShowIdeaLocationPicker] = useState(false);

  // ── Photo drag & drop ──
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ idx: number; startY: number; startX: number } | null>(null);

  async function handleReorderPhotos(fromIdx: number, toIdx: number) {
    if (!profile || fromIdx === toIdx || toIdx < 0 || toIdx >= profile.photos.length) return;
    const sorted = [...profile.photos].sort((a, b) => a.sort_order - b.sort_order);
    const [moved] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, moved);
    // Re-index and update local state immediately
    const reindexed = sorted.map((p, i) => ({ ...p, sort_order: i }));
    setProfile((prev) => prev ? { ...prev, photos: reindexed } : prev);
    // Persist to DB
    const supabase = createClient();
    for (const p of reindexed) {
      await supabase.from('profile_photos').update({ sort_order: p.sort_order }).eq('id', p.id);
    }
  }

  function onDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (profile && idx < profile.photos.length) setDragOverIdx(idx);
  }
  function onDragEnd() {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      handleReorderPhotos(dragIdx, dragOverIdx);
    }
    setDragIdx(null);
    setDragOverIdx(null);
  }
  function onTouchStartPhoto(idx: number, e: React.TouchEvent) {
    const touch = e.touches[0];
    touchStartRef.current = { idx, startX: touch.clientX, startY: touch.clientY };
    const timer = setTimeout(() => setDragIdx(idx), 200);
    (e.currentTarget as any)._dragTimer = timer;
  }
  function onTouchMovePhoto(e: React.TouchEvent) {
    if (dragIdx === null || !gridRef.current) return;
    const touch = e.touches[0];
    const elements = gridRef.current.querySelectorAll('[data-photo-idx]');
    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right && touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const idx = parseInt(el.getAttribute('data-photo-idx') || '-1');
        if (profile && idx >= 0 && idx < profile.photos.length) setDragOverIdx(idx);
      }
    });
  }
  function onTouchEndPhoto(e: React.TouchEvent) {
    clearTimeout((e.currentTarget as any)._dragTimer);
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      handleReorderPhotos(dragIdx, dragOverIdx);
    }
    setDragIdx(null);
    setDragOverIdx(null);
    touchStartRef.current = null;
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.from('interests').select('name').order('name').then(({ data }) => setAllInterests((data || []).map((i) => i.name)));
  }, []);

  useEffect(() => { if (profile) setLocalBio(profile.bio || ''); }, [profile?.bio]);

  // Cleanup incomplete date ideas on unmount
  useEffect(() => {
    return () => {
      if (profile?.date_ideas) {
        const supabase = createClient();
        profile.date_ideas.forEach((idea) => {
          if (!idea.title?.trim() || !idea.location_name?.trim()) {
            supabase.from('date_ideas').delete().eq('id', idea.id).then(() => {});
          }
        });
      }
    };
  }, [profile?.date_ideas]);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); await uploadPhoto(file); setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleAddIdea() {
    if (!newIdeaTitle.trim() || !newIdeaLocationFull.trim()) return;
    const title = newIdeaTitle.trim();
    const capitalizedTitle = title.charAt(0).toUpperCase() + title.slice(1);
    await addDateIdea(capitalizedTitle, newIdeaLocationFull.trim());
    setNewIdeaTitle(''); setNewIdeaLocation(''); setNewIdeaLocationFull(''); setShowAddIdea(false);
  }

  async function handleSignOut() { await signOut(); router.push('/'); router.refresh(); }

  if (loading || !profile) {
    return (<div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" /><p className="text-cream-700">Loading profile...</p></div>);
  }

  return (
    <div className="pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-2xl text-sage-800">Profile</h1>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowPreview(true)} className="flex items-center gap-1 text-xs font-medium text-sage-400 hover:text-sage-600 bg-cream-200 px-2.5 py-1.5 rounded-lg hover:bg-cream-300">
            <Eye className="w-3.5 h-3.5" />Preview
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-cream-600">Available</span>
            <button onClick={() => updateField('available_now', !profile.available_now)}
              className={`w-10 h-6 rounded-full transition-colors relative ${profile.available_now ? 'bg-green-500' : 'bg-cream-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${profile.available_now ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Photos */}
      <div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        {(() => {
          const sorted = [...profile.photos].sort((a, b) => a.sort_order - b.sort_order);
          const isDragging = (i: number) => dragIdx === i;
          const isDragOver = (i: number) => dragOverIdx === i && dragIdx !== i;

          function photoCell(idx: number) {
            const photo = sorted[idx];
            if (photo) {
              return (
                <div
                  key={photo.id}
                  data-photo-idx={idx}
                  draggable
                  onDragStart={(e) => onDragStart(e, idx)}
                  onDragOver={(e) => onDragOver(e, idx)}
                  onDragEnd={onDragEnd}
                  onTouchStart={(e) => onTouchStartPhoto(idx, e)}
                  onTouchMove={onTouchMovePhoto}
                  onTouchEnd={onTouchEndPhoto}
                  className={`relative w-full h-full rounded-xl overflow-hidden bg-cream-300 group cursor-grab active:cursor-grabbing transition-all duration-150 ${
                    isDragging(idx) ? 'opacity-40 scale-95' : ''
                  } ${isDragOver(idx) ? 'ring-2 ring-sage-400 ring-offset-2 scale-[1.02]' : ''}`}
                >
                  <img src={resolvePhoto(photo.photo_url)} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
                  <div className="absolute top-2 left-2 w-6 h-6 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <GripVertical className="w-3 h-3 text-white" />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); deletePhoto(photo.id); }} className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><Trash2 className="w-3.5 h-3.5 text-white" /></button>
                  {idx === 0 && <div className="absolute bottom-2 left-2 bg-sage-400/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide z-10">Main</div>}
                </div>
              );
            } else if (idx === sorted.length && sorted.length < 6) {
              return (
                <button data-photo-idx={idx} onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="w-full h-full rounded-xl bg-cream-200 border-2 border-dashed border-cream-400 flex flex-col items-center justify-center hover:border-sage-400 hover:bg-cream-100 transition-colors">
                  {uploading ? <Loader2 className="w-6 h-6 text-cream-600 animate-spin" /> : <><Camera className="w-5 h-5 text-cream-500" /><span className="text-[10px] text-cream-500 mt-1">Add</span></>}
                </button>
              );
            }
            return <div data-photo-idx={idx} className="w-full h-full rounded-xl bg-cream-100 border border-cream-200" />;
          }
          return (
            <div ref={gridRef} className="space-y-2">
              {/* Top row: main photo (2/3) + 2 stacked (1/3) */}
              <div className="flex gap-2" style={{ height: '260px' }}>
                <div className="flex-[2] min-w-0 relative overflow-hidden rounded-xl">
                  {photoCell(0)}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-2">
                  <div className="flex-1 min-h-0 relative overflow-hidden rounded-xl">
                    {photoCell(1)}
                  </div>
                  <div className="flex-1 min-h-0 relative overflow-hidden rounded-xl">
                    {photoCell(2)}
                  </div>
                </div>
              </div>
              {/* Bottom row: 3 equal squares */}
              <div className="grid grid-cols-3 gap-2">
                {[3, 4, 5].map((i) => (
                  <div key={`slot-${i}`} className="relative aspect-square overflow-hidden rounded-xl">
                    {photoCell(i)}
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Name & Location with Google Places picker */}
      <div>
        <h2 className="font-bold text-xl text-sage-800">{profile.name}, {profile.age}</h2>
        <button onClick={() => setShowCityPicker(true)} className="flex items-center gap-2 mt-1 hover:bg-cream-100 rounded-lg px-2 py-1 -mx-2 transition-colors">
          <MapPin className="w-3.5 h-3.5 text-sage-400" />
          <span className="text-cream-700 text-sm">{profile.city || 'Tap to set location'}</span>
          <Edit3 className="w-3 h-3 text-cream-500" />
        </button>
      </div>

      {/* Bio */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">About me</label>
        {editingBio ? (
          <div>
            <textarea value={localBio} onChange={(e) => setLocalBio(e.target.value)} rows={3} maxLength={500}
              className="w-full bg-cream-100 border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 resize-none" />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-cream-500">{localBio.length}/500</span>
              <div className="flex gap-2">
                <button onClick={() => setEditingBio(false)} className="text-xs text-cream-600 px-3 py-1.5">Cancel</button>
                <button onClick={() => { updateField('bio', localBio); setEditingBio(false); }} className="text-xs bg-sage-400 text-white px-3 py-1.5 rounded-lg">Save</button>
              </div>
            </div>
          </div>
        ) : (
          <p onClick={() => setEditingBio(true)} className="text-sage-800 text-[15px] leading-relaxed cursor-pointer hover:bg-cream-100 rounded-xl px-3 py-2 -mx-3 transition-colors">
            {profile.bio || 'Tap to add a bio...'}
          </p>
        )}
      </div>

      {/* Basic Info */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Basic info</label>
        <div className="space-y-1">
          <DropdownField label="Identification" value={profile.identification} options={GENDER_OPTIONS} onChange={(v) => updateField('identification', v)} />
          <EditableTextField label="Profession" value={profile.profession} onChange={(v) => updateField('profession', v)} maxLength={20} icon={<Briefcase className="w-4 h-4" />} />
          <EditableTextField label="Education" value={profile.education} onChange={(v) => updateField('education', v)} maxLength={20} icon={<GraduationCap className="w-4 h-4" />} />
          <DropdownField label="Height" value={profile.height} options={HEIGHT_OPTIONS} onChange={(v) => updateField('height', v)} icon={<Ruler className="w-4 h-4" />} />
          <DropdownField label="Body Type" value={profile.body_type} options={BODY_OPTIONS} onChange={(v) => updateField('body_type', v)} />
          <DropdownField label="Ethnicity" value={profile.ethnicity} options={ETHNICITY_OPTIONS} onChange={(v) => updateField('ethnicity', v)} />
          <DropdownField label="Religion" value={profile.religion} options={RELIGION_OPTIONS} onChange={(v) => updateField('religion', v)} />
        </div>
      </div>

      {/* Lifestyle */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Lifestyle</label>
        <div className="space-y-1">
          <DropdownField label="Drinking" value={profile.drinking} options={DRINKING_OPTIONS} onChange={(v) => updateField('drinking', v)} />
          <DropdownField label="Smoking" value={profile.smoking} options={DRINKING_OPTIONS} onChange={(v) => updateField('smoking', v)} />
          <DropdownField label="Weed" value={profile.weed} options={DRINKING_OPTIONS} onChange={(v) => updateField('weed', v)} />
          <DropdownField label="Workout" value={profile.workout} options={WORKOUT_OPTIONS} onChange={(v) => updateField('workout', v)} />
          <DropdownField label="Children" value={profile.children} options={CHILDREN_OPTIONS} onChange={(v) => updateField('children', v)} />
        </div>
      </div>

      {/* Looking For */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Looking for</label>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR_OPTIONS.map((opt) => (
            <button key={opt} onClick={() => updateField('looking_for', opt)}
              className={`text-sm px-4 py-2 rounded-xl transition-colors ${profile.looking_for === opt ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Interests */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Interests ({profile.interests.length}/10)</label>
        <div className="flex flex-wrap gap-1.5">
          {allInterests.map((interest) => (
            <button key={interest} onClick={() => toggleInterest(interest)}
              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${profile.interests.includes(interest) ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>
              {interest}
            </button>
          ))}
        </div>
      </div>

      {/* Date Ideas with Google Places picker */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-cream-600 uppercase tracking-wide">My date ideas</label>
          {profile.date_ideas.length < 3 && !showAddIdea && (
            <button onClick={() => setShowAddIdea(true)} className="text-xs font-medium text-sage-400 hover:text-sage-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
          )}
        </div>
        <div className="space-y-2">
          {profile.date_ideas.map((idea) => (
            <div key={idea.id} className="flex items-center gap-3 bg-cream-100 rounded-xl p-3 group">
              <div className="w-9 h-9 bg-gold-400/20 rounded-lg flex items-center justify-center shrink-0"><Coffee className="w-4 h-4 text-gold-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sage-800 truncate">{idea.title || '(No title)'}</p>
                {idea.location_name ? <p className="text-xs text-cream-600 truncate">{idea.location_name}</p> : <p className="text-xs text-red-400">Missing location</p>}
              </div>
              <button onClick={() => deleteDateIdea(idea.id)} className="text-cream-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        {showAddIdea && (
          <div className="mt-2 bg-cream-100 rounded-xl p-3 space-y-2">
            <input value={newIdeaTitle} onChange={(e) => setNewIdeaTitle(e.target.value)} placeholder="Date idea title *" maxLength={50}
              className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
            <button onClick={() => setShowIdeaLocationPicker(true)}
              className="w-full flex items-center gap-2 bg-white border border-cream-300 rounded-lg px-3 py-2 text-left hover:bg-cream-50 transition-colors">
              <MapPin className="w-4 h-4 text-cream-500" />
              <span className={`text-sm flex-1 ${newIdeaLocationFull ? 'text-sage-800' : 'text-cream-500'}`}>
                {newIdeaLocationFull || 'Search for a location *'}
              </span>
            </button>
            <p className="text-[10px] text-cream-500">Both title and location are required</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowAddIdea(false); setNewIdeaTitle(''); setNewIdeaLocation(''); setNewIdeaLocationFull(''); }} className="text-xs text-cream-600 px-3 py-1.5">Cancel</button>
              <button onClick={handleAddIdea} disabled={!newIdeaTitle.trim() || !newIdeaLocationFull.trim()}
                className="text-xs bg-sage-400 text-white px-3 py-1.5 rounded-lg disabled:opacity-40">Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Discovery Settings */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Discovery settings</label>
        <div className="space-y-1">
          <DropdownField label="Show me" value={profile.show_me} options={SHOW_ME_OPTIONS} onChange={(v) => updateField('show_me', v)} />
          <div className="px-4 py-3 bg-cream-100 rounded-xl">
            <div className="flex justify-between text-sm mb-2"><span className="text-cream-600">Age range</span><span className="font-medium text-sage-800">{profile.age_min} - {profile.age_max}</span></div>
            <div className="flex gap-3 items-center">
              <input type="range" min={18} max={65} value={profile.age_min} onChange={(e) => updateField('age_min', parseInt(e.target.value))} className="flex-1 accent-sage-400" />
              <input type="range" min={18} max={65} value={profile.age_max} onChange={(e) => updateField('age_max', parseInt(e.target.value))} className="flex-1 accent-sage-400" />
            </div>
          </div>
          <div className="px-4 py-3 bg-cream-100 rounded-xl">
            <div className="flex justify-between text-sm mb-2"><span className="text-cream-600">Max distance</span><span className="font-medium text-sage-800">{profile.max_distance} mi</span></div>
            <input type="range" min={1} max={100} value={profile.max_distance} onChange={(e) => updateField('max_distance', parseInt(e.target.value))} className="w-full accent-sage-400" />
          </div>
        </div>
      </div>

      {/* Support links */}
      <div className="border-t border-cream-200 pt-6 space-y-1">
        {[{href:'/support',label:'Support'},{href:'/privacy',label:'Privacy Policy'},{href:'/terms',label:'Terms of Service'},{href:'/safety',label:'Safety'}].map((link)=>(
          <a key={link.href} href={link.href} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors"><span className="text-sm font-medium text-sage-800">{link.label}</span><ChevronRight className="w-4 h-4 text-cream-500" /></a>
        ))}
        <a href="/delete" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors"><span className="text-sm font-medium text-red-400">Delete Account</span><ChevronRight className="w-4 h-4 text-cream-500" /></a>
      </div>

      {/* Sign Out */}
      <div className="border-t border-cream-200 pt-4">
        <button onClick={handleSignOut} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors">
          <span className="flex items-center gap-3 text-red-500 text-sm font-medium"><LogOut className="w-4 h-4" />Sign out</span>
          <ChevronRight className="w-4 h-4 text-cream-500" />
        </button>
      </div>

      {/* City Picker */}
      <PlacePicker open={showCityPicker} onClose={() => setShowCityPicker(false)} title="Search City"
        placeholder="Search for your city..." cityOnly={true}
        onSelect={(place) => { updateField('city', place.name + (place.address.includes(',') ? ', ' + place.address.split(',').slice(-2, -1)[0].trim() : '')); updateField('latitude', place.lat); updateField('longitude', place.lng); }} />

      {/* Date Idea Location Picker */}
      <PlacePicker open={showIdeaLocationPicker} onClose={() => setShowIdeaLocationPicker(false)} title="Search Location"
        placeholder="Search for a venue..."
        onSelect={(place) => { setNewIdeaLocation(place.name); setNewIdeaLocationFull(`${place.name} · ${place.address}`); }} />

      {/* Profile Preview */}
      {showPreview && <ProfilePreview profile={profile} photos={profile.photos} interests={profile.interests} dateIdeas={profile.date_ideas} onClose={() => setShowPreview(false)} />}
    </div>
  );
}
