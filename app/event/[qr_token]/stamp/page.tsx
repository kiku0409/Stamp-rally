'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Music } from 'lucide-react';
import { Event } from '@/types';
import { getLocalParticipant, setLocalParticipant } from '@/lib/storage';
import NicknameForm from '@/components/NicknameForm';
import StampAcquired from '@/components/StampAcquired';

type Step = 'loading' | 'register' | 'stamping' | 'done' | 'already' | 'error';

interface StampPageProps {
  params: Promise<{ qr_token: string }>;
}

export default function StampPage({ params }: StampPageProps) {
  const { qr_token } = use(params);
  const router = useRouter();

  const [step, setStep] = useState<Step>('loading');
  const [event, setEvent] = useState<Event | null>(null);
  const [stampedAt, setStampedAt] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');

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
      setLocalParticipant({ participant_id: participant.id, nickname: nick });
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
        setStep('done');
      }
    } catch {
      setError('スタンプ取得に失敗しました');
      setStep('error');
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-page">
      {step === 'loading' || step === 'stamping' ? (
        <div className="text-center">
          <div className="w-[54px] h-[54px] mx-auto mb-4 rounded-full border-[3px] border-rule border-t-brand animate-spin" />
          <p className="text-subtle text-sm">{step === 'loading' ? '読み込み中...' : 'スタンプ取得中...'}</p>
        </div>
      ) : step === 'register' ? (
        <NicknameForm onSubmit={handleNicknameSubmit} />
      ) : step === 'done' && event ? (
        <StampAcquired event={event} stampedAt={stampedAt} nickname={nickname} />
      ) : step === 'already' && event ? (
        <div className="w-full max-w-sm mx-auto text-center">
          <div
            className="w-[120px] h-[120px] rounded-full stamp-acquired flex flex-col items-center justify-center text-brand-deep mx-auto mb-6"
            style={{ transform: 'rotate(-6deg)' }}
          >
            <Music size={34} strokeWidth={2} />
          </div>
          <h2 className="text-[20px] font-bold text-brand-deep mb-2">取得済みです</h2>
          <p className="text-subtle text-sm mb-5">このライブのスタンプは取得済みです</p>
          <div className="bg-brand-soft border border-brand-border rounded-2xl p-4 mb-6 text-left space-y-1">
            <p className="font-bold text-ink text-sm">{event.title}</p>
            {stampedAt && (
              <p className="text-xs text-brand font-medium">
                {new Date(stampedAt).toLocaleString('ja-JP', {
                  year: 'numeric', month: 'numeric', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>
          <button
            onClick={() => router.push('/stamp-book')}
            className="w-full py-3.5 rounded-xl btn-brand text-white font-bold text-base"
          >
            スタンプ帳を見る
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-subtle mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-xl btn-brand text-white font-bold text-sm"
          >
            トップへ戻る
          </button>
        </div>
      )}
    </main>
  );
}
