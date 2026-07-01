'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, KeyRound, User, Pencil, Check, X, LogOut } from 'lucide-react';
import { getLocalParticipant, setLocalParticipant, clearLocalParticipant, getActiveThemeId } from '@/lib/storage';
import { formatGrouped } from '@/lib/code';
import { LocalParticipant } from '@/types';
import { getTheme, headerGradient } from '@/lib/themes';

const GENDERS = ['男性', '女性', 'その他'];

const selectClass =
  'w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white appearance-none';

export default function ProfilePage() {
  const router = useRouter();
  const [participant, setParticipant] = useState<LocalParticipant | null>(null);
  const [ready, setReady] = useState(false);
  const [theme] = useState(() => getTheme(getActiveThemeId() ?? undefined));
  const [editing, setEditing] = useState(false);
  const [nicknameInput, setNicknameInput] = useState('');
  const [genderInput, setGenderInput] = useState('');
  const [ageGroupInput, setAgeGroupInput] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const ageNum = parseInt(ageGroupInput, 10);
  const ageValid = ageGroupInput === '' || (!isNaN(ageNum) && ageNum >= 1 && ageNum <= 120);

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
    setGenderInput(participant.gender ?? '');
    setAgeGroupInput(participant.age_group ?? '');
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
  }

  async function saveProfile() {
    if (!participant || !nicknameInput.trim()) return;
    setSaving(true);
    try {
      await fetch('/api/participants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          participant_id: participant.participant_id,
          nickname: nicknameInput.trim(),
          gender: genderInput || undefined,
          age_group: ageGroupInput || undefined,
        }),
      });
      const updated: LocalParticipant = {
        ...participant,
        nickname: nicknameInput.trim(),
        gender: genderInput || undefined,
        age_group: ageGroupInput || undefined,
      };
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
      <div className="sticky top-0 z-10" style={{ background: headerGradient(theme) }}>
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-2">
          <button onClick={() => router.push('/stamp-book')} className="text-white/80 hover:text-white transition-colors">
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
          <h1 className="font-bold text-white text-[16px]">ユーザー情報</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* User info card */}
        <div className="bg-white rounded-2xl p-5 border border-line card-shadow">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-soft border border-teal-border flex items-center justify-center text-accent-deep flex-shrink-0 mt-0.5">
              <User size={22} strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-muted mb-1">ニックネーム</p>
                    <input
                      ref={inputRef}
                      value={nicknameInput}
                      onChange={e => setNicknameInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Escape') cancelEdit(); }}
                      maxLength={20}
                      className="w-full text-[16px] font-bold text-ink border-b-2 border-accent outline-none bg-transparent pb-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[11px] text-muted mb-1">性別</p>
                      <select value={genderInput} onChange={e => setGenderInput(e.target.value)} className={selectClass}>
                        <option value="">未設定</option>
                        {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted mb-1">年齢</p>
                      <input
                        type="number"
                        value={ageGroupInput}
                        onChange={e => setAgeGroupInput(e.target.value)}
                        placeholder="例: 25"
                        min={1}
                        max={120}
                        className={selectClass}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={saveProfile}
                      disabled={saving || !nicknameInput.trim() || !ageValid}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl btn-brand text-white text-[13px] font-bold disabled:opacity-40 disabled:shadow-none"
                    >
                      <Check size={14} strokeWidth={2.5} />
                      {saving ? '保存中...' : '保存'}
                    </button>
                    <button onClick={cancelEdit} className="px-4 py-2 rounded-xl border border-line text-muted text-[13px]">
                      <X size={14} strokeWidth={2} className="inline mr-1" />
                      キャンセル
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[11px] text-muted">ニックネーム</p>
                    <button onClick={startEdit} className="text-muted hover:text-accent-deep transition-colors p-1 -mr-1">
                      <Pencil size={14} strokeWidth={2} />
                    </button>
                  </div>
                  <p className="text-[18px] font-bold text-ink mb-3">{participant.nickname}</p>
                  <div className="grid grid-cols-2 gap-3 border-t border-line pt-3">
                    <div>
                      <p className="text-[11px] text-muted mb-0.5">性別</p>
                      <p className={`text-[14px] font-medium ${participant.gender ? 'text-ink' : 'text-faint'}`}>
                        {participant.gender ?? '未設定'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-muted mb-0.5">年齢</p>
                      <p className={`text-[14px] font-medium ${participant.age_group ? 'text-ink' : 'text-faint'}`}>
                        {participant.age_group
                          ? /^\d+$/.test(participant.age_group) ? `${participant.age_group}歳` : participant.age_group
                          : '未設定'}
                      </p>
                    </div>
                  </div>
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
