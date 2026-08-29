'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, ArrowLeftRight } from 'lucide-react';
import { getLocalParticipant, setLocalParticipant } from '@/lib/storage';
import { LocalParticipant } from '@/types';
import NicknameForm from '@/components/NicknameForm';

type Step = 'loading' | 'register' | 'conflict' | 'error';

interface ApiParticipant {
  id: string;
  nickname: string;
  recovery_code: string;
  gender: string | null;
  age: number | null;       // 実年齢（整数）。新形式
  age_group: string | null; // [DEPRECATED] 旧形式。表示フォールバック用
}

function toLocalParticipant(p: ApiParticipant): LocalParticipant {
  return {
    participant_id: p.id,
    nickname: p.nickname,
    recovery_code: p.recovery_code,
    gender: p.gender ?? undefined,
    age: p.age ?? undefined,
    age_group: p.age_group ?? undefined,
    line_linked: true,
  };
}

function LineCompleteInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawReturnTo = searchParams.get('returnTo');
  const returnTo =
    rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
      ? rawReturnTo
      : '/stamp-book';

  const [step, setStep] = useState<Step>('loading');
  const [error, setError] = useState('');
  const [suggestedNickname, setSuggestedNickname] = useState('');
  const [conflictParticipant, setConflictParticipant] = useState<LocalParticipant | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requested = useRef(false);

  async function callComplete(body: Record<string, string | number | undefined>) {
    const res = await fetch('/api/auth/line/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'LINE連携に失敗しました');
    return data;
  }

  function finish(participant: ApiParticipant) {
    setLocalParticipant(toLocalParticipant(participant));
    router.replace(returnTo);
  }

  useEffect(() => {
    if (requested.current) return; // StrictMode等での二重実行防止
    requested.current = true;
    (async () => {
      try {
        const local = getLocalParticipant();
        const data = await callComplete({ participant_id: local?.participant_id });
        if (data.status === 'new') {
          setSuggestedNickname(data.suggested_nickname ?? '');
          setStep('register');
        } else if (data.status === 'conflict') {
          setConflictParticipant(toLocalParticipant(data.participant));
          setStep('conflict');
        } else {
          // linked / restored
          finish(data.participant);
        }
      } catch (e) {
        setError((e as Error).message);
        setStep('error');
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleRegister(nick: string, gender: string, age: string) {
    setSubmitting(true);
    try {
      // NicknameForm は数値文字列で返す。API側で age(INTEGER)/age_group(TEXT) に二重書き込みされる
      const ageNum = /^\d+$/.test(age) ? parseInt(age, 10) : undefined;
      const data = await callComplete({ nickname: nick, gender, age: ageNum });
      if (!data.participant) throw new Error('LINE連携に失敗しました');
      finish(data.participant);
    } catch (e) {
      setError((e as Error).message);
      setStep('error');
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-screen-bg">
      {step === 'loading' && (
        <div className="text-center">
          <div className="w-[54px] h-[54px] mx-auto mb-4 rounded-full border-[3px] border-line border-t-accent animate-spin" />
          <p className="text-muted text-[14px]">LINE連携中...</p>
        </div>
      )}

      {step === 'register' && (
        <div className="w-full max-w-sm mx-auto">
          <NicknameForm onSubmit={handleRegister} loading={submitting} defaultNickname={suggestedNickname} />
        </div>
      )}

      {step === 'conflict' && conflictParticipant && (
        <div className="w-full max-w-sm mx-auto bg-white rounded-2xl p-5 border border-line card-shadow text-center">
          <div className="w-14 h-14 rounded-full bg-soft border border-teal-border flex items-center justify-center mx-auto mb-4 text-accent-deep">
            <ArrowLeftRight size={24} strokeWidth={2} />
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-2">別のスタンプ帳と連携済みです</h2>
          <p className="text-muted text-[13px] mb-1 leading-relaxed">
            このLINEアカウントはスタンプ帳
            「<span className="font-bold text-ink">{conflictParticipant.nickname}</span>」
            と連携されています。
          </p>
          <p className="text-[11px] text-faint mb-5 leading-relaxed">
            切り替えても、今のスタンプ帳には復元コードで戻れます。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setLocalParticipant(conflictParticipant);
                router.replace(returnTo);
              }}
              className="w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px]"
            >
              そのスタンプ帳に切り替える
            </button>
            <button
              onClick={() => router.replace(returnTo)}
              className="w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors"
            >
              今のスタンプ帳のまま続ける
            </button>
          </div>
        </div>
      )}

      {step === 'error' && (
        <div className="text-center max-w-xs">
          <div className="w-16 h-16 rounded-full bg-soft border border-teal-border flex items-center justify-center mx-auto mb-4 text-muted">
            <AlertCircle size={28} strokeWidth={2} />
          </div>
          <h2 className="text-[18px] font-bold text-ink mb-2">LINE連携に失敗しました</h2>
          {error && <p className="text-muted text-[13px] mb-6">{error}</p>}
          <button
            onClick={() => router.replace(returnTo)}
            className="px-8 py-3 rounded-xl btn-brand text-white font-bold text-[14px]"
          >
            戻る
          </button>
        </div>
      )}
    </main>
  );
}

export default function LineCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-screen-bg">
          <div className="w-[54px] h-[54px] rounded-full border-[3px] border-line border-t-accent animate-spin" />
        </main>
      }
    >
      <LineCompleteInner />
    </Suspense>
  );
}
