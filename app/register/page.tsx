'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { setLocalParticipant } from '@/lib/storage';
import NicknameForm from '@/components/NicknameForm';
import LineLoginButton from '@/components/LineLoginButton';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(nick: string, gender: string, age: string) {
    setError('');
    const ageNum = /^\d+$/.test(age) ? parseInt(age, 10) : undefined;
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick, gender, age: ageNum }),
      });
      if (!res.ok) throw new Error('登録に失敗しました');
      const participant = await res.json();
      setLocalParticipant({
        participant_id: participant.id,
        nickname: nick,
        recovery_code: participant.recovery_code,
        gender,
        age: ageNum,
        // 移行期間中は age_group（文字列形）も併記して旧リーダーとの互換を保つ
        age_group: ageNum !== undefined ? String(ageNum) : undefined,
      });
      router.push('/stamp-book');
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-screen-bg">
      <div className="w-full max-w-sm">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-[13px] text-muted hover:text-accent transition-colors mb-6"
        >
          <ArrowLeft size={15} strokeWidth={2} />
          戻る
        </button>
        <NicknameForm onSubmit={handleSubmit} />
        {error && (
          <p className="text-danger text-[13px] text-center mt-3">{error}</p>
        )}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 border-t border-line" />
          <span className="text-[11px] text-faint">または</span>
          <div className="flex-1 border-t border-line" />
        </div>
        <LineLoginButton returnTo="/stamp-book" label="LINEで登録・引き継ぎ" />
      </div>
    </main>
  );
}
