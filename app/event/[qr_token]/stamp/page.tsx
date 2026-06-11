'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
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
      // Create participant
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {step === 'loading' || step === 'stamping' ? (
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-pink-400 border-t-transparent animate-spin" />
          <p className="text-gray-500">{step === 'loading' ? '読み込み中...' : 'スタンプ取得中...'}</p>
        </div>
      ) : step === 'register' ? (
        <NicknameForm onSubmit={handleNicknameSubmit} />
      ) : step === 'done' && event ? (
        <StampAcquired event={event} stampedAt={stampedAt} nickname={nickname} />
      ) : step === 'already' && event ? (
        <div className="w-full max-w-sm mx-auto text-center">
          <div className="text-5xl mb-4">✅</div>
          <div className="bg-white rounded-3xl p-6 border-2 border-purple-200 shadow-lg mb-6">
            <h2 className="text-xl font-bold text-purple-600 mb-2">
              取得済みです
            </h2>
            <p className="text-gray-600 text-sm mb-4">
              このライブのスタンプは取得済みです
            </p>
            <div className="bg-purple-50 rounded-xl p-3 space-y-1">
              <p className="font-bold text-gray-800">{event.title}</p>
              {stampedAt && (
                <p className="text-xs text-purple-500 font-medium">
                  取得日時: {new Date(stampedAt).toLocaleString('ja-JP', {
                    year: 'numeric', month: 'numeric', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => router.push('/stamp-book')}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold text-lg shadow-lg"
          >
            スタンプ帳を見る 📖
          </button>
        </div>
      ) : (
        <div className="text-center">
          <div className="text-5xl mb-4">😢</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold"
          >
            トップへ戻る
          </button>
        </div>
      )}
    </main>
  );
}
