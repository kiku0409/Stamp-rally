'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, Trash2, Pencil, Check, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getAccessToken } from '@/lib/adminAuth';
import type { Slot, SlotSchedule, Event } from '@/types';

interface SlotDetailPageProps {
  params: Promise<{ id: string; slotId: string }>;
}

function formatJST(iso: string) {
  return new Date(iso).toLocaleString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// datetime-local の値をUTC ISOに変換（JST入力前提）
function localToISO(local: string) {
  if (!local) return '';
  const d = new Date(local);
  return d.toISOString();
}

// UTC ISOをdatetime-localの値（JST）に変換
function isoToLocal(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const offset = 9 * 60;
  const jst = new Date(d.getTime() + offset * 60 * 1000);
  return jst.toISOString().slice(0, 16);
}

export default function SlotDetailPage({ params }: SlotDetailPageProps) {
  const { id: projectId, slotId } = use(params);
  const router = useRouter();

  const [slot, setSlot] = useState<Slot | null>(null);
  const [schedules, setSchedules] = useState<SlotSchedule[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState('');

  // 名前編集
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  // スケジュール追加フォーム
  const [form, setForm] = useState({ event_id: '', start_at: '', end_at: '' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  async function loadData() {
    const token = await getAccessToken();
    const [slotRes, schedRes, evRes] = await Promise.all([
      fetch(`/api/slots/${slotId}`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/slots/${slotId}/schedules`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`/api/events?project_id=${projectId}`, { headers: { Authorization: `Bearer ${token}` } }),
    ]);
    if (slotRes.ok) {
      const s: Slot = await slotRes.json();
      setSlot(s);
      setNameInput(s.name);
      setQrUrl(`${window.location.origin}/slot/${s.slot_token}`);
    }
    if (schedRes.ok) setSchedules(await schedRes.json());
    if (evRes.ok) setEvents(await evRes.json());
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, [slotId, projectId]);

  async function saveName() {
    if (!nameInput.trim() || !slot) return;
    setSavingName(true);
    const token = await getAccessToken();
    const res = await fetch(`/api/slots/${slotId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setSlot(updated);
      setEditingName(false);
    }
    setSavingName(false);
  }

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    if (!form.event_id || !form.start_at || !form.end_at) return;
    setAdding(true);
    setAddError('');
    const token = await getAccessToken();
    const res = await fetch(`/api/slots/${slotId}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        event_id: form.event_id,
        start_at: localToISO(form.start_at),
        end_at: localToISO(form.end_at),
      }),
    });
    if (res.ok) {
      const added = await res.json();
      setSchedules((prev) => [...prev, added].sort((a, b) => a.start_at.localeCompare(b.start_at)));
      setForm({ event_id: '', start_at: '', end_at: '' });
    } else {
      const data = await res.json();
      setAddError(data.error || '追加に失敗しました');
    }
    setAdding(false);
  }

  async function handleDeleteSchedule(schedId: string) {
    const token = await getAccessToken();
    await fetch(`/api/slots/${slotId}/schedules/${schedId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setSchedules((prev) => prev.filter((s) => s.id !== schedId));
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!slot) {
    return (
      <AdminLayout>
        <p className="text-muted text-[14px]">スロットが見つかりません</p>
      </AdminLayout>
    );
  }

  const inputClass = 'w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white';

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.push(`/admin/projects/${projectId}/slots`)} className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">スロット設定</h1>
        </div>

        {/* スロット名 */}
        <section className="bg-white rounded-2xl p-5 border border-line card-shadow mb-5">
          <h2 className="text-[13px] font-bold text-muted uppercase mb-3">スロット名</h2>
          {editingName ? (
            <div className="flex gap-2">
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl border border-accent focus:outline-none text-[15px] font-bold text-ink bg-white"
                autoFocus
              />
              <button onClick={saveName} disabled={savingName} className="p-2 rounded-lg text-accent hover:bg-accent/10 transition-colors">
                <Check size={18} strokeWidth={2.5} />
              </button>
              <button onClick={() => { setEditingName(false); setNameInput(slot.name); }} className="p-2 rounded-lg text-muted hover:bg-line/50 transition-colors">
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[17px] font-bold text-ink flex-1">{slot.name}</span>
              <button onClick={() => setEditingName(true)} className="p-1.5 rounded-lg text-muted hover:text-ink transition-colors">
                <Pencil size={15} strokeWidth={2} />
              </button>
            </div>
          )}
          <p className="text-[11px] text-muted mt-2 font-mono break-all">{qrUrl}</p>
        </section>

        {/* QRコード */}
        <section className="bg-white rounded-2xl p-5 border border-line card-shadow mb-5">
          <h2 className="text-[13px] font-bold text-muted uppercase mb-4">QRコード（印刷用）</h2>
          {qrUrl && <QRCodeDisplay url={qrUrl} eventTitle={slot.name} />}
        </section>

        {/* タイムテーブル */}
        <section className="bg-white rounded-2xl p-5 border border-line card-shadow mb-5">
          <h2 className="text-[13px] font-bold text-muted uppercase mb-4">タイムテーブル</h2>

          {schedules.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-4">スケジュールがまだありません</p>
          ) : (
            <div className="space-y-2 mb-4">
              {schedules.map((sched) => {
                const ev = sched.event as (Event & { title: string }) | undefined;
                return (
                  <div key={sched.id} className="flex items-center gap-3 py-2.5 border-b border-line last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold text-ink truncate">{ev?.title ?? '(不明なイベント)'}</p>
                      <p className="text-[11px] text-muted mt-0.5">
                        {formatJST(sched.start_at)} 〜 {formatJST(sched.end_at)}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteSchedule(sched.id)}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger/10 transition-colors shrink-0"
                    >
                      <Trash2 size={14} strokeWidth={2} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* スケジュール追加フォーム */}
          <form onSubmit={handleAddSchedule} className="border-t border-line pt-4 space-y-3">
            <h3 className="text-[13px] font-bold text-ink">スケジュール追加</h3>
            <div>
              <label className="block text-[12px] font-medium text-muted mb-1">イベント（アーティスト）</label>
              <select
                value={form.event_id}
                onChange={(e) => setForm((p) => ({ ...p, event_id: e.target.value }))}
                className={inputClass}
                required
              >
                <option value="">選択してください</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-muted mb-1">開始時刻（JST）</label>
                <input
                  type="datetime-local"
                  value={form.start_at}
                  onChange={(e) => setForm((p) => ({ ...p, start_at: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-muted mb-1">終了時刻（JST）</label>
                <input
                  type="datetime-local"
                  value={form.end_at}
                  onChange={(e) => setForm((p) => ({ ...p, end_at: e.target.value }))}
                  className={inputClass}
                  required
                />
              </div>
            </div>
            {addError && <p className="text-danger text-[13px]">{addError}</p>}
            <button
              type="submit"
              disabled={adding}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl btn-brand text-white font-bold text-[14px] disabled:opacity-50 disabled:shadow-none"
            >
              <Plus size={14} strokeWidth={2.5} />
              {adding ? '追加中...' : 'スケジュールを追加'}
            </button>
          </form>
        </section>
      </div>
    </AdminLayout>
  );
}
