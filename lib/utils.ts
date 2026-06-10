export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getAchievementTitle(count: number): string {
  if (count >= 20) return '🏆 レジェンド参加者';
  if (count >= 10) return '🥇 常連参加者';
  if (count >= 5) return '🥈 リピーター';
  if (count >= 1) return '🥉 ライブデビュー';
  return '';
}

export function getNextAchievementTarget(count: number): { target: number; label: string } | null {
  if (count < 5) return { target: 5, label: '5回参加' };
  if (count < 10) return { target: 10, label: '10回参加' };
  if (count < 20) return { target: 20, label: '20回参加' };
  return null;
}
