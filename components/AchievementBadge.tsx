'use client';

import { getAchievementTitle, getNextAchievementTarget } from '@/lib/utils';

interface AchievementBadgeProps {
  stampCount: number;
}

export default function AchievementBadge({ stampCount }: AchievementBadgeProps) {
  const title = getAchievementTitle(stampCount);
  const next = getNextAchievementTarget(stampCount);

  return (
    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-4 border-2 border-yellow-200">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs text-gray-500">現在の称号</p>
          <p className="font-bold text-gray-800">{title || '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">獲得スタンプ</p>
          <p className="text-2xl font-black text-orange-500">{stampCount}</p>
        </div>
      </div>

      {next && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>次の目標: {next.label}</span>
            <span>{stampCount}/{next.target}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-orange-400 to-yellow-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((stampCount / next.target) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {!next && (
        <p className="text-xs text-orange-500 font-medium text-center">
          🎊 全称号コンプリート！
        </p>
      )}
    </div>
  );
}
