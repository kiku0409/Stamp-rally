'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, KeyRound, LogOut } from 'lucide-react';
import { getLocalParticipant, clearLocalParticipant } from '@/lib/storage';
import { formatGrouped } from '@/lib/code';
import { LocalParticipant } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<LocalParticipant | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const local = getLocalParticipant();
    if (!local) {
      router.replace('/stamp-book');
      return;
    }
    setParticipant(local);
    setReady(true);
  }, [router]);

  if (!ready || !participant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-screen-bg">
        <div className="w-[54px] h-[54px] rounded-full border-[3px] border-line border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-screen-bg">
      <div className="header-grad sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => router.push('/stamp-book')} className="text-white/80 hover:text-white transition-colors">
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
          <h1 className="font-bold text-white text-[16px]">ユーザー情報</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Gender / Age */}
        <div className="bg-white rounded-2xl p-5 border border-line card-shadow">
          <p className="text-[12px] text-muted font-medium mb-4">基本情報</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11px] text-faint mb-1">性別</p>
              <p className="text-[16px] font-bold text-ink">{participant.gender || '未設定'}</p>
            </div>
            <div>
              <p className="text-[11px] text-faint mb-1">年代</p>
              <p className="text-[16px] font-bold text-ink">{participant.age_group || '未設定'}</p>
            </div>
          </div>
        </div>

        {/* Recovery code */}
        {participant.recovery_code && (
          <div className="bg-grad-soft border border-teal-border rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-1.5">
              <KeyRound size={16} strokeWidth={2} className="text-accent-deep" />
              <span className="font-bold text-ink text-[14px]">復元コード</span>
            </div>
            <p className="text-[12px] text-muted mb-3 leading-relaxed">
              端末を変えたり情報をリセットしても、このコードでスタンプ帳を復元できます。スクリーンショットなどで控えておいてください。
            </p>
            <p className="text-[22px] font-bold text-accent-deep tracking-[0.25em]" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatGrouped(participant.recovery_code)}
            </p>
          </div>
        )}

        {/* Logout */}
        <div className="bg-white rounded-2xl p-5 border border-line card-shadow">
          <p className="text-[12px] text-muted mb-1 leading-relaxed">
            この端末からログアウトします。復元コードを控えておけば、次回も同じスタンプ帳を使えます。
          </p>
          <p className="text-[11px] text-faint mb-4">
            ※ ログアウト後は復元コードの入力、またはQRコードの読み取りで再ログインできます。
          </p>
          <button
            onClick={() => {
              if (confirm('ログアウトしますか？\n復元コードを控えておくと、次回も同じスタンプ帳を使えます。')) {
                clearLocalParticipant();
                router.replace('/stamp-book');
              }
            }}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-danger-border text-danger text-[14px] font-medium hover:bg-danger-soft transition-colors"
          >
            <LogOut size={16} strokeWidth={2} />
            ログアウト
          </button>
        </div>
      </div>
    </main>
  );
}
