'use client';

import { useState, useEffect } from 'react';
import { X, Users, ShieldCheck, Sparkles, Zap, Heart } from 'lucide-react';
import type { DiscoverFilters } from '@/lib/useDiscover';

interface Props {
  open: boolean;
  onClose: () => void;
  filters: DiscoverFilters;
  onApply: (filters: DiscoverFilters) => void;
}

export default function FilterModal({ open, onClose, filters, onApply }: Props) {
  const [local, setLocal] = useState<DiscoverFilters>(filters);

  useEffect(() => {
    if (open) setLocal(filters);
  }, [open]);

  const handleApply = () => {
    onApply(local);
    onClose();
  };

  const handleReset = () => {
    setLocal({
      showMe: 'Everyone',
      ageMin: 18,
      ageMax: 99,
      maxDistance: 100,
      verifiedOnly: false,
      sharedInterests: false,
    });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 md:backdrop-blur-sm flex items-end md:items-center justify-center" style={{ height: '100dvh' }}>
      <div className="bg-cream-50 rounded-t-3xl md:rounded-3xl w-full md:max-w-md max-h-[80vh] md:max-h-[85vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-200 sticky top-0 bg-cream-50 z-10">
          <button onClick={handleReset} className="text-sm font-medium text-cream-600 hover:text-sage-800">Reset</button>
          <h3 className="font-bold text-lg text-sage-800">Filters</h3>
          <button onClick={handleApply} className="text-sm font-bold text-sage-400 hover:text-sage-600">Apply</button>
        </div>

        <div className="px-5 py-5 space-y-7" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 2.5rem)' }}>
          {/* Show Me */}
          <div>
            <p className="text-sm font-bold text-sage-800 mb-3">Show Me</p>
            <div className="flex gap-2">
              {['Women', 'Men', 'Everyone'].map((opt) => (
                <button key={opt} onClick={() => setLocal({ ...local, showMe: opt })}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors ${local.showMe === opt ? 'bg-sage-400 text-white' : 'bg-cream-200 text-cream-600 hover:bg-cream-300'}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-sage-800">Age Range</p>
              <span className="text-sm font-bold text-sage-400">{local.ageMin} — {local.ageMax}</span>
            </div>
            <div className="space-y-4 px-1">
              <div className="flex items-center gap-3">
                <span className="text-xs text-cream-600 w-8 shrink-0">Min</span>
                <input type="range" min={18} max={99} value={local.ageMin}
                  onChange={(e) => { const v = parseInt(e.target.value); if (v < local.ageMax) setLocal({ ...local, ageMin: v }); }}
                  className="flex-1 slider-modern" />
                <span className="text-sm font-semibold text-sage-800 w-8 text-right shrink-0">{local.ageMin}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-cream-600 w-8 shrink-0">Max</span>
                <input type="range" min={18} max={99} value={local.ageMax}
                  onChange={(e) => { const v = parseInt(e.target.value); if (v > local.ageMin) setLocal({ ...local, ageMax: v }); }}
                  className="flex-1 slider-modern" />
                <span className="text-sm font-semibold text-sage-800 w-8 text-right shrink-0">{local.ageMax}</span>
              </div>
            </div>
          </div>

          {/* Distance */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <p className="text-sm font-bold text-sage-800">Maximum Distance</p>
              <span className="text-sm font-bold text-sage-400">{local.maxDistance} mi</span>
            </div>
            <div className="px-1">
              <input type="range" min={1} max={100} value={local.maxDistance}
                onChange={(e) => setLocal({ ...local, maxDistance: parseInt(e.target.value) })}
                className="w-full slider-modern" />
            </div>
            <div className="flex justify-between mt-1 px-1">
              <span className="text-[10px] text-cream-600">1 mi</span>
              <span className="text-[10px] text-cream-600">25 mi</span>
              <span className="text-[10px] text-cream-600">50 mi</span>
              <span className="text-[10px] text-cream-600">100 mi</span>
            </div>
          </div>

          {/* Advanced Filters (Premium locked) */}
          <div>
            <p className="text-sm font-bold text-sage-800 mb-3">Advanced Filters</p>
            <div className="bg-cream-200/50 rounded-2xl overflow-hidden opacity-60">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center"><ShieldCheck className="w-5 h-5 text-sage-600" /></div>
                  <div>
                    <p className="text-sm font-semibold text-sage-800">Verified only</p>
                    <p className="text-[11px] text-cream-600">Only show verified profiles</p>
                  </div>
                </div>
                <span className="text-cream-500 text-xs">🔒</span>
              </div>
              <div className="h-px bg-cream-300 mx-4" />
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sage-100 rounded-lg flex items-center justify-center"><Sparkles className="w-5 h-5 text-sage-400" /></div>
                  <div>
                    <p className="text-sm font-semibold text-sage-800">Shared interests</p>
                    <p className="text-[11px] text-cream-600">Prioritize similar interests</p>
                  </div>
                </div>
                <span className="text-cream-500 text-xs">🔒</span>
              </div>
              <div className="h-px bg-cream-300 mx-4" />
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-sage-100 rounded-lg flex items-center justify-center"><Heart className="w-5 h-5 text-sage-400" /></div>
                  <div>
                    <p className="text-sm font-semibold text-sage-800">Looking for</p>
                    <p className="text-[11px] text-cream-600">Match by relationship goals</p>
                  </div>
                </div>
                <span className="text-cream-500 text-xs">🔒</span>
              </div>
            </div>
          </div>

          {/* Upgrade banner */}
          <div className="bg-sage-400 rounded-2xl p-4 flex items-center gap-3">
            <Zap className="w-5 h-5 text-white shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-bold text-white">Unlock Advanced Filters</p>
              <p className="text-[11px] text-white/80">Verified-only, shared interests, and more</p>
            </div>
          </div>
          {/* Bottom spacer — more on mobile, less on desktop */}
          <div className="h-[50px] md:h-[10px]" />
        </div>
      </div>

      {/* Modern slider styles */}
      <style jsx global>{`
        .slider-modern {
          -webkit-appearance: none;
          appearance: none;
          height: 5px;
          border-radius: 3px;
          background: #EDE8DF;
          outline: none;
          margin: 0 2px;
        }
        .slider-modern::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #7A9A6D;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .slider-modern::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 2px 6px rgba(0,0,0,0.25);
        }
        .slider-modern::-webkit-slider-thumb:active {
          transform: scale(1.05);
        }
        .slider-modern::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #7A9A6D;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .slider-modern::-moz-range-track {
          height: 5px;
          border-radius: 3px;
          background: #EDE8DF;
        }
        .slider-modern::-webkit-slider-runnable-track {
          height: 4px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
}
