'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import {
  X, ChevronLeft, ChevronRight, MapPin, Heart, Calendar, Info, ShieldCheck,
  Leaf, Sparkles, Search, Loader2, Send, Zap,
} from 'lucide-react';

const SUPABASE_STORAGE = 'https://pkekuxksofbzjrieesqm.supabase.co/storage/v1/object/public/profile-photos/';
function resolvePhoto(url: string | null): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SUPABASE_STORAGE}${url}`;
}

interface Props {
  open: boolean;
  onClose: () => void;
  userId: string;
  matchId?: string | null;       // if provided, can request dates
  myProfileId?: string | null;   // needed for date requests
  onDateRequested?: () => void;  // callback after date created
}

export default function ProfileViewModal({ open, onClose, userId, matchId, myProfileId, onDateRequested }: Props) {
  const supabase = createClient();
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<{ photo_url: string }[]>([]);
  const [dateIdeas, setDateIdeas] = useState<{ id: string; title: string; location_name: string }[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Date request state
  const [confirmRequest, setConfirmRequest] = useState<{ visible: boolean; idea: { id: string; title: string; location_name: string } | null }>({ visible: false, idea: null });
  const [dateCredits, setDateCredits] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [noCreditsModal, setNoCreditsModal] = useState(false);

  useEffect(() => {
    if (!open || !userId) return;
    setLoading(true); setPhotoIdx(0); setSuccessMsg(null); setConfirmRequest({ visible: false, idea: null });
    (async () => {
      const [pRes, phRes, diRes, iRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('profile_photos').select('photo_url, sort_order').eq('profile_id', userId).order('sort_order'),
        supabase.from('date_ideas').select('id, title, location_name').eq('profile_id', userId),
        supabase.from('profile_interests').select('interests(name)').eq('profile_id', userId),
      ]);
      setProfile(pRes.data);
      setPhotos(phRes.data || []);
      setDateIdeas((diRes.data || []).filter((d: any) => d.title && d.title.trim()));
      setInterests((iRes.data || []).map((i: any) => i.interests?.name).filter(Boolean));
      setLoading(false);

      // Fetch credits
      if (myProfileId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase.from('profiles').select('date_request_credits, premium').eq('auth_id', user.id).single();
          if (data) { setDateCredits(data.date_request_credits || 0); setIsPremium(data.premium || false); }
        }
      }
    })();
  }, [open, userId]);

  function handleTapDateIdea(idea: { id: string; title: string; location_name: string }) {
    if (!matchId || !myProfileId) return;
    if (dateCredits > 0 || isPremium) {
      setConfirmRequest({ visible: true, idea });
    } else {
      setNoCreditsModal(true);
    }
  }

  async function confirmDateRequest() {
    if (!confirmRequest.idea || !matchId || !myProfileId) return;
    setRequesting(true);
    try {
      const { data: existing } = await supabase.from('dates').select('id').eq('match_id', matchId)
        .in('status', ['pending_pick', 'pending_accept', 'pending_time', 'pending_confirm', 'confirmed']);
      if (existing && existing.length > 0) {
        setConfirmRequest({ visible: false, idea: null });
        setSuccessMsg('There is already an active date with this person.');
        setRequesting(false);
        return;
      }

      if (dateCredits > 0 && !isPremium) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) { await supabase.rpc('use_date_request_credit', { user_auth_id: user.id }); setDateCredits((p) => p - 1); }
      }

      await supabase.from('dates').insert({
        match_id: matchId, title: confirmRequest.idea.title, location_name: confirmRequest.idea.location_name,
        status: 'pending_accept', proposed_by: myProfileId, proposed_by_name: 'You', waiting_on: userId,
      });

      setConfirmRequest({ visible: false, idea: null });
      setSuccessMsg(`Date request for "${confirmRequest.idea.title}" sent!`);
      onDateRequested?.();
    } catch (err) { console.error(err); setSuccessMsg('Failed to send. Try again.'); }
    setRequesting(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center py-6 px-4">
        <div className="bg-cream-50 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl">
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
                    {photos.map((_: any, i: number) => (<div key={i} className={`h-1 rounded-full flex-1 max-w-12 ${i === photoIdx ? 'bg-white' : 'bg-white/40'}`} />))}
                  </div>
                )}
                {photoIdx > 0 && (<button onClick={() => setPhotoIdx(photoIdx - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"><ChevronLeft className="w-4 h-4" /></button>)}
                {photoIdx < photos.length - 1 && (<button onClick={() => setPhotoIdx(photoIdx + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white"><ChevronRight className="w-4 h-4" /></button>)}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-white font-display text-2xl">{profile.name}, {profile.age}</h2>
                    {profile.verified && <ShieldCheck className="w-5 h-5 text-green-400" />}
                  </div>
                  {profile.city && <div className="flex items-center gap-1 text-white/80 text-sm mt-0.5"><MapPin className="w-3 h-3" /><span>{profile.city}</span></div>}
                </div>
              </div>

              {/* Available Now banner */}
              {profile.available_now && (
                <div className="mx-5 mt-3 bg-green-500 rounded-xl py-2 px-4 flex items-center justify-center gap-2">
                  <Zap className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-bold uppercase tracking-wide">Available Now!</span>
                </div>
              )}

              <div className="px-5 pb-6 space-y-4 mt-4">
                {/* Success message */}
                {successMsg && (
                  <div className="bg-sage-100 border border-sage-200 text-sage-700 text-sm font-medium px-4 py-3 rounded-xl text-center">{successMsg}</div>
                )}

                {/* Bio */}
                {profile.bio && <p className="text-sage-800 text-[15px] leading-relaxed">{profile.bio}</p>}

                {/* Request a Date — only if matchId provided and no success yet */}
                {dateIdeas.length > 0 && matchId && !successMsg && (
                  <div>
                    <div className="flex items-center gap-2 mb-1"><Heart className="w-4 h-4 text-sage-400" /><p className="text-xs font-medium text-cream-600 uppercase tracking-wide">Request a Date</p></div>
                    <p className="text-[11px] text-cream-500 mb-2">Tap a date idea to request it</p>
                    <div className="space-y-2">
                      {dateIdeas.map((idea) => (
                        <button key={idea.id} onClick={() => handleTapDateIdea(idea)} disabled={requesting}
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
                      ].filter((r: any) => r.value).map((r: any) => (
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
                      ].filter((r: any) => r.value).map((r: any) => (
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
                    <div className="flex flex-wrap gap-1.5">{interests.map((i, idx) => (<span key={idx} className="bg-sage-100 text-sage-600 text-xs font-medium px-3 py-1.5 rounded-lg">{i}</span>))}</div>
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

      {/* Confirm Date Request Modal */}
      {confirmRequest.visible && confirmRequest.idea && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-cream-50 rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl">
            <div className="bg-gradient-to-b from-sage-400 to-sage-500 py-6 px-5 text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"><Calendar className="w-7 h-7 text-white" /></div>
              <h3 className="text-2xl font-display text-white">Request a Date</h3>
              <p className="text-white/80 text-sm mt-1">with {profile?.name || 'this person'}</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="bg-cream-200 rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sage-400 rounded-full flex items-center justify-center shrink-0"><Heart className="w-4 h-4 text-white" fill="white" /></div>
                  <p className="text-base font-bold text-sage-800 flex-1">{confirmRequest.idea.title}</p>
                </div>
                {confirmRequest.idea.location_name && (
                  <div className="flex items-center gap-2 ml-12 mt-1"><MapPin className="w-3.5 h-3.5 text-sage-400" /><p className="text-sm text-cream-600">{confirmRequest.idea.location_name}</p></div>
                )}
              </div>
              {!isPremium && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <span className="text-amber-600">🎟️</span>
                  <p className="text-sm text-amber-900 flex-1">1 credit will be used. You have <span className="font-bold">{dateCredits}</span> remaining.</p>
                </div>
              )}
              <button onClick={confirmDateRequest} disabled={requesting}
                className="w-full flex items-center justify-center gap-2 bg-sage-400 text-white font-bold py-4 rounded-2xl hover:bg-sage-500 disabled:opacity-50 text-base">
                {requesting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}Send Date Request
              </button>
              <button onClick={() => setConfirmRequest({ visible: false, idea: null })}
                className="w-full py-3 text-center text-cream-600 font-semibold hover:text-sage-800">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* No Credits Modal */}
      {noCreditsModal && (
        <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-6">
          <div className="bg-cream-50 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4"><span className="text-2xl">🎟️</span></div>
            <h3 className="font-display text-xl text-sage-800 mb-2">No Date Request Credits</h3>
            <p className="text-cream-700 text-sm mb-6">Upgrade to Premium for unlimited requests, or purchase a credit pack.</p>
            <button onClick={() => setNoCreditsModal(false)} className="w-full bg-sage-400 text-white font-medium py-3 rounded-2xl hover:bg-sage-500">Got it</button>
          </div>
        </div>
      )}
    </div>
  );
}
