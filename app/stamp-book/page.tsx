'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Music, KeyRound, ChevronRight, UserPlus } from 'lucide-react';
import { useStampBook } from './StampBookContext';
import { setLocalParticipant } from '@/lib/storage';
import { getTheme, headerGradient, Theme } from '@/lib/themes';
import { StampBookGroup } from '@/types';

export default function StampBookHomePage() {
  const { participant, groups, loading, setShowScanner } = useStampBook();
  const [restoreCode, setRestoreCode] = useState('');
  const [restoreError, setRestoreError] = useState('');
  const [restoring, setRestoring] = useState(false);

  async function handleRestore(e: { preventDefault: () => void }) {
    e.preventDefault();
    setRestoring(true);
    setRestoreError('');
    try {
      const res = await fetch('/api/participants/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: restoreCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRestoreError(data.error || '復元に失敗しました');
        setRestoring(false);
        return;
      }
      setLocalParticipant({ participant_id: data.id, nickname: data.nickname, recovery_code: data.recovery_code });
      window.location.reload();
    } catch {
      setRestoreError('通信エラーが発生しました');
      setRestoring(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="w-[54px] h-[54px] rounded-full border-[3px] border-line border-t-accent animate-spin" />
      </div>
    );
  }

  // ── 未ログイン ──────────────────────────────────────────────
  if (!participant) {
    return (
      <main className="flex flex-col items-center justify-center min-h-[80vh] p-5">
        <div className="text-center max-w-sm w-full">
          <div className="stamp-face w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-5 text-accent-deep">
            <Music size={26} strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-ink mb-2">TICKETS</h1>
          <p className="text-muted text-[14px] mb-7 leading-relaxed">
            スタンプを取得するとここに記録されます。<br />
            会場のQRコードを読み取るか、先にアカウントを作成できます。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowScanner(true)}
              className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
            >
              QRを読み取る
            </button>
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 w-full py-[14px] rounded-xl border border-accent text-accent font-bold text-[15px] hover:bg-accent/5 transition-colors"
            >
              <UserPlus size={17} strokeWidth={2} />
              アカウントを作成する
            </Link>
            <Link
              href="/"
              className="block w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium text-center hover:border-accent hover:text-accent transition-colors"
            >
              トップへ戻る
            </Link>
          </div>

          <form onSubmit={handleRestore} className="mt-6 bg-white rounded-2xl p-4 border border-line card-shadow text-left">
            <div className="flex items-center gap-2 mb-2">
              <KeyRound size={15} strokeWidth={2} className="text-accent" />
              <span className="font-bold text-ink text-[13px]">復元コードで復元</span>
            </div>
            <p className="text-[11px] text-muted mb-2">以前の端末で控えた復元コードを入力すると、スタンプ帳を引き継げます。</p>
            <div className="flex gap-2">
              <input
                value={restoreCode}
                onChange={(e) => setRestoreCode(e.target.value.toUpperCase())}
                placeholder="例: ABCD-EFGH-JKLM"
                className="flex-1 px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white tracking-widest"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <button
                type="submit"
                disabled={restoring || !restoreCode}
                className="px-4 rounded-xl btn-brand text-white font-bold text-[13px] disabled:opacity-50 disabled:shadow-none"
              >
                {restoring ? '...' : '復元'}
              </button>
            </div>
            {restoreError && <p className="text-danger text-[12px] mt-2">{restoreError}</p>}
          </form>
        </div>
      </main>
    );
  }

  // ── ログイン済み ────────────────────────────────────────────
  const initial = participant.nickname.charAt(0).toUpperCase();
  const totalStamps = groups.reduce((sum, g) => sum + g.count, 0);

  return (
    <main>
      {/* Gradient header */}
      <div className="header-grad sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
          <div className="flex items-center justify-between">
            <Link href="/profile" className="flex items-center gap-3 text-left group">
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-white font-bold text-[15px]">{initial}</span>
              </div>
              <div>
                <h1 className="font-bold text-white text-[17px] leading-tight flex items-center gap-1">
                  {participant.nickname} さん
                  <ChevronRight size={15} strokeWidth={2.5} className="text-white/60 group-hover:text-white transition-colors" />
                </h1>
                <p className="text-white/70 text-[10px]">タップでユーザー情報・復元コード</p>
              </div>
            </Link>
            <div className="text-right">
              <p className="text-white/60 text-[11px]">獲得スタンプ</p>
              <p className="text-white text-[24px] font-bold leading-tight">{totalStamps}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Project overview cards */}
      <div className="max-w-lg mx-auto p-4 space-y-4 pt-4">
        {groups.length === 0 ? (
          <div className="text-center py-16 text-muted">
            <p className="text-[14px]">まだスタンプがありません</p>
            <p className="text-[12px] text-faint mt-1">QRを読み取ってスタンプを獲得しましょう</p>
          </div>
        ) : (
          groups.map((g) => (
            <ProjectOverviewCard key={g.project.id} group={g} theme={getTheme(g.project.theme_id)} />
          ))
        )}
      </div>
    </main>
  );
}

function ProjectOverviewCard({ group, theme }: { group: StampBookGroup; theme: Theme }) {
  const { project, count, tiers } = group;
  const nextTier = tiers.find((t) => !t.earned);
  const progress = nextTier ? Math.min((count / nextTier.threshold) * 100, 100) : 100;

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-line">
      <div className="h-1.5" style={{ background: headerGradient(theme) }} />

      {project.banner_url && (
        <img src={project.banner_url} alt="" className="w-full h-36 object-cover" />
      )}

      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-ink text-[16px] truncate flex-1">{project.name}</h2>
          <span className="text-[13px] font-bold ml-2 shrink-0" style={{ color: theme.accent }}>{count} 個</span>
        </div>

        {project.venue_map_url && (
          <img src={project.venue_map_url} alt="会場マップ" className="w-full rounded-xl mb-3 object-contain max-h-48" />
        )}

        {tiers.length > 0 && (
          <div className="rounded-xl p-3" style={{ background: theme.soft, border: `1px solid ${theme.track}` }}>
            {nextTier ? (
              <>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-muted">
                    あと <span className="font-bold" style={{ color: theme.accentDeep }}>{nextTier.threshold - count}</span> 個で「{nextTier.label}」
                  </span>
                  <span className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{count}/{nextTier.threshold}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.track }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, background: `linear-gradient(180deg, ${theme.headerFrom}, ${theme.accent})` }}
                  />
                </div>
              </>
            ) : (
              <p className="text-[12px] font-medium text-center" style={{ color: theme.accent }}>全ての特典を達成しました！</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
