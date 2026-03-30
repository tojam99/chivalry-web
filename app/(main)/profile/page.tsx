'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/useProfile';
import { createClient } from '@/lib/supabase-browser';
import {
  User,
  Camera,
  MapPin,
  Briefcase,
  GraduationCap,
  Ruler,
  Heart,
  Coffee,
  Save,
  Loader2,
  X,
  Plus,
  LogOut,
  Settings,
  Eye,
  ChevronRight,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';

function resolvePhotoUrl(url: string | null, width: number = 400): string {
  if (!url) return '';
  const full = url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
  if (full.includes('supabase.co/storage/v1/object/public/')) {
    const base = full.replace('/object/public/', '/render/image/public/');
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}width=${width}&resize=contain&quality=70`;
  }
  return full;
}

interface ProfilePhoto {
  id: string;
  photo_url: string;
  sort_order: number;
}

interface DateIdea {
  id: string;
  title: string;
  location_name: string;
}

export default function ProfilePage() {
  const supabase = createClient();
  const { profile, loading: profileLoading, setProfile } = useProfile();
  const router = useRouter();

  const [photos, setPhotos] = useState<ProfilePhoto[]>([]);
  const [dateIdeas, setDateIdeas] = useState<DateIdea[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: '',
    profession: '',
    education: '',
    height: '',
    looking_for: '',
    city: '',
  });

  // Fetch photos and date ideas
  const fetchExtras = useCallback(async () => {
    if (!profile?.id) return;

    const [photosResult, ideasResult] = await Promise.all([
      supabase
        .from('profile_photos')
        .select('id, photo_url, sort_order')
        .eq('profile_id', profile.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('date_ideas')
        .select('id, title, location_name')
        .eq('profile_id', profile.id),
    ]);

    setPhotos(photosResult.data || []);
    setDateIdeas(ideasResult.data || []);
  }, [profile?.id]);

  useEffect(() => {
    fetchExtras();
  }, [fetchExtras]);

  // Initialize edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        bio: profile.bio || '',
        profession: profile.profession || '',
        education: profile.education || '',
        height: profile.height || '',
        looking_for: profile.looking_for || '',
        city: profile.city || '',
      });
    }
  }, [profile]);

  async function handleSave() {
    if (!profile?.id) return;
    setSaving(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({
        bio: editForm.bio,
        profession: editForm.profession,
        education: editForm.education,
        height: editForm.height,
        looking_for: editForm.looking_for,
        city: editForm.city,
      })
      .eq('id', profile.id)
      .select()
      .single();

    if (!error && data) {
      setProfile(data);
      setEditing(false);
    }
    setSaving(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  if (profileLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-sage-400 animate-spin mb-4" />
        <p className="text-cream-700">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <p className="text-cream-700">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="pb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-sage-800">Profile</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="text-sm font-medium text-sage-400 hover:text-sage-500 transition-colors"
          >
            Edit profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => setEditing(false)}
              className="text-sm font-medium text-cream-700 hover:text-sage-800 transition-colors px-3 py-1.5"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="text-sm font-medium bg-sage-400 text-white px-4 py-1.5 rounded-xl hover:bg-sage-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Save
            </button>
          </div>
        )}
      </div>

      {/* Photos grid */}
      <div className="mb-6">
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, idx) => (
            <div
              key={photo.id}
              className={`relative rounded-xl overflow-hidden ${
                idx === 0 ? 'col-span-2 row-span-2 aspect-[3/4]' : 'aspect-square'
              }`}
            >
              <Image
                src={resolvePhotoUrl(photo.photo_url, idx === 0 ? 600 : 300)}
                alt={`Photo ${idx + 1}`}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ))}
          {photos.length < 6 && (
            <div className="aspect-square bg-cream-200 rounded-xl flex items-center justify-center border-2 border-dashed border-cream-400 cursor-pointer hover:border-sage-400 hover:bg-cream-100 transition-colors">
              <Plus className="w-6 h-6 text-cream-600" />
            </div>
          )}
        </div>
      </div>

      {/* Name & basics */}
      <div className="mb-6">
        <h2 className="font-display text-xl text-sage-800">
          {profile.name}, {profile.age}
        </h2>
        {profile.city && (
          <p className="text-cream-700 text-sm flex items-center gap-1 mt-1">
            <MapPin className="w-3.5 h-3.5" />
            {editing ? (
              <input
                type="text"
                value={editForm.city}
                onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                className="bg-cream-100 border border-cream-300 rounded-lg px-2 py-1 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30"
              />
            ) : (
              profile.city
            )}
          </p>
        )}
      </div>

      {/* Bio */}
      <div className="mb-6">
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">About me</label>
        {editing ? (
          <textarea
            value={editForm.bio}
            onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            rows={3}
            className="w-full bg-cream-100 border border-cream-300 rounded-xl px-4 py-3 text-sm text-sage-800 placeholder:text-cream-600 focus:outline-none focus:ring-2 focus:ring-sage-400/30 resize-none"
            placeholder="Tell people about yourself..."
          />
        ) : (
          <p className="text-sage-800 text-[15px] leading-relaxed">
            {profile.bio || 'No bio yet'}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="mb-6 space-y-3">
        <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">Details</label>

        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-cream-600 shrink-0" />
              <input
                type="text"
                value={editForm.profession}
                onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                placeholder="Profession"
                className="flex-1 bg-cream-100 border border-cream-300 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <GraduationCap className="w-4 h-4 text-cream-600 shrink-0" />
              <input
                type="text"
                value={editForm.education}
                onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
                placeholder="Education"
                className="flex-1 bg-cream-100 border border-cream-300 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <Ruler className="w-4 h-4 text-cream-600 shrink-0" />
              <input
                type="text"
                value={editForm.height}
                onChange={(e) => setEditForm({ ...editForm, height: e.target.value })}
                placeholder="Height"
                className="flex-1 bg-cream-100 border border-cream-300 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30"
              />
            </div>
            <div className="flex items-center gap-3">
              <Heart className="w-4 h-4 text-cream-600 shrink-0" />
              <input
                type="text"
                value={editForm.looking_for}
                onChange={(e) => setEditForm({ ...editForm, looking_for: e.target.value })}
                placeholder="Looking for"
                className="flex-1 bg-cream-100 border border-cream-300 rounded-lg px-3 py-2 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30"
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {profile.profession && (
              <span className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                <Briefcase className="w-3 h-3" />
                {profile.profession}
              </span>
            )}
            {profile.education && (
              <span className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                <GraduationCap className="w-3 h-3" />
                {profile.education}
              </span>
            )}
            {profile.height && (
              <span className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                <Ruler className="w-3 h-3" />
                {profile.height}
              </span>
            )}
            {profile.looking_for && (
              <span className="flex items-center gap-1.5 bg-cream-200 text-cream-800 text-xs font-medium px-3 py-1.5 rounded-lg">
                <Heart className="w-3 h-3" />
                {profile.looking_for}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Date ideas */}
      {dateIdeas.length > 0 && (
        <div className="mb-6">
          <label className="text-xs font-medium text-cream-600 uppercase tracking-wide mb-2 block">
            My date ideas
          </label>
          <div className="space-y-2">
            {dateIdeas.map((idea) => (
              <div key={idea.id} className="flex items-center gap-3 bg-cream-100 rounded-xl p-3">
                <div className="w-9 h-9 bg-gold-400/20 rounded-lg flex items-center justify-center shrink-0">
                  <Coffee className="w-4 h-4 text-gold-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-sage-800 truncate">{idea.title}</p>
                  {idea.location_name && (
                    <p className="text-xs text-cream-600 truncate">{idea.location_name}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings section */}
      <div className="border-t border-cream-200 pt-6 space-y-1">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-cream-100 transition-colors text-left"
        >
          <span className="flex items-center gap-3 text-red-500 text-sm font-medium">
            <LogOut className="w-4 h-4" />
            Sign out
          </span>
          <ChevronRight className="w-4 h-4 text-cream-500" />
        </button>
      </div>
    </div>
  );
}
