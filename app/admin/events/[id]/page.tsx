'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getAdminPassword } from '@/lib/adminAuth';
import { Event } from '@/types';

export default function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [form, setForm] = useState({ title: '', event_date: '', venue: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [stampCount, setStampCount] = useState(0);
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [id]);

  async function loadEvent() {
    const pw = getAdminPassword();
    const [eventRes, statsRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/admin/stats?event_id=${id}`, { headers: { 'x-admin-password': pw } }),
    ]);
    const ev: Event = await eventRes.json();
    const stats = await statsRes.json();
    setEvent(ev);
    setForm({
      title: ev.title,
      event_date: ev.event_date,
      venue: ev.venue,
      description: ev.description || '',
    });
    setStampCount(stats.stampCount || 0);
    setLoading(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': getAdminPassword() },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      router.push('/admin');
    } else {
      setError('保存に失敗しました');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${event?.title}」を削除しますか？`)) return;
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'x-admin-password': getAdminPassword() },
    });
    if (res.ok) router.push('/admin');
  };

  const qrUrl = event
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/event/${event.qr_token}/stamp`
    : '';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 rounded-full border-4 border-pink-400 border-t-transparent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-800">イベント編集</h1>
        </div>

        {/* Stats */}
        <div className="bg-pink-50 rounded-2xl p-4 border border-pink-100 mb-6">
          <p className="text-sm text-gray-500">スタンプ取得数</p>
          <p className="text-3xl font-black text-pink-500">{stampCount}</p>
        </div>

        {/* QR Code */}
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-700">QRコード</h2>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-sm text-pink-500 font-medium"
            >
              {showQR ? '閉じる' : '表示する'}
            </button>
          </div>
          {showQR && <QRCodeDisplay url={qrUrl} eventTitle={form.title} />}
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="space-y-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">イベント名</label>
            <input name="title" value={form.title} onChange={handleChange} required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">開催日</label>
            <input name="event_date" type="date" value={form.event_date} onChange={handleChange} required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">会場名</label>
            <input name="venue" value={form.venue} onChange={handleChange} required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm resize-none" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold shadow disabled:opacity-50">
            {saving ? '保存中...' : '保存する'}
          </button>
        </form>

        <button
          onClick={handleDelete}
          className="w-full py-3 rounded-xl border-2 border-red-200 text-red-400 font-medium text-sm hover:bg-red-50 transition-colors"
        >
          このイベントを削除
        </button>
      </div>
    </AdminLayout>
  );
}
