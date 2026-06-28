'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music, KeyRound, ChevronRight, UserPlus, Check, QrCode } from 'lucide-react';
import { useStampBook } from './StampBookContext';
import { setLocalParticipant } from '@/lib/storage';
import { getTheme, headerGradient, Theme } from '@/lib/themes';
import { StampBookGroup, EventStamp } from '@/types';

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
            <ProjectOverviewCard
              key={g.project.id}
              group={g}
              theme={getTheme(g.project.theme_id)}
              onScanQR={() => setShowScanner(true)}
            />
          ))
        )}
      </div>
    </main>
  );
}

function ProjectOverviewCard({ group, theme, onScanQR }: {
  group: StampBookGroup;
  theme: Theme;
  onScanQR: () => void;
}) {
  const router = useRouter();
  const { project, count, tiers, stamps } = group;
  const nextTier = tiers.find((t) => !t.earned);
  const recentStamps = stamps.slice(0, 3);
  const hasMoreStamps = stamps.length > 3;

  // 進捗バーの計算
  let progressPercent: number;
  let progressLabel: React.ReactNode;
  let progressSub: string;
  let onProgressTap: () => void;
  const allEarned = tiers.length > 0 && !nextTier;

  if (tiers.length > 0) {
    if (nextTier) {
      progressPercent = Math.min((count / nextTier.threshold) * 100, 100);
      progressLabel = <>あと <strong style={{ color: theme.accentDeep }}>{nextTier.threshold - count}</strong> 個で「{nextTier.label}」</>;
      progressSub = `${count}/${nextTier.threshold}`;
    } else {
      progressPercent = 100;
      progressLabel = null;
      progressSub = '';
    }
    onProgressTap = () => router.push('/stamp-book/rewards');
  } else {
    // 特典なし → 10個単位の汎用バー
    const milestone = (Math.floor(count / 10) + 1) * 10;
    const base = milestone - 10;
    progressPercent = ((count - base) / 10) * 100;
    progressLabel = <>あと <strong style={{ color: theme.accentDeep }}>{milestone - count}</strong> 個で {milestone} 個達成！</>;
    progressSub = `${count - base}/10`;
    onProgressTap = () => router.push('/stamp-book/stamps');
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden card-shadow border border-line">
      <div className="h-1.5" style={{ background: headerGradient(theme) }} />

      {/* バナー画像（将来実装） */}
      {project.banner_url && (
        <img src={project.banner_url} alt="" className="w-full h-36 object-cover" />
      )}

      <div className="p-4 space-y-3">
        {/* プロジェクト名 + スタンプ数 */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink text-[16px] truncate flex-1">{project.name}</h2>
          <span className="text-[13px] font-bold ml-2 shrink-0" style={{ color: theme.accent }}>{count} 個</span>
        </div>

        {/* 会場マップ（将来実装） */}
        {project.venue_map_url && (
          <img src={project.venue_map_url} alt="会場マップ" className="w-full rounded-xl object-contain max-h-48" />
        )}

        {/* 直近スタンプ（最大3件） */}
        {recentStamps.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted mb-1.5">最近のスタンプ</p>
            <div className="rounded-xl overflow-hidden border border-line divide-y divide-line">
              {recentStamps.map((s) => (
                <MiniStampRow key={s.id} stamp={s} theme={theme} />
              ))}
            </div>
            {hasMoreStamps && (
              <button
                onClick={() => router.push('/stamp-book/stamps')}
                className="mt-2 w-full text-center text-[12px] font-bold py-2 rounded-xl transition-colors"
                style={{ color: theme.accent, background: `${theme.accent}10` }}
              >
                詳細はコチラ →
              </button>
            )}
          </div>
        )}

        {/* 進捗バー（タップで特典/スタンプ一覧へ） */}
        <button
          onClick={onProgressTap}
          className="w-full rounded-xl p-3 text-left"
          style={{ background: theme.soft, border: `1px solid ${theme.track}` }}
        >
          {allEarned ? (
            <p className="text-[12px] font-medium text-center" style={{ color: theme.accent }}>全ての特典を達成しました！</p>
          ) : (
            <>
              <div className="flex justify-between text-[12px] mb-1.5">
                <span className="text-muted">{progressLabel}</span>
                <span className="text-muted" style={{ fontFamily: 'var(--font-mono)' }}>{progressSub}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: theme.track }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%`, background: `linear-gradient(180deg, ${theme.headerFrom}, ${theme.accent})` }}
                />
              </div>
            </>
          )}
        </button>

        {/* QR読み取りボタン */}
        <button
          onClick={onScanQR}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[13px] font-bold border transition-colors"
          style={{ color: theme.accent, borderColor: `${theme.accent}60`, background: `${theme.accent}08` }}
        >
          <QrCode size={15} strokeWidth={2} />
          QRコードはこちら
        </button>
      </div>
    </div>
  );
}

function MiniStampRow({ stamp, theme }: { stamp: EventStamp; theme: Theme }) {
  const event = stamp.event;
  if (!event) return null;
  const d = new Date(stamp.stamped_at);
  const dateStr = d.toLocaleDateString('ja-JP', { month: '2-digit', day: '2-digit' });

  return (
    <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white">
      <div
        className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 36% 26%, #FFFFFF 0%, ${theme.soft} 46%, ${theme.track} 100%)`,
          color: theme.accentDeep,
        }}
      >
        {event.icon_url ? (
          <img src={event.icon_url} alt="" className="w-full h-full object-cover" />
        ) : (
          <Music size={12} strokeWidth={2} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-ink truncate">{event.title}</p>
        <p className="text-[11px] text-muted truncate">{event.venue}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Check size={11} strokeWidth={2.5} style={{ color: theme.accent }} />
        <span className="text-[10px] font-medium" style={{ color: theme.accent, fontFamily: 'var(--font-mono)' }}>{dateStr}</span>
      </div>
    </div>
  );
}
