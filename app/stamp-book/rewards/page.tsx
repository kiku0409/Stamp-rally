'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Gift, ChevronRight } from 'lucide-react';
import { useStampBook } from '../StampBookContext';
import { getTheme, headerGradient } from '@/lib/themes';

export default function RewardsPage() {
  const router = useRouter();
  const { participant, groups, loading, setSelectedReward, activeProjectId } = useStampBook();

  useEffect(() => {
    if (!loading && !participant) {
      router.replace('/stamp-book');
    }
  }, [loading, participant, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-[54px] h-[54px] rounded-full border-[3px] border-line border-t-accent animate-spin" />
      </div>
    );
  }

  if (!participant) return null;

  const activeGroup = groups.find(g => g.project.id === activeProjectId) ?? groups[0] ?? null;
  const activeTheme = activeGroup ? getTheme(activeGroup.project.theme_id) : null;

  return (
    <main className="max-w-lg mx-auto p-4 pt-5">
      <div className="flex items-center gap-2 mb-4">
        <Ticket size={18} strokeWidth={2} className="text-accent" />
        <h1 className="text-[17px] font-bold text-ink">引換券</h1>
      </div>

      {!activeGroup || activeGroup.rewards.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <div className="w-16 h-16 rounded-full bg-soft flex items-center justify-center mx-auto mb-4">
            <Gift size={28} strokeWidth={1.5} className="text-faint" />
          </div>
          <p className="text-[14px] font-medium">引換券がまだありません</p>
          <p className="text-[12px] text-faint mt-1 leading-relaxed">
            スタンプを一定数集めると<br />引換券を獲得できます
          </p>
        </div>
      ) : (
        <section className="rounded-2xl border border-line card-shadow overflow-hidden" style={{ background: 'var(--color-card-bg, white)' }}>
          <div className="h-1.5" style={{ background: headerGradient(activeTheme!) }} />
          <div className="px-4 py-3">
            <h2 className="font-bold text-ink text-[14px] mb-3">{activeGroup.project.name}</h2>
            <div className="space-y-2">
              {activeGroup.rewards.map((r, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedReward({ reward: r, projectName: activeGroup.project.name })}
                  className="w-full flex items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors"
                  style={{ background: `${activeTheme!.accent}10`, border: `1px solid ${activeTheme!.accent}40` }}
                >
                  <Gift size={18} strokeWidth={2} className="shrink-0" style={{ color: activeTheme!.accentDeep }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold truncate" style={{ color: activeTheme!.accentDeep }}>
                      {r.label}
                    </p>
                    {r.redeemed_at && (
                      <p className="text-[11px] text-danger mt-0.5">引換済み</p>
                    )}
                  </div>
                  {r.redeemed_at ? (
                    <span className="text-[10px] text-danger font-medium shrink-0">引換済</span>
                  ) : (
                    <span className="flex items-center gap-0.5 shrink-0 text-[11px] font-medium" style={{ color: activeTheme!.accent }}>
                      QR表示 <ChevronRight size={12} strokeWidth={2.5} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
