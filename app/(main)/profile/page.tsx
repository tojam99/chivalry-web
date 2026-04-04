'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/useProfile';
import { createClient } from '@/lib/supabase-browser';
import {
  MapPin, Briefcase, GraduationCap, Ruler, Heart, Coffee, Plus, LogOut, X,
  Camera, Trash2, ChevronRight, Loader2, Check, Zap, Navigation, Edit3,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';
function resolvePhoto(url: string | null): string {
  if (!url) return ''; return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
}

const HEIGHT_OPTIONS = ["4'10\"","4'11\"","5'0\"","5'1\"","5'2\"","5'3\"","5'4\"","5'5\"","5'6\"","5'7\"","5'8\"","5'9\"","5'10\"","5'11\"","6'0\"","6'1\"","6'2\"","6'3\"","6'4\"","6'5\"","6'6\"","6'7\"","6'8\""];
const BODY_OPTIONS = ['Slim', 'Average', 'Athletic', 'Curvy', 'Heavy'];
const ETHNICITY_OPTIONS = ['Asian', 'Black / African', 'Hispanic / Latino', 'Middle Eastern', 'Native American', 'Pacific Islander', 'White / Caucasian', 'Mixed', 'Other', 'Prefer not to say'];
const RELIGION_OPTIONS = ['Agnostic', 'Atheist', 'Buddhist', 'Catholic', 'Christian', 'Hindu', 'Jewish', 'Muslim', 'Sikh', 'Spiritual', 'Other', 'Prefer not to say'];
const DRINKING_OPTIONS = ['Never', 'Socially', 'Often'];
const SMOKING_OPTIONS = ['Never', 'Socially', 'Often'];
const WORKOUT_OPTIONS = ['Never', 'Sometimes', 'Often', 'Daily'];
const CHILDREN_OPTIONS = ["Don't want", 'Someday', 'Have & want more', "Have & don't want more"];
const LOOKING_FOR_OPTIONS = ['Relationship', 'Something casual', 'Not sure yet', 'New friends'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];
const SHOW_ME_OPTIONS = ['Everyone', 'Women', 'Men'];

function DropdownField({ label, value, options, onChange, icon }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void; icon?: React.ReactNode;
}) {
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
              className={`w-full text-left px-4 py-2.5 text-sm hover:bg-cream-100 transition-colors flex items-center justify-between ${value === opt ? 'text-sage-600 font-medium bg-sage-50' : 'text-sage-800'}`}>
              {opt}{value === opt && <Check className="w-4 h-4 text-sage-400" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Tap-to-edit text field (for profession, education)
function EditableTextField({ label, value, onChange, maxLength = 30, icon }: {
  label: string; value: string; onChange: (v: string) => void; maxLength?: number; icon?: React.ReactNode;
}) {
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

export default function ProfilePage() {
  const { profile, loading, updateField, addDateIdea, deleteDateIdea, toggleInterest, uploadPhoto, deletePhoto, signOut } = useProfile();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [allInterests, setAllInterests] = useState<string[]>([]);
  const [editingBio, setEditingBio] = useState(false);
  const [localBio, setLocalBio] = useState('');
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaLocation, setNewIdeaLocation] = useState('');
  const [showAddIdea, setShowAddIdea] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('interests').select('name').order('name').then(({ data }) => {
      setAllInterests((data || []).map((i) => i.name));
    });
  }, []);

  useEffect(() => { if (profile) setLocalBio(profile.bio || ''); }, [profile?.bio]);

  // Clean up incomplete date ideas on unmount
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
    if (!newIdeaTitle.trim()) return;
    if (!newIdeaLocation.trim()) {
      alert('Please add a location for your date idea.');
      return;
    }
    await addDateIdea(newIdeaTitle.trim(), newIdeaLocation.trim());
    setNewIdeaTitle(''); setNewIdeaLocation(''); setShowAddIdea(false);
  }

  async function handleGetLocation() {
    if (!navigator.geolocation) { alert('Geolocation not supported by your browser.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // Reverse geocode using a free API
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || '';
          const state = data.address?.state || '';
          const locationStr = city && state ? `${city}, ${state}` : city || state || 'Unknown location';
          
          await updateField('city', locationStr);
          await updateField('latitude', latitude);
          await updateField('longitude', longitude);
        } catch (err) {
          console.error('Geocoding error:', err);
          alert('Could not determine your location. Please try again.');
        }
        setLocating(false);
      },
      (err) => { console.error('Location error:', err); alert('Location access denied. Please enable location in your browser settings.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleSignOut() { await signOut(); router.push('/'); router.refresh(); }

  if (loading || !profile) {
    return (<div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" /><p className="text-cream-700">Loading profile...</p></div>);
  }

  return (
    <div className="pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-sage-800">Profile</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-cream-600">Available Now</span>
          <button onClick={() => updateField('available_now', !profile.available_now)}
            className={`w-10 h-6 rounded-full transition-colors relative ${profile.available_now ? 'bg-green-500' : 'bg-cream-300'}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform shadow-sm ${profile.available_now ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Photos */}
      <div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
        <div className="grid grid-cols-3 gap-2">
          {profile.photos.sort((a, b) => a.sort_order - b.sort_order).map((photo, idx) => (
            <div key={photo.id} className={`relative rounded-xl overflow-hidden group ${idx === 0 ? 'col-span-2 row-span-2 aspect-[3/4]' : 'aspect-square'}`}>
              <img src={resolvePhoto(photo.photo_url)} alt="" className="w-full h-full object-cover" />
              <button onClick={() => deletePhoto(photo.id)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5 text-white" /></button>
            </div>
          ))}
          {profile.photos.length < 6 && (
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="aspect-square bg-cream-200 rounded-xl flex flex-col items-center justify-center border-2 border-dashed border-cream-400 cursor-pointer hover:border-sage-400 hover:bg-cream-100 transition-colors">
              {uploading ? <Loader2 className="w-6 h-6 text-cream-600 animate-spin" /> : <><Camera className="w-6 h-6 text-cream-600" /><span className="text-[10px] text-cream-600 mt-1">Add Photo</span></>}
            </button>
          )}
        </div>
      </div>

      {/* Name & Location */}
      <div>
        <h2 className="font-display text-xl text-sage-800">{profile.name}, {profile.age}</h2>
        <div className="flex items-center gap-2 mt-1">
          <MapPin className="w-3.5 h-3.5 text-cream-600" />
          <span className="text-cream-700 text-sm">{profile.city || 'No location set'}</span>
          <button onClick={handleGetLocation} disabled={locating}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-sage-400 hover:text-sage-600 bg-cream-200 px-2.5 py-1 rounded-lg hover:bg-cream-300 transition-colors disabled:opacity-50">
            {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
            {locating ? 'Finding...' : 'Update Location'}
          </button>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">About me</label>
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

      {/* Basic Info — tap to edit profession/education, dropdowns for rest */}
      <div>
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">Basic info</label>
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
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">Lifestyle</label>
        <div className="space-y-1">
          <DropdownField label="Drinking" value={profile.drinking} options={DRINKING_OPTIONS} onChange={(v) => updateField('drinking', v)} />
          <DropdownField label="Smoking" value={profile.smoking} options={SMOKING_OPTIONS} onChange={(v) => updateField('smoking', v)} />
          <DropdownField label="Weed" value={profile.weed} options={DRINKING_OPTIONS} onChange={(v) => updateField('weed', v)} />
          <DropdownField label="Workout" value={profile.workout} options={WORKOUT_OPTIONS} onChange={(v) => updateField('workout', v)} />
          <DropdownField label="Children" value={profile.children} options={CHILDREN_OPTIONS} onChange={(v) => updateField('children', v)} />
        </div>
      </div>

      {/* Looking For */}
      <div>
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">Looking for</label>
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
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">Interests ({profile.interests.length}/10)</label>
        <div className="flex flex-wrap gap-1.5">
          {allInterests.map((interest) => {
            const selected = profile.interests.includes(interest);
            return (
              <button key={interest} onClick={() => toggleInterest(interest)}
                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${selected ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Ideas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-cream-600 uppercase tracking-wide">My date ideas</label>
          {profile.date_ideas.length < 3 && (
            <button onClick={() => setShowAddIdea(true)} className="text-xs font-medium text-sage-400 hover:text-sage-600 flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
          )}
        </div>
        <div className="space-y-2">
          {profile.date_ideas.map((idea) => (
            <div key={idea.id} className="flex items-center gap-3 bg-cream-100 rounded-xl p-3 group">
              <div className="w-9 h-9 bg-gold-400/20 rounded-lg flex items-center justify-center shrink-0"><Coffee className="w-4 h-4 text-gold-600" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-sage-800 truncate">{idea.title || '(No title)'}</p>
                {idea.location_name && <p className="text-xs text-cream-600 truncate">{idea.location_name}</p>}
                {!idea.location_name && <p className="text-xs text-red-400">Missing location — will be deleted</p>}
              </div>
              <button onClick={() => deleteDateIdea(idea.id)} className="text-cream-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
        {showAddIdea && (
          <div className="mt-2 bg-cream-100 rounded-xl p-3 space-y-2">
            <input value={newIdeaTitle} onChange={(e) => setNewIdeaTitle(e.target.value)} placeholder="Date idea title *" maxLength={50}
              className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
            <input value={newIdeaLocation} onChange={(e) => setNewIdeaLocation(e.target.value)} placeholder="Location *" maxLength={100}
              className="w-full bg-white border border-cream-300 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
            <p className="text-[10px] text-cream-500">Both title and location are required</p>
            <div className="flex gap-2">
              <button onClick={() => { setShowAddIdea(false); setNewIdeaTitle(''); setNewIdeaLocation(''); }} className="text-xs text-cream-600 px-3 py-1.5">Cancel</button>
              <button onClick={handleAddIdea} disabled={!newIdeaTitle.trim() || !newIdeaLocation.trim()}
                className="text-xs bg-sage-400 text-white px-3 py-1.5 rounded-lg disabled:opacity-40">Add</button>
            </div>
          </div>
        )}
      </div>

      {/* Discovery Settings */}
      <div>
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">Discovery settings</label>
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

      {/* Support & General */}
      <div className="border-t border-cream-200 pt-6 space-y-1">
        <a href="/support" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors">
          <span className="text-sm font-medium text-sage-800">Support</span><ChevronRight className="w-4 h-4 text-cream-500" />
        </a>
        <a href="/privacy" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors">
          <span className="text-sm font-medium text-sage-800">Privacy Policy</span><ChevronRight className="w-4 h-4 text-cream-500" />
        </a>
        <a href="/terms" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors">
          <span className="text-sm font-medium text-sage-800">Terms of Service</span><ChevronRight className="w-4 h-4 text-cream-500" />
        </a>
        <a href="/safety" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors">
          <span className="text-sm font-medium text-sage-800">Safety</span><ChevronRight className="w-4 h-4 text-cream-500" />
        </a>
        <a href="/delete" className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors">
          <span className="text-sm font-medium text-red-400">Delete Account</span><ChevronRight className="w-4 h-4 text-cream-500" />
        </a>
      </div>

      {/* Sign Out */}
      <div className="border-t border-cream-200 pt-4">
        <button onClick={handleSignOut} className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors">
          <span className="flex items-center gap-3 text-red-500 text-sm font-medium"><LogOut className="w-4 h-4" />Sign out</span>
          <ChevronRight className="w-4 h-4 text-cream-500" />
        </button>
      </div>
    </div>
  );
}
