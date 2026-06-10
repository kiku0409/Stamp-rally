'use client';

import { useState } from 'react';

interface NicknameFormProps {
  onSubmit: (nickname: string) => void;
  loading?: boolean;
}

export default function NicknameForm({ onSubmit, loading }: NicknameFormProps) {
  const [nickname, setNickname] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nickname.trim()) {
      onSubmit(nickname.trim());
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">👤</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ニックネームを登録
        </h2>
        <p className="text-gray-500 text-sm">
          スタンプ帳に表示される名前を入力してください
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="例：ライブ大好き太郎"
            maxLength={20}
            className="w-full px-4 py-4 rounded-2xl border-2 border-pink-200 focus:border-pink-400 focus:outline-none text-center text-lg font-medium bg-white shadow-sm"
            required
            autoFocus
          />
          <p className="text-xs text-gray-400 text-right mt-1">
            {nickname.length}/20
          </p>
        </div>
        <button
          type="submit"
          disabled={!nickname.trim() || loading}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold text-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          {loading ? '登録中...' : 'スタンプ帳を作成する 🎉'}
        </button>
      </form>
    </div>
  );
}
