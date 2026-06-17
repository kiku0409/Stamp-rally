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
    <div className="bg-grad-soft border border-teal-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={18} strokeWidth={2} className="text-accent-deep" />
          <span className="font-bold text-ink text-[15px]">{title || '—'}</span>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-muted">獲得スタンプ</p>
          <p className="text-[22px] font-bold text-accent">{stampCount}</p>
        </div>
      </div>

      {next && (
        <div>
          <div className="flex justify-between text-[12px] text-muted mb-1.5">
            <span>次の目標まで あと {next.target - stampCount} 回</span>
            <span>{stampCount} / {next.target}</span>
          </div>
          <div className="h-2 rounded-full bg-track overflow-hidden">
            <div
              className="h-full progress-grad rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stampCount / next.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!next && (
        <p className="text-[12px] text-accent font-medium text-center">全称号コンプリート</p>
      )}
    </div>
  );
}
