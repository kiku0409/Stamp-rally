'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music, Ticket, KeyRound } from 'lucide-react';
import { EventStamp, LocalParticipant } from '@/types';
import { getLocalParticipant, setLocalParticipant, clearLocalParticipant } from '@/lib/storage';
import { formatGrouped } from '@/lib/code';
import StampCard from '@/components/StampCard';
import AchievementBadge from '@/components/AchievementBadge';
import QRScanner from '@/components/QRScanner';

export default function StampBookPage() {
  const router = useRouter();
  const [stamps, setStamps] = useState<EventStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<LocalParticipant | null>(null);
  const [showScanner, setShowScanner] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const local = getLocalParticipant();
    setParticipant(local);
    if (local) {
      loadData(local.participant_id);
    } else {
      setLoading(false);
    }
  }, []);

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

  async function loadData(participantId: string) {
    try {
      const res = await fetch(`/api/stamps?participant_id=${participantId}`);
      const data = await res.json();
      setStamps(Array.isArray(data) ? data : []);
    } catch {
      // silently handle error
    } finally {
      setLoading(false);
    }
  }

  function handleQRScan(token: string) {
    setShowScanner(false);
    router.push(`/event/${token}/stamp`);
  }

  // 取得済みスタンプ（各stampにeventが埋め込まれている）を新しい順に表示
  const collectedStamps = stamps.filter((s) => s.event);
  const stampCount = stamps.length;

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
        {showScanner && (
          <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
        )}
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
      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Header */}
      <div className="header-grad sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-white font-bold text-[15px]">{initial}</span>
              </div>
              <div>
                <h1 className="font-bold text-white text-[17px] leading-tight">TICKETS</h1>
                <p className="text-white/70 text-[12px]">{participant.nickname} さん</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[11px]">獲得スタンプ</p>
              <p className="text-white text-[24px] font-bold leading-tight">{stampCount}</p>
            </div>
          </div>
          {/* Perforation */}
          <div className="relative">
            <div className="border-t-2 border-dashed border-white/20" />
            <div
              className="absolute -left-4 -top-[11px] w-[22px] h-[22px] rounded-full"
              style={{ backgroundColor: '#F1F8F7' }}
            />
            <div
              className="absolute -right-4 -top-[11px] w-[22px] h-[22px] rounded-full"
              style={{ backgroundColor: '#F1F8F7' }}
            />
          </div>
          {/* Ticket icon strip */}
          <div className="flex items-center justify-center gap-1 py-2">
            <Ticket size={12} strokeWidth={2} className="text-white/40" />
            <span
              className="text-white/40 text-[10px] tracking-widest"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              STAMP RALLY
            </span>
            <Ticket size={12} strokeWidth={2} className="text-white/40" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <AchievementBadge stampCount={stampCount} />

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-line card-shadow text-center">
            <p className="text-[12px] text-muted mb-1">総参加回数</p>
            <p className="text-[26px] font-bold text-ink">{stampCount}</p>
            <p className="text-[11px] text-faint">回</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-line card-shadow text-center">
            <p className="text-[12px] text-muted mb-1">獲得スタンプ数</p>
            <p className="text-[26px] font-bold text-ink">{stampCount}</p>
            <p className="text-[11px] text-faint">個</p>
          </div>
        </div>

        <div>
          <h2 className="text-[14px] font-bold text-ink mb-3">取得したチケット</h2>
          {collectedStamps.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <p className="text-[14px]">まだスタンプがありません</p>
              <p className="text-[12px] text-faint mt-1">会場のQRを読み取って獲得しましょう</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {collectedStamps.map((s) => (
                <StampCard key={s.id} event={s.event!} stamp={s} />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowScanner(true)}
          className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
        >
          QRを読み取ってスタンプ獲得
        </button>

        {/* Recovery code */}
        {participant.recovery_code && (
          <div className="bg-grad-soft border border-teal-border rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <KeyRound size={15} strokeWidth={2} className="text-accent-deep" />
              <span className="font-bold text-ink text-[13px]">復元コード</span>
            </div>
            <p className="text-[11px] text-muted mb-2">
              端末を変えたり情報をリセットしても、このコードでスタンプ帳を復元できます。控えておいてください。
            </p>
            <p className="text-[20px] font-bold text-accent-deep tracking-[0.2em]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatGrouped(participant.recovery_code)}
            </p>
          </div>
        )}

        <div className="pt-2 border-t border-line">
          <button
            onClick={() => {
              if (confirm('参加者情報をリセットしますか？\n復元コードを控えていれば、別の端末や再登録時に復元できます。')) {
                clearLocalParticipant();
                window.location.href = '/';
              }
            }}
            className="w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors"
          >
            端末の参加者情報をリセット
          </button>
        </div>
      </div>
    </main>
  );
}
