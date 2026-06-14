'use client';

import { Award } from 'lucide-react';
import { getAchievementTitle, getNextAchievementTarget } from '@/lib/utils';

interface AchievementBadgeProps {
  stampCount: number;
}

export default function AchievementBadge({ stampCount }: AchievementBadgeProps) {
  const title = getAchievementTitle(stampCount);
  const next = getNextAchievementTarget(stampCount);

  return (
    <div className="bg-grad-soft border border-brand-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={18} strokeWidth={2} className="text-brand-deep" />
          <span className="font-bold text-ink">{title || '—'}</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-subtle">獲得スタンプ</p>
          <p className="text-[22px] font-bold text-brand">{stampCount}</p>
        </div>
      </div>

      {next && (
        <div>
          <div className="flex justify-between text-xs text-subtle mb-1.5">
            <span>次の目標まで あと {next.target - stampCount} 回</span>
            <span>{stampCount} / {next.target}</span>
          </div>
          <div className="h-1.5 rounded-full bg-white/60 overflow-hidden">
            <div
              className="h-full progress-grad rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stampCount / next.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!next && (
        <p className="text-xs text-brand font-medium text-center">全称号コンプリート</p>
      )}
    </div>
  );
}
