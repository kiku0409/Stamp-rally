'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { StampBookGroup, StampBookReward, LocalParticipant } from '@/types';
import { getLocalParticipant } from '@/lib/storage';

interface SelectedReward {
  reward: StampBookReward;
  projectName: string;
}

interface StampBookCtx {
  participant: LocalParticipant | null;
  groups: StampBookGroup[];
  loading: boolean;
  showScanner: boolean;
  setShowScanner: (v: boolean) => void;
  selectedReward: SelectedReward | null;
  setSelectedReward: (v: SelectedReward | null | ((prev: SelectedReward | null) => SelectedReward | null)) => void;
  redeemPopup: { label: string } | null;
  setRedeemPopup: (v: { label: string } | null) => void;
  reload: () => void;
}

const StampBookContext = createContext<StampBookCtx>({
  participant: null,
  groups: [],
  loading: true,
  showScanner: false,
  setShowScanner: () => {},
  selectedReward: null,
  setSelectedReward: () => {},
  redeemPopup: null,
  setRedeemPopup: () => {},
  reload: () => {},
});

export function useStampBook() {
  return useContext(StampBookContext);
}

export function StampBookProvider({ children }: { children: React.ReactNode }) {
  const [groups, setGroups] = useState<StampBookGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<LocalParticipant | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [selectedReward, setSelectedReward] = useState<SelectedReward | null>(null);
  const [redeemPopup, setRedeemPopup] = useState<{ label: string } | null>(null);

  const prevUnredeemedRef = useRef<Map<string, string>>(new Map());
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryCodeRef = useRef<string | null>(null);

  useEffect(() => {
    const local = getLocalParticipant();
    if (local?.recovery_code) {
      recoveryCodeRef.current = local.recovery_code;
      setParticipant(local);
      loadData(local.recovery_code);
    } else {
      setParticipant(null);
      setLoading(false);
    }

    // スタンプ取得画面から戻った時などに静かに再フェッチ
    function handleVisibility() {
      if (!document.hidden && recoveryCodeRef.current) {
        loadData(recoveryCodeRef.current);
      }
    }
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  useEffect(() => {
    const map = new Map<string, string>();
    for (const g of groups) {
      for (const r of g.rewards) {
        if (!r.redeemed_at) map.set(r.redeem_code, r.label);
      }
    }
    prevUnredeemedRef.current = map;
  }, [groups]);

  useEffect(() => {
    if (!participant?.recovery_code) return;
    const code = participant.recovery_code;

    const id = setInterval(async () => {
      try {
        const res = await fetch(`/api/stamp-book?code=${encodeURIComponent(code)}`);
        const data: StampBookGroup[] = await res.json();
        if (!Array.isArray(data)) return;

        const prev = prevUnredeemedRef.current;
        let newlyRedeemed: { label: string; redeemCode: string } | null = null;
        for (const g of data) {
          for (const r of g.rewards) {
            if (r.redeemed_at && prev.has(r.redeem_code)) {
              newlyRedeemed = { label: r.label, redeemCode: r.redeem_code };
              prev.delete(r.redeem_code);
            }
          }
        }

        if (newlyRedeemed) {
          const { label, redeemCode } = newlyRedeemed;
          setSelectedReward(current => current?.reward.redeem_code === redeemCode ? null : current);
          setRedeemPopup({ label });
          if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
          popupTimerRef.current = setTimeout(() => setRedeemPopup(null), 3500);
        }

        setGroups(data);

        const hasUnredeemed = data.some(g => g.rewards.some(r => !r.redeemed_at));
        if (!hasUnredeemed) clearInterval(id);
      } catch {
        // silently handle network errors
      }
    }, 3000);

    return () => {
      clearInterval(id);
      if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
    };
  }, [participant]);

  async function loadData(code: string) {
    try {
      const res = await fetch(`/api/stamp-book?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      // silently handle error
    } finally {
      setLoading(false);
    }
  }

  function reload() {
    const code = recoveryCodeRef.current;
    if (code) loadData(code);
  }

  return (
    <StampBookContext.Provider value={{
      participant,
      groups,
      loading,
      showScanner,
      setShowScanner,
      selectedReward,
      setSelectedReward,
      redeemPopup,
      setRedeemPopup,
      reload,
    }}>
      {children}
    </StampBookContext.Provider>
  );
}
