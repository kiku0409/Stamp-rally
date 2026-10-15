export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

// イベント開催日の短縮表記: 単日 "10/17" / 複数日 "10/17–18" / 月またぎ "10/31–11/1"
export function formatEventDateShort(eventDate: string, endDate?: string | null): string {
  const [, m1, d1] = eventDate.split('-').map(Number);
  const start = `${m1}/${d1}`;
  if (!endDate || endDate === eventDate) return start;
  const [, m2, d2] = endDate.split('-').map(Number);
  return m1 === m2 ? `${start}–${d2}` : `${start}–${m2}/${d2}`;
}

// イベント開催日の表記（管理画面用）: "2026/10/17" / "2026/10/17–10/18"
export function formatEventDate(eventDate: string, endDate?: string | null): string {
  const start = formatDate(eventDate);
  if (!endDate || endDate === eventDate) return start;
  const [, m2, d2] = endDate.split('-');
  return `${start}–${m2}/${d2}`;
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

// 称号システムはプロジェクト単位の特典段階（project_reward_tiers）に統合したため、
// 全体合計ベースの旧 getAchievementTitle / getNextAchievementTarget は廃止。
