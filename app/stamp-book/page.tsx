'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music, KeyRound, UserPlus, Check, QrCode, MapPin, Clock, X } from 'lucide-react';
import { useStampBook } from './StampBookContext';
import { setLocalParticipant } from '@/lib/storage';
import { getTheme, Theme } from '@/lib/themes';
import { StampBookGroup, EventStamp, ProjectImage } from '@/types';

export default function StampBookHomePage() {
  const { participant, groups, loading, setShowScanner, activeProjectId } = useStampBook();
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
  const activeGroup = groups.find(g => g.project.id === activeProjectId) ?? groups[0] ?? null;

  return (
    <main>
      {activeGroup ? (
        <ProjectView group={activeGroup} onScanQR={() => setShowScanner(true)} />
      ) : (
        <div className="text-center py-16 text-muted">
          <p className="text-[14px]">まだスタンプがありません</p>
          <p className="text-[12px] text-faint mt-1">QRを読み取ってスタンプを獲得しましょう</p>
        </div>
      )}
    </main>
  );
}

function ProjectView({ group, onScanQR }: { group: StampBookGroup; onScanQR: () => void }) {
  const router = useRouter();
  const { project, count, tiers, stamps, events: allEvents } = group;
  const theme = getTheme(project.theme_id);
  const images: ProjectImage[] = project.images ?? [];
  const [selectedEvent, setSelectedEvent] = useState<import('@/types').Event | null>(null);
  const [carouselIdx, setCarouselIdx] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  const recentStamps = stamps.slice(0, 3);
  const hasMoreStamps = stamps.length > 3;
  const nextTier = tiers.find(t => !t.earned);
  const allEarned = tiers.length > 0 && !nextTier;

  let progressPercent: number;
  let progressLabel: React.ReactNode;
  let progressSub: string;
  let onProgressTap: () => void;

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
    const milestone = (Math.floor(count / 10) + 1) * 10;
    const base = milestone - 10;
    progressPercent = ((count - base) / 10) * 100;
    progressLabel = <>あと <strong style={{ color: theme.accentDeep }}>{milestone - count}</strong> 個で {milestone} 個達成！</>;
    progressSub = `${count - base}/10`;
    onProgressTap = () => router.push('/stamp-book/stamps');
  }

  function onCarouselScroll() {
    if (!carouselRef.current) return;
    const { scrollLeft, clientWidth } = carouselRef.current;
    if (clientWidth > 0) setCarouselIdx(Math.round(scrollLeft / clientWidth));
  }

  return (
    <div className="max-w-lg mx-auto pb-6">
      {/* Photo carousel */}
      {images.length > 0 && (
        <div className="relative">
          <div
            ref={carouselRef}
            onScroll={onCarouselScroll}
            className="flex overflow-x-auto"
            style={{ scrollSnapType: 'x mandatory', WebkitOverflowScrolling: 'touch' as never, scrollbarWidth: 'none' }}
          >
            {images.map(img => (
              <div key={img.id} style={{ scrollSnapAlign: 'start', flexShrink: 0, width: '100%' }}>
                <img src={img.image_url} alt="" className="w-full h-52 object-cover" />
              </div>
            ))}
          </div>
          {images.length > 1 && (
            <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
              {images.map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                  style={{ background: i === carouselIdx ? '#fff' : 'rgba(255,255,255,0.45)' }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 space-y-3">
        {/* Project name + stamp count */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink text-[16px] truncate flex-1">{project.name}</h2>
          <span className="text-[13px] font-bold ml-2 shrink-0" style={{ color: theme.accent }}>{count} 個</span>
        </div>

        {/* Progress bar */}
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
                  style={{ width: `${progressPercent}%`, background: `linear-gradient(90deg, ${theme.headerFrom}, ${theme.accent})` }}
                />
              </div>
            </>
          )}
        </button>

        {/* Recent stamps */}
        {recentStamps.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-muted mb-1.5">最近のスタンプ</p>
            <div className="rounded-xl overflow-hidden border border-line divide-y divide-line">
              {recentStamps.map(s => <MiniStampRow key={s.id} stamp={s} theme={theme} />)}
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

        {/* Timetable */}
        {project.timetable_url && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <Clock size={14} strokeWidth={2} style={{ color: theme.accent }} />
              <p className="text-[13px] font-bold text-ink">タイムテーブル</p>
            </div>
            <img src={project.timetable_url} alt="タイムテーブル" className="w-full rounded-xl object-contain" />
          </div>
        )}

        {/* Venue map with pins */}
        {project.venue_map_url && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <MapPin size={14} strokeWidth={2} style={{ color: theme.accent }} />
              <p className="text-[13px] font-bold text-ink">会場マップ</p>
            </div>
            <div className="relative rounded-xl overflow-hidden">
              <img src={project.venue_map_url} alt="会場マップ" className="w-full object-contain block" />
              {(allEvents ?? []).filter(ev => ev.map_x != null && ev.map_y != null).map(ev => {
                const stampedIds = new Set(stamps.map(s => s.event_id));
                const collected = stampedIds.has(ev.id);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setSelectedEvent(ev)}
                    className="absolute flex items-center justify-center rounded-full font-bold text-[13px] transition-transform hover:scale-110 active:scale-95"
                    style={{
                      left: `${ev.map_x}%`,
                      top: `${ev.map_y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: 36,
                      height: 36,
                      background: collected ? theme.accent : '#3B82F6',
                      color: '#fff',
                      boxShadow: collected
                        ? `0 0 0 3px white, 0 0 0 5px ${theme.accent}`
                        : '0 2px 6px rgba(0,0,0,0.3)',
                    }}
                  >
                    {collected ? <Check size={16} strokeWidth={3} /> : (ev.map_label ?? '?')}
                  </button>
                );
              })}
            </div>

            {/* ピンタップ時の詳細カード */}
            {selectedEvent && (
              <div
                className="fixed inset-0 z-50 flex items-end justify-center"
                onClick={() => setSelectedEvent(null)}
              >
                <div
                  className="w-full max-w-lg bg-white rounded-t-2xl p-5 border-t border-line card-shadow"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {(() => {
                          const collected = new Set(stamps.map(s => s.event_id)).has(selectedEvent.id);
                          return (
                            <span
                              className="flex items-center justify-center w-7 h-7 rounded-full text-white text-[12px] font-bold shrink-0"
                              style={{ background: collected ? theme.accent : '#3B82F6' }}
                            >
                              {collected ? <Check size={13} strokeWidth={3} /> : (selectedEvent.map_label ?? '?')}
                            </span>
                          );
                        })()}
                        <p className="text-[15px] font-bold text-ink truncate">{selectedEvent.title}</p>
                      </div>
                      <p className="text-[12px] text-muted">{selectedEvent.venue}</p>
                    </div>
                    <button onClick={() => setSelectedEvent(null)} className="text-muted ml-3 shrink-0">
                      <X size={18} strokeWidth={2} />
                    </button>
                  </div>
                  {new Set(stamps.map(s => s.event_id)).has(selectedEvent.id) ? (
                    <div
                      className="rounded-xl px-4 py-3 text-center text-[13px] font-bold"
                      style={{ background: theme.soft, color: theme.accentDeep }}
                    >
                      獲得済み ✓
                    </div>
                  ) : (
                    <button
                      onClick={onScanQR}
                      className="w-full py-3 rounded-xl text-white font-bold text-[14px] flex items-center justify-center gap-2"
                      style={{ background: `linear-gradient(135deg, ${theme.headerFrom}, ${theme.headerTo})` }}
                    >
                      <QrCode size={16} strokeWidth={2} />
                      QRを読み取ってスタンプを獲得
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* QR scan button */}
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
    <div className="flex items-center gap-2.5 px-3 py-2.5" style={{ background: 'var(--color-card-bg, white)' }}>
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
