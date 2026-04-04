'use client';

import { X } from 'lucide-react';
import type { ActionModalState } from '@/lib/useActions';

export function ActionModal({ state, onClose }: { state: ActionModalState; onClose: () => void }) {
  if (!state.open) return null;

  // Info modal
  if (state.type === 'info') {
    return (
      <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <h3 className="font-bold text-xl text-sage-800 mb-2">{state.title}</h3>
          <p className="text-cream-700 text-sm mb-6">{state.message}</p>
          <button onClick={state.onConfirm} className="w-full py-2.5 rounded-xl bg-sage-400 text-white font-medium text-sm">OK</button>
        </div>
      </div>
    );
  }

  // Confirm modal
  if (state.type === 'confirm') {
    return (
      <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
          <h3 className="font-bold text-xl text-sage-800 mb-2">{state.title}</h3>
          <p className="text-cream-700 text-sm mb-6">{state.message}</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-cream-200 text-cream-700 font-medium text-sm">Cancel</button>
            <button onClick={state.onConfirm} className="flex-1 py-2.5 rounded-xl font-medium text-sm text-white" style={{ backgroundColor: state.confirmColor || '#7A9A6D' }}>{state.confirmText}</button>
          </div>
        </div>
      </div>
    );
  }

  // Actions menu or Report reasons
  if (state.type === 'actions' || state.type === 'report') {
    return (
      <div className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center">
        <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-md shadow-2xl">
          <div className="flex items-center justify-between p-5 pb-2">
            <h3 className="font-bold text-xl text-sage-800">{state.title}</h3>
            <button onClick={onClose} className="text-cream-600 hover:text-sage-800"><X className="w-5 h-5" /></button>
          </div>
          {state.message && <p className="px-5 text-cream-700 text-sm mb-2">{state.message}</p>}
          <div className="pb-8 sm:pb-5">
            {state.options?.map((opt, i) => (
              <button key={i} onClick={opt.onPress}
                className="w-full text-left px-5 py-3.5 text-sm font-medium hover:bg-cream-100 transition-colors border-b border-cream-100 last:border-b-0"
                style={{ color: opt.color || '#2C3028' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
