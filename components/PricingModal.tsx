'use client';

import { useState, useEffect } from 'react';
import { X, Diamond, Sparkles, Check, Loader2, Zap } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  profileId: string;
  authId: string;
  mode?: 'premium' | 'credits';
}

const PREMIUM_FEATURES = [
  'Incognito Mode',
  'Travel Mode',
  'Hide Your Ratings',
  'Advanced Filters',
  'Unlimited Likes',
  'See Who Likes You',
];

export default function PricingModal({ open, onClose, profileId, authId, mode = 'premium' }: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [tab, setTab] = useState<'premium' | 'credits'>(mode);

  // Sync tab with mode when modal opens
  useEffect(() => {
    if (open) setTab(mode);
  }, [open, mode]);

  async function handleCheckout(priceKey: string) {
    setLoading(priceKey);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceKey, profileId, authId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Checkout error:', data.error);
        setLoading(null);
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setLoading(null);
    }
  }

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-[51] flex items-center justify-center px-4 pointer-events-none" style={{ height: '100dvh' }}>
        <div className="bg-cream-50 rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-cream-300 pointer-events-auto max-h-[85vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="w-8" />
            <h3 className="font-bold text-lg text-sage-800">
              {tab === 'premium' ? 'Go Premium' : 'Get Credits'}
            </h3>
            <button onClick={onClose} className="w-8 h-8 bg-cream-200 rounded-full flex items-center justify-center text-cream-700 hover:bg-cream-300">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1 mx-5 mb-4 bg-cream-200 rounded-xl p-1">
            <button onClick={() => setTab('premium')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === 'premium' ? 'bg-white text-sage-800 shadow-sm' : 'text-cream-600'
              }`}>
              Premium
            </button>
            <button onClick={() => setTab('credits')}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                tab === 'credits' ? 'bg-white text-sage-800 shadow-sm' : 'text-cream-600'
              }`}>
              Credits
            </button>
          </div>

          <div className="px-5 pb-6">
            {tab === 'premium' ? (
              <>
                {/* Feature list */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Diamond className="w-5 h-5 text-sage-400" />
                    <p className="text-sm font-bold text-sage-800">Premium includes</p>
                  </div>
                  <div className="space-y-2">
                    {PREMIUM_FEATURES.map((f) => (
                      <div key={f} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-sage-400 shrink-0" />
                        <span className="text-sm text-cream-700">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Plan options */}
                <div className="space-y-2">
                  {[
                    { key: 'premium_weekly', label: 'Weekly', price: '$4.99', sub: '/week' },
                    { key: 'premium_monthly', label: 'Monthly', price: '$14.99', sub: '/month', popular: true },
                    { key: 'premium_quarterly', label: 'Quarterly', price: '$29.99', sub: '/3 months', save: 'Save 50%' },
                  ].map((plan) => (
                    <button key={plan.key} onClick={() => handleCheckout(plan.key)}
                      disabled={loading !== null}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                        plan.popular ? 'border-sage-400 bg-sage-50' : 'border-cream-300 hover:border-sage-300'
                      } disabled:opacity-50`}>
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-sage-800">{plan.label}</p>
                            {plan.popular && <span className="text-[10px] bg-sage-400 text-white px-2 py-0.5 rounded-full font-bold">Popular</span>}
                            {plan.save && <span className="text-[10px] bg-gold-400 text-white px-2 py-0.5 rounded-full font-bold">{plan.save}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        <span className="text-base font-bold text-sage-800">{plan.price}</span>
                        <span className="text-xs text-cream-600">{plan.sub}</span>
                        {loading === plan.key && <Loader2 className="w-4 h-4 animate-spin text-sage-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Credits info */}
                <div className="mb-5 text-center">
                  <div className="w-14 h-14 bg-sage-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-7 h-7 text-sage-400" />
                  </div>
                  <p className="text-sm text-cream-600">Credits let you request dates with your matches. Each date request costs 1 credit.</p>
                </div>

                {/* Credit options */}
                <div className="space-y-2">
                  {[
                    { key: 'credits_2', amount: 2, price: '$2.99', per: '$1.50/ea' },
                    { key: 'credits_5', amount: 5, price: '$5.99', per: '$1.20/ea' },
                    { key: 'credits_10', amount: 10, price: '$9.99', per: '$1.00/ea', popular: true },
                    { key: 'credits_20', amount: 20, price: '$14.99', per: '$0.75/ea', save: 'Best Value' },
                  ].map((pack) => (
                    <button key={pack.key} onClick={() => handleCheckout(pack.key)}
                      disabled={loading !== null}
                      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-colors ${
                        pack.popular ? 'border-sage-400 bg-sage-50' : 'border-cream-300 hover:border-sage-300'
                      } disabled:opacity-50`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-sage-100 rounded-xl flex items-center justify-center">
                          <span className="text-sm font-bold text-sage-600">{pack.amount}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-sage-800">{pack.amount} Credits</p>
                            {pack.save && <span className="text-[10px] bg-gold-400 text-white px-2 py-0.5 rounded-full font-bold">{pack.save}</span>}
                          </div>
                          <p className="text-xs text-cream-600">{pack.per}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-sage-800">{pack.price}</span>
                        {loading === pack.key && <Loader2 className="w-4 h-4 animate-spin text-sage-400" />}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-[10px] text-cream-500 text-center mt-4">
              {tab === 'premium' ? 'Cancel anytime. Subscriptions auto-renew.' : 'Credits never expire.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
