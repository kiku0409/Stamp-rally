'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, Trash2, QrCode } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { getAccessToken } from '@/lib/adminAuth';
import type { Slot } from '@/types';

interface SlotsPageProps {
  params: Promise<{ id: string }>;
}

export default function SlotsPage({ params }: SlotsPageProps) {
  const { id: projectId } = use(params);
  const router = useRouter();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function loadSlots() {
    const token = await getAccessToken();
    const res = await fetch(`/api/slots?project_id=${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setSlots(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadSlots();
  }, [projectId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError('');
    const token = await getAccessToken();
    const res = await fetch('/api/slots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ project_id: projectId, name: newName.trim() }),
    });
    if (res.ok) {
      setNewName('');
      await loadSlots();
    } else {
      const data = await res.json();
      setError(data.error || '作成に失敗しました');
    }
    setCreating(false);
  }

  async function handleDelete(slotId: string, name: string) {
    if (!confirm(`「${name}」を削除しますか？\nタイムテーブル設定もすべて削除されます。`)) return;
    const token = await getAccessToken();
    await fetch(`/api/slots/${slotId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSlots((prev) => prev.filter((s) => s.id !== slotId));
  }

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.push(`/admin/projects/${projectId}`)} className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">スロット管理（動的QR）</h1>
        </div>

        <p className="text-[13px] text-muted mb-5">
          スロットは物理的に印刷するQRコード1枚に対応します。タイムテーブルを設定すると、スキャン時刻に応じて自動で異なるアーティストのスタンプが押せます。
        </p>

        {/* 新規作成フォーム */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 border border-line card-shadow mb-5">
          <h2 className="text-[14px] font-bold text-ink mb-3">新規スロット追加</h2>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例: ステージA、スポット1"
              className="flex-1 px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
            />
            <button
              type="submit"
              disabled={creating || !newName.trim()}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-brand text-white font-bold text-[14px] disabled:opacity-50 disabled:shadow-none whitespace-nowrap"
            >
              <Plus size={14} strokeWidth={2.5} />
              追加
            </button>
          </div>
          {error && <p className="text-danger text-[13px] mt-2">{error}</p>}
        </form>

        {/* スロット一覧 */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-[3px] border-line border-t-accent animate-spin" />
          </div>
        ) : slots.length === 0 ? (
          <div className="text-center py-12 text-muted text-[14px]">
            スロットがまだありません
          </div>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div key={slot.id} className="bg-white rounded-2xl px-5 py-4 border border-line card-shadow flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-ink truncate">{slot.name}</p>
                  <p className="text-[11px] text-muted mt-0.5 font-mono">/slot/{slot.slot_token}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/admin/projects/${projectId}/slots/${slot.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-accent text-accent text-[13px] font-medium hover:bg-accent/5 transition-colors"
                  >
                    <QrCode size={13} strokeWidth={2} />
                    設定
                  </Link>
                  <button
                    onClick={() => handleDelete(slot.id, slot.name)}
                    className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors"
                  >
                    <Trash2 size={15} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
