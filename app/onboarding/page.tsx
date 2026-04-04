'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import PlacePicker from '@/components/PlacePicker';
import {
  ChevronRight, ChevronLeft, Camera, Loader2, MapPin, Check, X, Trash2,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';
const TOTAL_STEPS = 5;
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];
const LOOKING_FOR_OPTIONS = ['Relationship', 'Something casual', 'Not sure yet', 'New friends'];

export default function OnboardingPage() {
  const supabase = createClient();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Step 1 — Name, Birthday, Gender
  const [name, setName] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [gender, setGender] = useState('');

  // Step 2 — Photos
  const [photos, setPhotos] = useState<{ id: string; photo_url: string; sort_order: number }[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 3 — City, Profession, Education
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [profession, setProfession] = useState('');
  const [education, setEducation] = useState('');
  const [showCityPicker, setShowCityPicker] = useState(false);

  // Step 4 — Bio, Looking For
  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState('');

  // Step 5 — Interests
  const [allInterests, setAllInterests] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  // Load profile data and interests
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      const { data: profile } = await supabase.from('profiles').select('*').eq('auth_id', user.id).single();
      if (!profile) { router.push('/auth/login'); return; }
      if (profile.onboarded) { router.push('/discover'); return; }

      setProfileId(profile.id);
      if (profile.name) setName(profile.name);
      if (profile.city) setCity(profile.city);

      // Pre-fill from Google/Apple sign-in metadata
      const meta = user.user_metadata;
      if (meta?.full_name && !profile.name) setName(meta.full_name);
      if (meta?.name && !profile.name) setName(meta.name);

      // Fetch interests
      const { data: interests } = await supabase.from('interests').select('name').order('name');
      setAllInterests((interests || []).map((i) => i.name));

      // Fetch existing photos
      const { data: existingPhotos } = await supabase.from('profile_photos').select('id, photo_url, sort_order').eq('profile_id', profile.id).order('sort_order');
      setPhotos(existingPhotos || []);
    })();
  }, []);

  function calculateAge(): number | null {
    const m = parseInt(birthMonth); const d = parseInt(birthDay); const y = parseInt(birthYear);
    if (!m || !d || !y) return null;
    const today = new Date(); const birth = new Date(y, m - 1, d);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function isStepValid(): boolean {
    switch (step) {
      case 1: {
        const age = calculateAge();
        return name.trim().length >= 2 && age !== null && age >= 18 && age <= 100 && !!gender;
      }
      case 2: return photos.length >= 1;
      case 3: return city.trim().length >= 2;
      case 4: return bio.trim().length >= 10 && !!lookingFor;
      case 5: return selectedInterests.length >= 3;
      default: return false;
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file || !profileId) return;
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const fileName = `${user.id}/${Date.now()}.jpg`;
      await supabase.storage.from('profile-photos').upload(fileName, file, { contentType: file.type });
      const { data: urlData } = supabase.storage.from('profile-photos').getPublicUrl(fileName);
      const { data: photoRow } = await supabase.from('profile_photos')
        .insert({ profile_id: profileId, photo_url: urlData.publicUrl, sort_order: photos.length })
        .select().single();
      if (photoRow) setPhotos((prev) => [...prev, photoRow]);
    } catch (err) { console.error('Upload error:', err); }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleDeletePhoto(photoId: string) {
    await supabase.from('profile_photos').delete().eq('id', photoId);
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  }

  async function handleFinish() {
    if (!profileId || saving) return;
    setSaving(true);
    try {
      const age = calculateAge();
      // Update profile
      await supabase.from('profiles').update({
        name: name.trim(), age, identification: gender, city, latitude, longitude,
        profession: profession.trim(), education: education.trim(),
        bio: bio.trim(), looking_for: lookingFor, onboarded: true,
        updated_at: new Date().toISOString(),
      }).eq('id', profileId);

      // Save interests
      for (const interestName of selectedInterests) {
        const { data: row } = await supabase.from('interests').select('id').eq('name', interestName).single();
        if (row) {
          await supabase.from('profile_interests').upsert(
            { profile_id: profileId, interest_id: row.id },
            { onConflict: 'profile_id,interest_id' }
          );
        }
      }

      router.push('/discover');
    } catch (err) { console.error('Finish error:', err); setSaving(false); }
  }

  function resolvePhoto(url: string): string { return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`; }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i < step ? 'bg-sage-400' : 'bg-cream-300'}`} />
          ))}
        </div>
        <p className="text-xs text-cream-600 mt-2">Step {step} of {TOTAL_STEPS}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6">
        {/* Step 1: Name, Birthday, Gender */}
        {step === 1 && (
          <div className="space-y-6">
            <div><h2 className="font-display text-2xl text-sage-800">Let&apos;s get to know you</h2><p className="text-cream-600 text-sm mt-1">This info will be shown on your profile</p></div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">First name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={15} placeholder="Your first name"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Birthday</label>
              <div className="flex gap-2">
                <input value={birthMonth} onChange={(e) => setBirthMonth(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="MM" className="w-20 bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 text-center focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
                <input value={birthDay} onChange={(e) => setBirthDay(e.target.value.replace(/\D/g, '').slice(0, 2))} placeholder="DD" className="w-20 bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 text-center focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
                <input value={birthYear} onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))} placeholder="YYYY" className="flex-1 bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 text-center focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
              </div>
              {calculateAge() !== null && calculateAge()! < 18 && <p className="text-red-400 text-xs mt-1">Must be 18 or older</p>}
              {calculateAge() !== null && calculateAge()! >= 18 && <p className="text-sage-400 text-xs mt-1">Age: {calculateAge()}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">I identify as</label>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button key={g} onClick={() => setGender(g)} className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-colors ${gender === g ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>{g}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-6">
            <div><h2 className="font-display text-2xl text-sage-800">Add your best photos</h2><p className="text-cream-600 text-sm mt-1">At least 1 photo required, up to 6</p></div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <div key={photo.id} className={`relative rounded-xl overflow-hidden group ${idx === 0 ? 'col-span-2 row-span-2' : ''}`} style={{ aspectRatio: idx === 0 ? '3/4' : '1/1' }}>
                  <img src={resolvePhoto(photo.photo_url)} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => handleDeletePhoto(photo.id)} className="absolute top-2 right-2 w-7 h-7 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-3.5 h-3.5 text-white" /></button>
                </div>
              ))}
              {photos.length < 6 && (
                <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="rounded-xl bg-cream-200 border-2 border-dashed border-cream-400 flex flex-col items-center justify-center hover:border-sage-400 transition-colors" style={{ aspectRatio: photos.length === 0 ? '3/4' : '1/1' }}>
                  {uploading ? <Loader2 className="w-6 h-6 text-cream-600 animate-spin" /> : <><Camera className="w-6 h-6 text-cream-600" /><span className="text-[10px] text-cream-600 mt-1">Add Photo</span></>}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step 3: City, Profession, Education */}
        {step === 3 && (
          <div className="space-y-6">
            <div><h2 className="font-display text-2xl text-sage-800">A bit more about you</h2><p className="text-cream-600 text-sm mt-1">Help us find dates near you</p></div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Your city *</label>
              <button onClick={() => setShowCityPicker(true)} className="w-full flex items-center gap-2 bg-white border border-cream-300 rounded-xl px-4 py-3 text-left hover:bg-cream-50">
                <MapPin className="w-4 h-4 text-cream-500" />
                <span className={`text-sm flex-1 ${city ? 'text-sage-800' : 'text-cream-500'}`}>{city || 'Search for your city'}</span>
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Profession (optional)</label>
              <input value={profession} onChange={(e) => setProfession(e.target.value)} maxLength={20} placeholder="What do you do?"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Education (optional)</label>
              <input value={education} onChange={(e) => setEducation(e.target.value)} maxLength={20} placeholder="Where did you study?"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
            </div>
            <PlacePicker open={showCityPicker} onClose={() => setShowCityPicker(false)} title="Search City" placeholder="Search for your city..." cityOnly={true}
              onSelect={(place) => { setCity(`${place.name}${place.address.includes(',') ? ', ' + place.address.split(',').slice(-2, -1)[0].trim() : ''}`); setLatitude(place.lat); setLongitude(place.lng); }} />
          </div>
        )}

        {/* Step 4: Bio, Looking For */}
        {step === 4 && (
          <div className="space-y-6">
            <div><h2 className="font-display text-2xl text-sage-800">Tell us about yourself</h2><p className="text-cream-600 text-sm mt-1">Write a short bio and what you&apos;re looking for</p></div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Bio (min 10 characters)</label>
              <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} maxLength={500} placeholder="Tell people about yourself, your interests, what makes you unique..."
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 resize-none" />
              <p className="text-[10px] text-cream-500 mt-1">{bio.length}/500</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">What are you looking for?</label>
              <div className="space-y-2">
                {LOOKING_FOR_OPTIONS.map((opt) => (
                  <button key={opt} onClick={() => setLookingFor(opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${lookingFor === opt ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>
                    {opt}{lookingFor === opt && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Interests */}
        {step === 5 && (
          <div className="space-y-6">
            <div><h2 className="font-display text-2xl text-sage-800">Pick your interests</h2><p className="text-cream-600 text-sm mt-1">Choose at least 3 (max 10)</p></div>
            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const selected = selectedInterests.includes(interest);
                return (
                  <button key={interest} onClick={() => {
                    if (selected) setSelectedInterests((prev) => prev.filter((i) => i !== interest));
                    else if (selectedInterests.length < 10) setSelectedInterests((prev) => [...prev, interest]);
                  }}
                    className={`text-sm font-medium px-4 py-2 rounded-xl transition-colors ${selected ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-700 hover:bg-cream-300'}`}>
                    {interest}
                  </button>
                );
              })}
            </div>
            <p className="text-sm text-cream-600">{selectedInterests.length}/10 selected</p>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-8 flex gap-3">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="px-6 py-3 rounded-2xl bg-cream-200 text-cream-700 font-medium flex items-center gap-1 hover:bg-cream-300 transition-colors">
            <ChevronLeft className="w-4 h-4" />Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button onClick={() => setStep(step + 1)} disabled={!isStepValid()}
            className="flex-1 py-3 rounded-2xl bg-sage-400 text-white font-bold text-base flex items-center justify-center gap-1 hover:bg-sage-500 transition-colors disabled:opacity-40 disabled:hover:bg-sage-400">
            Continue<ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={handleFinish} disabled={!isStepValid() || saving}
            className="flex-1 py-3 rounded-2xl bg-sage-400 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-sage-500 transition-colors disabled:opacity-40">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            {saving ? 'Setting up...' : 'Start Dating!'}
          </button>
        )}
      </div>
    </div>
  );
}
