'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Check, AlertCircle } from 'lucide-react';
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

  useEffect(() => {
    loadEvent();
  }, [qr_token]);

  async function loadEvent() {
    try {
      const res = await fetch(`/api/events/${qr_token}`);
      if (!res.ok) {
        setError('イベントが見つかりません');
        setStep('error');
        return;
      }
      const ev: Event = await res.json();
      setEvent(ev);

      const local = getLocalParticipant();
      if (local) {
        setNickname(local.nickname);
        await acquireStamp(ev.id, local.participant_id);
      } else {
        setStep('register');
      }
    } catch {
      setError('通信エラーが発生しました');
      setStep('error');
    }
  }

  async function handleNicknameSubmit(nick: string) {
    setStep('stamping');
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick }),
      });
      if (!res.ok) throw new Error('参加者登録に失敗しました');
      const participant = await res.json();
      setLocalParticipant({ participant_id: participant.id, nickname: nick, recovery_code: participant.recovery_code });
      setNickname(nick);
      await acquireStamp(event!.id, participant.id);
    } catch (e) {
      setError((e as Error).message);
      setStep('error');
    }
  }

  async function acquireStamp(eventId: string, participantId: string) {
    setStep('stamping');
    try {
      const res = await fetch('/api/stamps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participantId, event_id: eventId }),
      });
      const data = await res.json();
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-screen-bg">
      {/* Loading / Stamping */}
      {(step === 'loading' || step === 'stamping') && (
        <div className="text-center">
          <div className="w-[54px] h-[54px] mx-auto mb-4 rounded-full border-[3px] border-line border-t-accent animate-spin" />
          <p className="text-muted text-[14px]">
            {step === 'loading' ? '読み込み中...' : 'スタンプ取得中...'}
          </p>
        </div>
      )}

      {/* Register nickname */}
      {step === 'register' && (
        <NicknameForm onSubmit={handleNicknameSubmit} />
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
                className="stamp-face w-[100px] h-[100px] rounded-full flex items-center justify-center text-accent-deep mx-auto"
                style={{ transform: 'rotate(-6deg)' }}
              >
                <Check size={36} strokeWidth={2.5} />
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
