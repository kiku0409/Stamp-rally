'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Check, AlertCircle, KeyRound } from 'lucide-react';
import { Event } from '@/types';
import { getLocalParticipant, setLocalParticipant } from '@/lib/storage';
import NicknameForm from '@/components/NicknameForm';
import StampAcquired from '@/components/StampAcquired';

type Step = 'loading' | 'register' | 'stamping' | 'done' | 'already' | 'error';

interface StampPageProps {
  params: Promise<{ qr_token: string }>;
}

function Barcode() {
  return (
    <div
      className="h-[28px] w-full rounded opacity-70 mt-1"
      style={{
        background:
          'repeating-linear-gradient(90deg,#17302E 0,#17302E 2px,transparent 2px,transparent 4px,#17302E 4px,#17302E 5px,transparent 5px,transparent 8px)',
      }}
    />
  );
}

function Perforation({ bgColor = '#F1F8F7' }: { bgColor?: string }) {
  return (
    <div className="relative my-4">
      <div className="border-t-2 border-dashed border-teal-border" />
      <div className="absolute -left-5 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: bgColor }} />
      <div className="absolute -right-5 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: bgColor }} />
    </div>
  );
}

function formatStampDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StampPage({ params }: StampPageProps) {
  const { qr_token } = use(params);
  const router = useRouter();

  const [step, setStep] = useState<Step>('loading');
  const [event, setEvent] = useState<Event | null>(null);
  const [stampedAt, setStampedAt] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [newRewards, setNewRewards] = useState<{ label: string }[]>([]);
  const [showRestore, setShowRestore] = useState(false);
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    const local = getLocalParticipant();
    if (local) {
      setNickname(local.nickname);
      acquireStamp(local.participant_id);
    } else {
      setStep('register');
    }
  }, [qr_token]);

  // Acquire stamp using qr_token; event data is returned in the response
  // so no separate event fetch is needed.
  async function acquireStamp(participantId: string) {
    setStep('stamping');
    try {
      const res = await fetch('/api/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participantId, qr_token }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'スタンプ取得に失敗しました');
        setStep('error');
        return;
      }
      if (data.event) setEvent(data.event as Event);
      if (data.alreadyStamped) {
        if (data.stamp?.stamped_at) setStampedAt(data.stamp.stamped_at);
        setStep('already');
      } else {
        setStampedAt(data.stamp.stamped_at);
        setNewRewards(Array.isArray(data.newRewards) ? data.newRewards : []);
        setStep('done');
      }
    } catch {
      setError('スタンプ取得に失敗しました');
      setStep('error');
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
      setNickname(data.nickname);
      await acquireStamp(data.id);
    } catch {
      setRestoreError('通信エラーが発生しました');
      setRestoring(false);
    }
  }

  async function handleNicknameSubmit(nick: string, gender: string, ageGroup: string) {
    setStep('stamping');
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick, gender, age_group: ageGroup }),
      });
      if (!res.ok) throw new Error('参加者登録に失敗しました');
      const participant = await res.json();
      setLocalParticipant({ participant_id: participant.id, nickname: nick, recovery_code: participant.recovery_code, gender, age_group: ageGroup });
      setNickname(nick);
      await acquireStamp(participant.id);
    } catch (e) {
      setError((e as Error).message);
      setStep('error');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-screen-bg">
      {/* Loading / Stamping */}
      {(step === 'loading' || step === 'stamping') && (
        <div className="text-center">
          <div className="w-[54px] h-[54px] mx-auto mb-4 rounded-full border-[3px] border-line border-t-accent animate-spin" />
          <p className="text-muted text-[14px]">スタンプ取得中...</p>
        </div>
      )}

      {/* Register nickname */}
      {step === 'register' && (
        <div className="w-full max-w-sm mx-auto">
          <NicknameForm onSubmit={handleNicknameSubmit} />
          <div className="mt-4">
            {!showRestore ? (
              <button
                onClick={() => setShowRestore(true)}
                className="w-full text-[13px] text-muted text-center py-2 hover:text-accent transition-colors"
              >
                すでに登録済みの方はこちら
              </button>
            ) : (
              <form onSubmit={handleRestore} className="bg-white rounded-2xl p-4 border border-line card-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <KeyRound size={15} strokeWidth={2} className="text-accent" />
                  <span className="font-bold text-ink text-[13px]">復元コードで再開</span>
                </div>
                <p className="text-[11px] text-muted mb-3">
                  以前のスタンプを引き継いでスタンプを取得します。
                </p>
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
                    {restoring ? '...' : '再開'}
                  </button>
                </div>
                {restoreError && <p className="text-danger text-[12px] mt-2">{restoreError}</p>}
              </form>
            )}
          </div>
        </div>
      )}

      {/* Stamp acquired */}
      {step === 'done' && event && (
        <div className="w-full max-w-sm mx-auto">
          <StampAcquired event={event} stampedAt={stampedAt} nickname={nickname} />
          {newRewards.length > 0 && (
            <div className="mt-4 bg-accent/5 border border-accent/30 rounded-2xl p-4 text-center">
              <p className="text-[13px] font-bold text-accent-deep mb-1">🎉 特典を獲得しました！</p>
              {newRewards.map((r, i) => (
                <p key={i} className="text-[14px] font-bold text-ink">{r.label}</p>
              ))}
              <p className="text-[11px] text-muted mt-1">スタンプ帳の「TICKETS」で確認できます</p>
            </div>
          )}
        </div>
      )}

      {/* Already stamped */}
      {step === 'already' && event && (
        <div className="w-full max-w-sm mx-auto">
          <div className="bg-white rounded-2xl overflow-hidden card-shadow">
            <div className="h-2 header-grad" />
            <div className="px-5 pt-5 text-center">
              <p
                className="text-[11px] tracking-widest text-muted mb-4"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                USED · <span className="font-bold text-accent">取得済み</span>
              </p>
              {/* Check stamp */}
              <div
                className="stamp-face w-[100px] h-[100px] rounded-full flex items-center justify-center text-accent-deep mx-auto overflow-hidden"
                style={{ transform: 'rotate(-6deg)' }}
              >
                {event.icon_url ? (
                  <img src={event.icon_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Check size={36} strokeWidth={2.5} />
                )}
              </div>
              <h2 className="text-[20px] font-bold text-ink mt-4 mb-1">取得済みです</h2>
              <p className="text-muted text-[13px]">このライブのスタンプは取得済みです</p>
            </div>

            <Perforation />

            <div className="px-5 pb-5">
              <div className="space-y-2 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
                <div className="flex justify-between text-[11px]">
                  <span className="text-faint">EVENT</span>
                  <span className="text-ink font-medium text-right max-w-[65%] truncate">{event.title}</span>
                </div>
                {stampedAt && (
                  <div className="flex justify-between text-[11px]">
                    <span className="text-faint">取得日時</span>
                    <span className="text-ink font-medium">{formatStampDate(stampedAt)}</span>
                  </div>
                )}
              </div>
              <Barcode />
            </div>
          </div>

          <div className="mt-4">
            <button
              onClick={() => router.push('/stamp-book')}
              className="w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px]"
            >
              チケットを見る
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {step === 'error' && (
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-soft border border-teal-border flex items-center justify-center mx-auto mb-4 text-muted">
            <AlertCircle size={28} strokeWidth={2} />
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-2">イベントが見つかりません</h2>
          {error && error !== 'イベントが見つかりません' && (
            <p className="text-muted text-[13px] mb-6">{error}</p>
          )}
          <button
            onClick={() => router.push('/')}
            className="px-8 py-3 rounded-xl btn-brand text-white font-bold text-[14px] mt-6"
          >
            トップへ戻る
          </button>
        </div>
      )}
    </main>
  );
}
