'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ChevronLeft, Mail, Phone, Lock, Loader2, Check, AlertCircle } from 'lucide-react';

export default function AccountPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Change password state
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, []);

  async function handleChangePassword() {
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setPasswordLoading(true);
    setPasswordMsg(null);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMsg({ type: 'error', text: error.message });
    } else {
      setPasswordMsg({ type: 'success', text: 'Password updated successfully' });
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    }
    setPasswordLoading(false);
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 text-sage-400 animate-spin" /></div>;
  }

  return (
    <div className="pb-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/profile')} className="w-9 h-9 bg-cream-200 rounded-full flex items-center justify-center text-cream-700 hover:bg-cream-300 transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-2xl text-sage-800">Account</h1>
      </div>

      {/* Email */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Email</label>
        <div className="bg-cream-100 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Mail className="w-5 h-5 text-cream-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-sage-800">{user?.email || 'No email set'}</p>
              <p className="text-xs text-cream-600">Primary email address</p>
            </div>
          </div>
        </div>
      </div>

      {/* Phone */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Phone</label>
        <div className="bg-cream-100 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Phone className="w-5 h-5 text-cream-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-sage-800">{user?.phone || 'Not set'}</p>
              <p className="text-xs text-cream-600">Phone number</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Security</label>
        <div className="bg-cream-100 rounded-2xl overflow-hidden">
          {!showChangePassword ? (
            <button onClick={() => setShowChangePassword(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-cream-200 transition-colors">
              <Lock className="w-5 h-5 text-cream-600" />
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-sage-800">Change Password</p>
                <p className="text-xs text-cream-600">Update your account password</p>
              </div>
              <ChevronLeft className="w-4 h-4 text-cream-500 rotate-180" />
            </button>
          ) : (
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="text-xs text-cream-600 mb-1 block">New password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
              </div>
              <div>
                <label className="text-xs text-cream-600 mb-1 block">Confirm password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-white border border-cream-300 rounded-xl px-4 py-2.5 text-sm text-sage-800 focus:outline-none focus:ring-2 focus:ring-sage-400/30" />
              </div>
              {passwordMsg && (
                <div className={`flex items-center gap-2 text-sm px-3 py-2 rounded-xl ${
                  passwordMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
                }`}>
                  {passwordMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {passwordMsg.text}
                </div>
              )}
              <div className="flex gap-2">
                <button onClick={() => { setShowChangePassword(false); setNewPassword(''); setConfirmPassword(''); setPasswordMsg(null); }}
                  className="text-sm text-cream-600 px-4 py-2">Cancel</button>
                <button onClick={handleChangePassword} disabled={passwordLoading}
                  className="text-sm bg-sage-400 text-white px-4 py-2 rounded-xl disabled:opacity-40 flex items-center gap-1">
                  {passwordLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                  Update
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Auth Provider */}
      <div>
        <label className="text-xs font-bold text-cream-600 uppercase tracking-wide mb-2 block">Sign-in method</label>
        <div className="bg-cream-100 rounded-2xl px-4 py-3.5">
          <p className="text-sm font-medium text-sage-800">
            {(() => {
              const providers = user?.app_metadata?.providers || [];
              const provider = user?.app_metadata?.provider || '';
              if (providers.includes('google') || provider === 'google') return 'Google';
              if (providers.includes('apple') || provider === 'apple') return 'Apple';
              if (providers.includes('email') || provider === 'email') return 'Email & Password';
              if (providers.includes('phone') || provider === 'phone') return 'Phone';
              return user?.email ? 'Email & Password' : 'Unknown';
            })()}
          </p>
          <p className="text-xs text-cream-600 mt-0.5">How you sign in to Chivalry</p>
        </div>
      </div>
    </div>
  );
}
