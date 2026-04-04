'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import PlacePicker from '@/components/PlacePicker';
import {
  ChevronRight, ChevronLeft, Camera, Loader2, MapPin, Check, X, Trash2,
  Heart, Sparkles, Shield,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';
const TOTAL_STEPS = 5;
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Other'];
const LOOKING_FOR_OPTIONS = ['Relationship', 'Something casual', 'Not sure yet', 'New friends'];
const MAX_INTERESTS = 10;
const MIN_INTERESTS = 3;

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
  const dayRef = useRef<HTMLInputElement>(null);
  const yearRef = useRef<HTMLInputElement>(null);

  // Age confirmation modal
  const [showAgeConfirm, setShowAgeConfirm] = useState(false);
  const [confirmAge, setConfirmAge] = useState<number | null>(null);

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
  const [allInterests, setAllInterests] = useState<{ id: string; name: string }[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [maxWarning, setMaxWarning] = useState(false);

  // Building profile modal
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [buildingStep, setBuildingStep] = useState(0);
  const buildingMessages = [
    { icon: Camera, text: 'Setting up your photos...' },
    { icon: Heart, text: 'Saving your preferences...' },
    { icon: Sparkles, text: 'Building your profile...' },
    { icon: Shield, text: 'Almost ready...' },
  ];

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

      // Fetch interests (with IDs for proper saving)
      const { data: interests } = await supabase.from('interests').select('id, name').order('name');
      setAllInterests(interests || []);

      // Fetch existing photos
      const { data: existingPhotos } = await supabase.from('profile_photos').select('id, photo_url, sort_order').eq('profile_id', profile.id).order('sort_order');
      setPhotos(existingPhotos || []);
    })();
  }, []);

  function calculateAge(): number | null {
    const m = parseInt(birthMonth); const d = parseInt(birthDay); const y = parseInt(birthYear);
    if (!m || !d || !y || birthYear.length < 4) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    if (y < 1900 || y > new Date().getFullYear()) return null;
    const today = new Date(); const birth = new Date(y, m - 1, d);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  }

  // Birthday auto-advance handlers
  function handleMonthChange(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setBirthMonth(clean);
    // Auto-advance: if 2 digits entered and valid month (01-12), jump to day
    if (clean.length === 2) {
      const m = parseInt(clean);
      if (m >= 1 && m <= 12) {
        dayRef.current?.focus();
      }
    }
    // Also auto-advance if single digit that can't have a second digit (2-9 → must be 02-09)
    if (clean.length === 1 && parseInt(clean) >= 2) {
      setBirthMonth('0' + clean);
      dayRef.current?.focus();
    }
  }

  function handleDayChange(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 2);
    setBirthDay(clean);
    // Auto-advance: if 2 digits entered and valid day (01-31), jump to year
    if (clean.length === 2) {
      const d = parseInt(clean);
      if (d >= 1 && d <= 31) {
        yearRef.current?.focus();
      }
    }
    // Auto-advance if single digit 4-9 → must be 04-09
    if (clean.length === 1 && parseInt(clean) >= 4) {
      setBirthDay('0' + clean);
      yearRef.current?.focus();
    }
  }

  function handleYearChange(val: string) {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    setBirthYear(clean);
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
      case 5: return selectedInterests.length >= MIN_INTERESTS;
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

  function handleContinue() {
    if (!isStepValid()) return;

    // Step 1: Show age confirmation modal
    if (step === 1) {
      const age = calculateAge();
      if (!age || age < 18) return;
      setConfirmAge(age);
      setShowAgeConfirm(true);
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(step + 1);
    }
  }

  async function handleFinish() {
    if (!profileId || saving) return;
    setSaving(true);
    setShowBuildingModal(true);
    setBuildingStep(0);

    // Animate through building steps
    const stepInterval = setInterval(() => {
      setBuildingStep((prev) => {
        if (prev < buildingMessages.length - 1) return prev + 1;
        return prev;
      });
    }, 800);

    try {
      const age = calculateAge();
      // Update profile
      await supabase.from('profiles').update({
        name: name.trim(), age, identification: gender, city, latitude, longitude,
        profession: profession.trim() || null, education: education.trim() || null,
        bio: bio.trim(), looking_for: lookingFor, onboarded: true,
        updated_at: new Date().toISOString(),
      }).eq('id', profileId);

      // Save interests — use the interest IDs we fetched
      for (const interestName of selectedInterests) {
        const interest = allInterests.find((i) => i.name === interestName);
        if (interest) {
          await supabase.from('profile_interests').upsert(
            { profile_id: profileId, interest_id: interest.id },
            { onConflict: 'profile_id,interest_id' }
          );
        }
      }

      // Wait a beat so the animation feels complete
      await new Promise((r) => setTimeout(r, 1200));
      clearInterval(stepInterval);
      router.push('/discover');
    } catch (err) {
      console.error('Finish error:', err);
      clearInterval(stepInterval);
      setShowBuildingModal(false);
      setSaving(false);
    }
  }

  function toggleInterest(interest: string) {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests((prev) => prev.filter((i) => i !== interest));
      setMaxWarning(false);
    } else if (selectedInterests.length < MAX_INTERESTS) {
      setSelectedInterests((prev) => [...prev, interest]);
      setMaxWarning(false);
    } else {
      // Flash max warning
      setMaxWarning(true);
      setTimeout(() => setMaxWarning(false), 2000);
    }
  }

  function resolvePhoto(url: string): string { return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`; }

  // Photo grid: first photo is large 2x2, rest are 1x1 squares
  function renderPhotoGrid() {
    const slots = [];

    for (let i = 0; i < 6; i++) {
      const photo = photos[i];
      const isFirst = i === 0;

      if (photo) {
        slots.push(
          <div
            key={photo.id}
            className={`relative rounded-2xl overflow-hidden bg-cream-300 group ${isFirst ? 'col-span-2 row-span-2' : ''}`}
          >
            <div className={`w-full ${isFirst ? 'aspect-[3/4]' : 'aspect-square'}`}>
              <img src={resolvePhoto(photo.photo_url)} alt="" className="w-full h-full object-cover" />
            </div>
            <button
              onClick={() => handleDeletePhoto(photo.id)}
              className="absolute top-2 right-2 w-7 h-7 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </button>
            {isFirst && (
              <div className="absolute bottom-2 left-2 bg-sage-400/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                Main
              </div>
            )}
          </div>
        );
      } else if (i === photos.length) {
        // Add button — only show in the next empty slot
        slots.push(
          <button
            key={`add-${i}`}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`rounded-2xl bg-cream-200 border-2 border-dashed border-cream-400 flex flex-col items-center justify-center hover:border-sage-400 hover:bg-cream-100 transition-colors ${isFirst ? 'col-span-2 row-span-2' : ''}`}
          >
            <div className={`w-full flex flex-col items-center justify-center ${isFirst ? 'aspect-[3/4]' : 'aspect-square'}`}>
              {uploading ? (
                <Loader2 className="w-6 h-6 text-cream-600 animate-spin" />
              ) : (
                <>
                  <Camera className={`text-cream-500 ${isFirst ? 'w-8 h-8' : 'w-5 h-5'}`} />
                  <span className={`text-cream-500 mt-1.5 font-medium ${isFirst ? 'text-xs' : 'text-[10px]'}`}>Add Photo</span>
                </>
              )}
            </div>
          </button>
        );
      } else {
        // Empty placeholder
        slots.push(
          <div key={`empty-${i}`} className="rounded-2xl bg-cream-100 border border-cream-200">
            <div className="w-full aspect-square" />
          </div>
        );
      }
    }

    return (
      <div className="grid grid-cols-3 gap-2.5 auto-rows-min">
        {slots}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 flex flex-col">
      {/* Progress bar */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex gap-1.5">
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < step ? 'bg-sage-400' : 'bg-cream-300'}`} />
          ))}
        </div>
        <p className="text-xs text-cream-600 mt-2">Step {step} of {TOTAL_STEPS}</p>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        {/* Step 1: Name, Birthday, Gender */}
        {step === 1 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-display text-2xl text-sage-800">Let&apos;s get to know you</h2>
              <p className="text-cream-600 text-sm mt-1">This info will be shown on your profile</p>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">First name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value.replace(/[^a-zA-Z\s'-]/g, ''))}
                maxLength={15}
                placeholder="Your first name"
                autoCapitalize="words"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
              />
              <p className="text-[10px] text-cream-500 mt-1 text-right">{name.length}/15</p>
            </div>

            {/* Birthday with auto-advance */}
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Birthday</label>
              <div className="flex gap-2">
                <input
                  value={birthMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  placeholder="MM"
                  inputMode="numeric"
                  maxLength={2}
                  className="w-20 bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 text-center focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
                />
                <input
                  ref={dayRef}
                  value={birthDay}
                  onChange={(e) => handleDayChange(e.target.value)}
                  placeholder="DD"
                  inputMode="numeric"
                  maxLength={2}
                  className="w-20 bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 text-center focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
                />
                <input
                  ref={yearRef}
                  value={birthYear}
                  onChange={(e) => handleYearChange(e.target.value)}
                  placeholder="YYYY"
                  inputMode="numeric"
                  maxLength={4}
                  className="flex-1 bg-white border border-cream-300 rounded-xl px-4 py-3 text-sage-800 text-center focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
                />
              </div>
              {calculateAge() !== null && calculateAge()! < 18 && (
                <p className="text-red-400 text-xs mt-1.5 font-medium">Must be 18 or older to use Chivalry</p>
              )}
              {calculateAge() !== null && calculateAge()! >= 18 && (
                <p className="text-sage-400 text-xs mt-1.5">Age: {calculateAge()}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">I identify as</label>
              <div className="flex flex-wrap gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGender(g)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      gender === g
                        ? 'bg-sage-400 text-white shadow-sm'
                        : 'bg-cream-200 text-cream-700 hover:bg-cream-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Photos */}
        {step === 2 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-display text-2xl text-sage-800">Add your best photos</h2>
              <p className="text-cream-600 text-sm mt-1">At least 1 photo required, up to 6</p>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            {renderPhotoGrid()}
            <p className="text-xs text-cream-500 text-center">{photos.length}/6 photos &middot; First photo is your main profile picture</p>
          </div>
        )}

        {/* Step 3: City, Profession, Education */}
        {step === 3 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-display text-2xl text-sage-800">A bit more about you</h2>
              <p className="text-cream-600 text-sm mt-1">Help us find dates near you</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Your city *</label>
              <button
                onClick={() => setShowCityPicker(true)}
                className="w-full flex items-center gap-2 bg-white border border-cream-300 rounded-xl px-4 py-3 text-left hover:bg-cream-50 transition-colors"
              >
                <MapPin className="w-4 h-4 text-cream-500 shrink-0" />
                <span className={`text-sm flex-1 ${city ? 'text-sage-800' : 'text-cream-500'}`}>{city || 'Search for your city'}</span>
                {city && (
                  <button onClick={(e) => { e.stopPropagation(); setCity(''); setLatitude(null); setLongitude(null); }} className="text-cream-500 hover:text-red-400">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Profession <span className="text-cream-500 font-normal">(optional)</span></label>
              <input
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                maxLength={25}
                placeholder="What do you do?"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
              />
              <p className="text-[10px] text-cream-500 mt-1 text-right">{profession.length}/25</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Education <span className="text-cream-500 font-normal">(optional)</span></label>
              <input
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                maxLength={25}
                placeholder="Where did you study?"
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400"
              />
              <p className="text-[10px] text-cream-500 mt-1 text-right">{education.length}/25</p>
            </div>
            <PlacePicker
              open={showCityPicker}
              onClose={() => setShowCityPicker(false)}
              title="Search City"
              placeholder="Search for your city..."
              cityOnly={true}
              onSelect={(place) => {
                setCity(`${place.name}${place.address.includes(',') ? ', ' + place.address.split(',').slice(-2, -1)[0].trim() : ''}`);
                setLatitude(place.lat);
                setLongitude(place.lng);
              }}
            />
          </div>
        )}

        {/* Step 4: Bio, Looking For */}
        {step === 4 && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h2 className="font-display text-2xl text-sage-800">Tell us about yourself</h2>
              <p className="text-cream-600 text-sm mt-1">Write a short bio and what you&apos;re looking for</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Tell people about yourself, your interests, what makes you unique..."
                className="w-full bg-white border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30 focus:border-sage-400 resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className={`text-[10px] ${bio.length < 10 ? 'text-cream-500' : 'text-sage-400'}`}>
                  {bio.length < 10 ? `${10 - bio.length} more characters needed` : 'Looks good!'}
                </p>
                <p className={`text-[10px] ${bio.length > 450 ? 'text-amber-500' : 'text-cream-500'}`}>{bio.length}/500</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-sage-800 mb-1.5">What are you looking for?</label>
              <div className="space-y-2">
                {LOOKING_FOR_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setLookingFor(opt)}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center justify-between ${
                      lookingFor === opt
                        ? 'bg-sage-400 text-white shadow-sm'
                        : 'bg-cream-200 text-cream-700 hover:bg-cream-300'
                    }`}
                  >
                    {opt}
                    {lookingFor === opt && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Interests */}
        {step === 5 && (
          <div className="space-y-5 animate-fadeIn">
            <div>
              <h2 className="font-display text-2xl text-sage-800">Pick your interests</h2>
              <p className="text-cream-600 text-sm mt-1">Choose at least {MIN_INTERESTS} (max {MAX_INTERESTS})</p>
            </div>

            {/* Max warning toast */}
            {maxWarning && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2.5 rounded-xl text-center animate-fadeIn">
                Maximum {MAX_INTERESTS} interests! Remove one to add another.
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {allInterests.map((interest) => {
                const selected = selectedInterests.includes(interest.name);
                return (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.name)}
                    className={`text-sm font-medium px-4 py-2 rounded-xl transition-all ${
                      selected
                        ? 'bg-sage-400 text-white shadow-sm scale-[1.02]'
                        : 'bg-cream-200 text-cream-700 hover:bg-cream-300'
                    }`}
                  >
                    {interest.name}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <p className={`text-sm font-medium ${selectedInterests.length >= MIN_INTERESTS ? 'text-sage-500' : 'text-cream-600'}`}>
                {selectedInterests.length}/{MAX_INTERESTS} selected
              </p>
              {selectedInterests.length < MIN_INTERESTS && (
                <p className="text-xs text-cream-500">Pick {MIN_INTERESTS - selectedInterests.length} more</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="px-6 pb-8 flex gap-3 shrink-0">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 rounded-2xl bg-cream-200 text-cream-700 font-medium flex items-center gap-1 hover:bg-cream-300 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />Back
          </button>
        )}
        {step < TOTAL_STEPS ? (
          <button
            onClick={handleContinue}
            disabled={!isStepValid()}
            className="flex-1 py-3.5 rounded-2xl bg-sage-400 text-white font-bold text-base flex items-center justify-center gap-1 hover:bg-sage-500 transition-colors disabled:opacity-40 disabled:hover:bg-sage-400"
          >
            Continue<ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleFinish}
            disabled={!isStepValid() || saving}
            className="flex-1 py-3.5 rounded-2xl bg-sage-400 text-white font-bold text-base flex items-center justify-center gap-2 hover:bg-sage-500 transition-colors disabled:opacity-40"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {saving ? 'Building...' : 'Start Dating!'}
          </button>
        )}
      </div>

      {/* ── Age Confirmation Modal ── */}
      {showAgeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-cream-50 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-fadeIn">
            <h3 className="font-display text-xl text-sage-800 text-center">Your age is {confirmAge}</h3>
            <p className="text-cream-600 text-sm mt-2 text-center">
              Please confirm your age is correct — it cannot be changed later.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAgeConfirm(false)}
                className="flex-1 py-3 rounded-2xl bg-cream-200 text-cream-700 font-medium hover:bg-cream-300 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={() => {
                  setShowAgeConfirm(false);
                  setStep(2);
                }}
                className="flex-1 py-3 rounded-2xl bg-sage-400 text-white font-bold hover:bg-sage-500 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Building Profile Modal ── */}
      {showBuildingModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-cream-50 rounded-3xl max-w-sm w-full p-8 shadow-2xl">
            <div className="flex flex-col items-center">
              {/* Animated icon */}
              <div className="w-16 h-16 bg-sage-100 rounded-full flex items-center justify-center mb-5">
                {(() => {
                  const Icon = buildingMessages[buildingStep].icon;
                  return <Icon className="w-8 h-8 text-sage-500 animate-pulse" />;
                })()}
              </div>

              <h3 className="font-display text-xl text-sage-800 text-center">Building your profile</h3>
              <p className="text-cream-600 text-sm mt-2 text-center animate-fadeIn" key={buildingStep}>
                {buildingMessages[buildingStep].text}
              </p>

              {/* Progress dots */}
              <div className="flex gap-2 mt-6">
                {buildingMessages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-all duration-500 ${
                      i <= buildingStep ? 'bg-sage-400 scale-110' : 'bg-cream-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Inline animation styles */}
      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
