'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

const DECADE_OPTIONS = ['10代', '20代', '30代', '40代', '50代以上'] as const;
type Decade = typeof DECADE_OPTIONS[number];

interface NicknameFormProps {
  onSubmit: (nickname: string, birthDecade: string) => void;
  loading?: boolean;
}

export default function NicknameForm({ onSubmit, loading }: NicknameFormProps) {
  const [nickname, setNickname] = useState('');
  const [birthDecade, setBirthDecade] = useState<Decade | ''>('');

  const canSubmit = nickname.trim() && birthDecade && !loading;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-full bg-brand-soft border border-brand-border flex items-center justify-center mx-auto mb-4 text-brand-deep">
          <User size={24} strokeWidth={2} />
        </div>
        <h2 className="text-[20px] font-bold text-ink mb-2">ニックネームを登録</h2>
        <p className="text-subtle text-sm">スタンプ帳に表示される名前を入力してください</p>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) onSubmit(nickname.trim(), birthDecade);
        }}
        className="space-y-5"
      >
        <div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例：ライブ大好き太郎"
            maxLength={20}
            className="w-full px-4 py-3.5 rounded-xl border border-rule focus:border-brand focus:outline-none text-center text-base font-medium bg-white"
            required
            autoFocus
          />
          <p className="text-xs text-faint text-right mt-1">{nickname.length}/20</p>
        </div>

        <div>
          <p className="text-sm font-medium text-ink mb-2">年代を選んでください</p>
          <div className="grid grid-cols-5 gap-1.5">
            {DECADE_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setBirthDecade(d)}
                className={`py-2.5 rounded-xl border text-sm font-bold transition-colors ${
                  birthDecade === d
                    ? 'bg-brand border-brand text-white'
                    : 'bg-white border-rule text-subtle hover:border-brand hover:text-brand'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3.5 rounded-xl btn-brand text-white font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? '登録中...' : 'スタンプ帳を作成する'}
        </button>
      </form>
    </div>
  );
}
