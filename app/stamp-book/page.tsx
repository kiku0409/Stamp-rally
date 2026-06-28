'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music, Ticket, KeyRound, Gift, ChevronRight, Check } from 'lucide-react';
import { StampBookGroup, StampBookReward } from '@/types';
import { getLocalParticipant, setLocalParticipant } from '@/lib/storage';
import StampCard from '@/components/StampCard';
import QRScanner from '@/components/QRScanner';
import RewardTicketModal from '@/components/RewardTicketModal';

export default function StampBookPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<StampBookGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<{ participant_id: string; nickname: string; recovery_code?: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoring, setRestoring] = useState(false);
  const [selectedReward, setSelectedReward] = useState<{ reward: StampBookReward; projectName: string } | null>(null);
  const [redeemPopup, setRedeemPopup] = useState<{ label: string } | null>(null);

  // Maps redeem_code → label for rewards that were unredeemed on last render
  const prevUnredeemedRef = useRef<Map<string, string>>(new Map());
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const local = getLocalParticipant();
    // 読み取りには復元コードが必要。コードを持たない旧端末は復元/再登録へ誘導する。
    if (local && local.recovery_code) {
      setParticipant(local);
      loadData(local.recovery_code);
    } else {
      setParticipant(null);
      setLoading(false);
    }
  }, []);

  // Track unredeemed rewards to detect redemption
  useEffect(() => {
    const map = new Map<string, string>();
    for (const g of groups) {
      for (const r of g.rewards) {
        if (!r.redeemed_at) map.set(r.redeem_code, r.label);
      }
    }
    prevUnredeemedRef.current = map;
  }, [groups]);

  // 3-second polling to detect when a reward gets redeemed
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
          // Close the QR modal if it's displaying the redeemed reward, then show popup on top
          setSelectedReward(current => current?.reward.redeem_code === redeemCode ? null : current);
          setRedeemPopup({ label });
          if (popupTimerRef.current) clearTimeout(popupTimerRef.current);
          popupTimerRef.current = setTimeout(() => setRedeemPopup(null), 3500);
        }

        setGroups(data);

        // Stop polling when no unredeemed rewards remain
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

  async function handleRestore(e: { preventDefault: () => void }) {
    e.preventDefault();
    setRestoring(true);
    setRestoreError('');
    try {
      const res = await fetch('/api/participants/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: restoreCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRestoreError(data.error || '復元に失敗しました');
        setRestoring(false);
        return;
      }
      setLocalParticipant({ participant_id: data.id, nickname: data.nickname, recovery_code: data.recovery_code });
      window.location.reload();
    } catch {
      setRestoreError('通信エラーが発生しました');
      setRestoring(false);
    }
  }

  function handleQRScan(token: string) {
    setShowScanner(false);
    router.push(`/event/${token}/stamp`);
  }

  const totalStamps = groups.reduce((sum, g) => sum + g.count, 0);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-screen-bg">
        <div className="w-[54px] h-[54px] rounded-full border-[3px] border-line border-t-accent animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-screen-bg">
        {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}
        <div className="text-center max-w-sm w-full">
          <div className="stamp-face w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-5 text-accent-deep">
            <Music size={26} strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-ink mb-2">TICKETS</h1>
          <p className="text-muted text-[14px] mb-7 leading-relaxed">
            スタンプを取得するとここに記録されます。<br />
            まずは会場のQRコードを読み取ってください。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowScanner(true)}
              className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
            >
              QRを読み取る
            </button>
            <Link
              href="/"
              className="block w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium text-center hover:border-accent hover:text-accent transition-colors"
            >
              トップへ戻る
            </Link>
          </div>

          {/* Restore by recovery code */}
          <form onSubmit={handleRestore} className="mt-6 bg-white rounded-2xl p-4 border border-line card-shadow text-left">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={15} strokeWidth={2} className="text-accent" />
              <span className="font-bold text-ink text-[13px]">復元コードで復元</span>
            </div>
            <p className="text-[11px] text-muted mb-2">以前の端末で控えた復元コードを入力すると、スタンプ帳を引き継げます。</p>
            <div className="flex gap-2">
              <input
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value.toUpperCase())}
                placeholder="例: ABCD-EFGH-JKLM"
                className="flex-1 px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white tracking-widest"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="submit"
                disabled={restoring || !restoreCode}
                className="px-4 rounded-xl btn-brand text-white font-bold text-[13px] disabled:opacity-50 disabled:shadow-none"
              >
                {restoring ? '...' : '復元'}
              </button>
            </div>
            {restoreError && <p className="text-danger text-[12px] mt-2">{restoreError}</p>}
          </form>
        </div>
      </main>
    );
  }

  const initial = participant.nickname.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-screen-bg">
      {showScanner && <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />}

      {/* Redeem completion popup */}
      {redeemPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setRedeemPopup(null)}
        >
          <div className="bg-white rounded-2xl px-8 py-10 mx-6 flex flex-col items-center gap-4 shadow-xl text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={40} strokeWidth={2.5} className="text-green-600" />
            </div>
            <p className="text-[26px] font-bold text-ink">受取完了！</p>
            <p className="text-[15px] text-muted">「{redeemPopup.label}」</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="header-grad sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            {/* Nickname area → profile */}
            <button onClick={() => router.push('/profile')} className="flex items-center gap-3 text-left group">
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-white font-bold text-[15px]">{initial}</span>
              </div>
              <div>
                <h1 className="font-bold text-white text-[17px] leading-tight flex items-center gap-1">
                  {participant.nickname} さん
                  <ChevronRight size={15} strokeWidth={2.5} className="text-white/60 group-hover:text-white transition-colors" />
                </h1>
                <p className="text-white/70 text-[10px]">タップでユーザー情報・復元コード</p>
              </div>
            </button>
            <div className="text-right">
              <p className="text-white/60 text-[11px]">獲得スタンプ</p>
              <p className="text-white text-[24px] font-bold leading-tight">{totalStamps}</p>
            </div>
          </div>
          <div className="relative">
            <div className="border-t-2 border-dashed border-white/20" />
            <div className="absolute -left-4 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: '#F1F8F7' }} />
            <div className="absolute -right-4 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: '#F1F8F7' }} />
          </div>
          <div className="flex items-center justify-center gap-1 py-2">
            <Ticket size={12} strokeWidth={2} className="text-white/40" />
            <span className="text-white/40 text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>
              STAMP RALLY
            </span>
            <Ticket size={12} strokeWidth={2} className="text-white/40" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5">
        {groups.length === 0 ? (
          <div className="text-center py-10 text-muted">
            <p className="text-[14px]">まだスタンプがありません</p>
            <p className="text-[12px] text-faint mt-1">会場のQRを読み取って獲得しましょう</p>
          </div>
        ) : (
          groups.map((g) => (
            <ProjectSection
              key={g.project.id}
              group={g}
              onShowReward={(reward) => setSelectedReward({ reward, projectName: g.project.name })}
            />
          ))
        )}

        <button
          onClick={() => setShowScanner(true)}
          className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
        >
          QRを読み取ってスタンプ獲得
        </button>
      </div>

      {selectedReward && (
        <RewardTicketModal
          reward={selectedReward.reward}
          nickname={participant.nickname}
          projectName={selectedReward.projectName}
          onClose={() => setSelectedReward(null)}
        />
      )}
    </main>
  );
}

function ProjectSection({ group, onShowReward }: { group: StampBookGroup; onShowReward: (r: StampBookReward) => void }) {
  const { project, count, tiers, rewards, stamps } = group;
  const nextTier = tiers.find((t) => !t.earned);
  const progress = nextTier ? Math.min((count / nextTier.threshold) * 100, 100) : 100;

  return (
    <section className="bg-white rounded-2xl border border-line card-shadow overflow-hidden">
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink text-[15px] truncate">{project.name}</h2>
          <span className="shrink-0 ml-2 text-[12px] font-bold text-accent">{count} 個</span>
        </div>

        {/* Reward progress */}
        {tiers.length > 0 && (
          <div className="mt-3 bg-grad-soft border border-teal-border rounded-xl p-3">
            {nextTier ? (
              <>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-muted">あと <span className="font-bold text-accent-deep">{nextTier.threshold - count}</span> 個で「{nextTier.label}」</span>
                  <span className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{count}/{nextTier.threshold}</span>
                </div>
                <div className="h-2 rounded-full bg-track overflow-hidden">
                  <div className="h-full progress-grad rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
                </div>
              </>
            ) : (
              <p className="text-[12px] text-accent font-medium text-center">全ての特典を達成しました！</p>
            )}
          </div>
        )}

        {/* Earned reward tickets (tap to show QR) */}
        {rewards.length > 0 && (
          <div className="mt-3 space-y-2">
            {rewards.map((r, i) => (
              <button
                key={i}
                onClick={() => onShowReward(r)}
                className="w-full flex items-center gap-2 bg-accent/5 border border-accent/30 rounded-xl px-3 py-2.5 text-left hover:bg-accent/10 transition-colors"
              >
                <Gift size={16} strokeWidth={2} className="text-accent-deep shrink-0" />
                <span className="text-[13px] font-bold text-accent-deep flex-1">特典: {r.label}</span>
                {r.redeemed_at ? (
                  <span className="text-[10px] text-danger font-medium">引換済</span>
                ) : (
                  <span className="text-[11px] text-accent font-medium flex items-center gap-0.5">表示 <ChevronRight size={12} strokeWidth={2.5} /></span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stamps in this project */}
      <div className="p-4 space-y-2.5">
        {stamps.map((s) => (
          <StampCard key={s.id} event={s.event!} stamp={s} />
        ))}
      </div>
    </section>
  );
}
