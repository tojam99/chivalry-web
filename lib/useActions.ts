import { useState, useCallback } from 'react';
import { createClient } from './supabase-browser';

const supabase = createClient();

export interface ActionModalState {
  open: boolean;
  type: 'none' | 'actions' | 'confirm' | 'report' | 'info';
  title: string;
  message: string;
  confirmText: string;
  confirmColor?: string;
  onConfirm: () => void;
  options?: { label: string; color?: string; onPress: () => void }[];
}

const INITIAL: ActionModalState = {
  open: false, type: 'none', title: '', message: '', confirmText: '', onConfirm: () => {},
};

export function useActions(myProfileId: string | null) {
  const [modalState, setModalState] = useState<ActionModalState>(INITIAL);

  const closeModal = useCallback(() => setModalState(INITIAL), []);

  const showInfo = useCallback((title: string, message: string) => {
    setModalState({ open: true, type: 'info', title, message, confirmText: 'OK', onConfirm: () => setModalState(INITIAL) });
  }, []);

  const submitReport = useCallback(async (otherUserId: string, reason: string, details: string) => {
    if (!myProfileId) return;
    await supabase.from('reports').insert({ reporter_id: myProfileId, reported_id: otherUserId, reason, details });
  }, [myProfileId]);

  const unmatch = useCallback((matchId: string, otherName: string, onSuccess?: () => void) => {
    setModalState({
      open: true, type: 'confirm', title: 'Unmatch',
      message: `Are you sure you want to unmatch with ${otherName}? This will delete your conversation and any scheduled dates.`,
      confirmText: 'Unmatch', confirmColor: '#C4756A',
      onConfirm: async () => {
        setModalState(INITIAL);
        await supabase.from('matches').update({ status: 'unmatched' }).eq('id', matchId);
        await supabase.from('dates').update({ status: 'cancelled' }).eq('match_id', matchId).in('status', ['pending_pick', 'pending_time', 'confirmed']);
        showInfo('Unmatched', `You have unmatched with ${otherName}.`);
        onSuccess?.();
      },
    });
  }, [showInfo]);

  const block = useCallback((matchId: string, otherUserId: string, otherName: string, onSuccess?: () => void) => {
    setModalState({
      open: true, type: 'confirm', title: 'Block',
      message: `Are you sure you want to block ${otherName}? They won't be able to see your profile or contact you.`,
      confirmText: 'Block', confirmColor: '#C4756A',
      onConfirm: async () => {
        setModalState(INITIAL);
        if (matchId) {
          await supabase.from('matches').update({ status: 'blocked' }).eq('id', matchId);
          await supabase.from('dates').update({ status: 'cancelled' }).eq('match_id', matchId).in('status', ['pending_pick', 'pending_time', 'confirmed']);
        }
        if (myProfileId) {
          await supabase.from('reports').insert({ reporter_id: myProfileId, reported_id: otherUserId, reason: 'blocked', details: 'User blocked' });
        }
        showInfo('Blocked', `${otherName} has been blocked.`);
        onSuccess?.();
      },
    });
  }, [myProfileId, showInfo]);

  const report = useCallback((otherUserId: string, otherName: string, onSuccess?: () => void) => {
    const reasons = ['Inappropriate photos', 'Harassment or bullying', 'Spam or scam', 'Fake profile', 'Underage user', 'Other'];
    setModalState({
      open: true, type: 'report', title: `Report ${otherName}`, message: 'Why are you reporting this person?',
      confirmText: '', onConfirm: () => {},
      options: reasons.map((reason) => ({
        label: reason, color: reason === 'Underage user' ? '#C4756A' : undefined,
        onPress: async () => {
          setModalState(INITIAL);
          await submitReport(otherUserId, reason, '');
          showInfo('Reported', 'Thank you for your report. We will review it shortly.');
          onSuccess?.();
        },
      })),
    });
  }, [submitReport, showInfo]);

  const showActions = useCallback((matchId: string, otherUserId: string, otherName: string, onSuccess?: () => void) => {
    setModalState({
      open: true, type: 'actions', title: otherName, message: '', confirmText: '', onConfirm: () => {},
      options: [
        { label: 'Report', onPress: () => { setModalState(INITIAL); setTimeout(() => report(otherUserId, otherName, onSuccess), 200); } },
        { label: 'Unmatch', color: '#C4756A', onPress: () => { setModalState(INITIAL); setTimeout(() => unmatch(matchId, otherName, onSuccess), 200); } },
        { label: 'Block', color: '#C4756A', onPress: () => { setModalState(INITIAL); setTimeout(() => block(matchId, otherUserId, otherName, onSuccess), 200); } },
      ],
    });
  }, [unmatch, block, report]);

  return { showActions, modalState, closeModal };
}
