'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutGrid } from 'lucide-react';
import { useStampBook } from '../StampBookContext';
import { getTheme, headerGradient, Theme } from '@/lib/themes';
import { StampBookGroup, StampBookReward } from '@/types';
import StampCard from '@/components/StampCard';

export default function StampsPage() {
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

  return (
    <main className="max-w-lg mx-auto p-4 space-y-5 pt-5">
      <div className="flex items-center gap-2 mb-1">
        <LayoutGrid size={18} strokeWidth={2} className="text-accent" />
        <h1 className="text-[17px] font-bold text-ink">スタンプ一覧</h1>
      </div>

      {(() => {
        const activeGroup = groups.find(g => g.project.id === activeProjectId) ?? groups[0] ?? null;
        if (!activeGroup) return (
          <div className="text-center py-16 text-muted">
            <p className="text-[14px]">まだスタンプがありません</p>
            <p className="text-[12px] text-faint mt-1">会場のQRコードを読み取って獲得しましょう</p>
          </div>
        );
        return (
          <ProjectSection
            group={activeGroup}
            theme={getTheme(activeGroup.project.theme_id)}
            onShowReward={(reward) => setSelectedReward({ reward, projectName: activeGroup.project.name })}
          />
        );
      })()}
    </main>
  );
}

function ProjectSection({ group, theme, onShowReward }: {
  group: StampBookGroup;
  theme: Theme;
  onShowReward: (r: StampBookReward) => void;
}) {
  const { project, count, tiers, stamps } = group;
  const nextTier = tiers.find((t) => !t.earned);
  const progress = nextTier ? Math.min((count / nextTier.threshold) * 100, 100) : 100;

  return (
    <section className="rounded-2xl border border-line card-shadow overflow-hidden" style={{ background: 'var(--color-card-bg, white)' }}>
      <div className="h-1.5" style={{ background: headerGradient(theme) }} />

      <div className="px-4 pt-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-ink text-[15px] truncate">{project.name}</h2>
          <span className="shrink-0 ml-2 text-[12px] font-bold" style={{ color: theme.accent }}>{count} 個</span>
        </div>

        {tiers.length > 0 && (
          <div className="mt-3 rounded-xl p-3" style={{ background: theme.soft, border: `1px solid ${theme.track}` }}>
            {nextTier ? (
              <>
                <div className="flex justify-between text-[12px] mb-1.5">
                  <span className="text-muted">あと <span className="font-bold" style={{ color: theme.accentDeep }}>{nextTier.threshold - count}</span> 個で「{nextTier.label}」</span>
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

      <div className="p-4 space-y-2.5">
        {stamps.map((s) => (
          <StampCard key={s.id} event={s.event!} stamp={s} theme={theme} />
        ))}
      </div>
    </section>
  );
}
