'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { setLocalParticipant } from '@/lib/storage';
import NicknameForm from '@/components/NicknameForm';

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  async function handleSubmit(nick: string, gender: string, ageGroup: string) {
    setError('');
    try {
      const res = await fetch('/api/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: nick, gender, age_group: ageGroup }),
      });
      if (!res.ok) throw new Error('登録に失敗しました');
      const participant = await res.json();
      setLocalParticipant({
        participant_id: participant.id,
        nickname: nick,
        recovery_code: participant.recovery_code,
        gender,
        age_group: ageGroup,
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
      </div>
    </main>
  );
}
