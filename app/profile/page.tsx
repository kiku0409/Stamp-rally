'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, KeyRound, User, Pencil, Check, X } from 'lucide-react';
import { getLocalParticipant, setLocalParticipant, clearLocalParticipant } from '@/lib/storage';
import { formatGrouped } from '@/lib/code';
import { LocalParticipant } from '@/types';

export default function ProfilePage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<LocalParticipant | null>(null);
  const [ready, setReady] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const local = getLocalParticipant();
    if (!local) {
      router.replace('/stamp-book');
      return;
    }
    setParticipant(local);
    setReady(true);
  }, [router]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() {
    if (!participant) return;
    setNicknameInput(participant.nickname);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveNickname() {
    if (!participant || !nicknameInput.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ participant_id: participant.participant_id, nickname: nicknameInput.trim() }),
      });
      const updated = { ...participant, nickname: nicknameInput.trim() };
      setLocalParticipant(updated);
      setParticipant(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

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
        {/* Nickname */}
        <div className="bg-white rounded-2xl p-5 border border-line card-shadow">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-soft border border-teal-border flex items-center justify-center text-accent-deep flex-shrink-0">
              <User size={22} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-muted mb-0.5">ニックネーム</p>
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    value={nicknameInput}
                    onChange={e => setNicknameInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') saveNickname(); if (e.key === 'Escape') cancelEdit(); }}
                    maxLength={20}
                    className="flex-1 text-[18px] font-bold text-ink border-b-2 border-accent outline-none bg-transparent"
                  />
                  <button onClick={saveNickname} disabled={saving || !nicknameInput.trim()} className="text-accent-deep disabled:opacity-40">
                    <Check size={20} strokeWidth={2.5} />
                  </button>
                  <button onClick={cancelEdit} className="text-muted">
                    <X size={20} strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-[18px] font-bold text-ink">{participant.nickname}</p>
                  <button onClick={startEdit} className="text-muted hover:text-accent-deep transition-colors">
                    <Pencil size={14} strokeWidth={2} />
                  </button>
                </div>
              )}
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

        {/* Reset */}
        <div className="bg-white rounded-2xl p-5 border border-line card-shadow">
          <p className="text-[12px] text-muted mb-3">
            この端末から参加者情報を消去します。復元コードを控えていれば、別の端末や再登録時に復元できます。
          </p>
          <button
            onClick={() => {
              if (confirm('参加者情報をリセットしますか？\n復元コードを控えていれば、別の端末や再登録時に復元できます。')) {
                clearLocalParticipant();
                window.location.href = '/';
              }
            }}
            className="w-full py-3 rounded-xl border border-danger-border text-danger text-[14px] font-medium hover:bg-danger-soft transition-colors"
          >
            端末の参加者情報をリセット
          </button>
        </div>
      </div>
    </main>
  );
}
