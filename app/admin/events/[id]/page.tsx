'use client';

import { useEffect, useState, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Trash2, ImagePlus, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getAccessToken } from '@/lib/adminAuth';
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
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadEvent(); }, [id]);

  async function loadEvent() {
    const token = await getAccessToken();
    const authHeader = { 'Authorization': `Bearer ${token}` };
    const [eventRes, statsRes] = await Promise.all([
      fetch(`/api/events/${id}`),
      fetch(`/api/admin/stats?event_id=${id}`, { headers: authHeader }),
    ]);
    const ev: Event = await eventRes.json();
    const stats = await statsRes.json();
    setEvent(ev);
    setForm({ title: ev.title, event_date: ev.event_date, venue: ev.venue, description: ev.description || '' });
    setIconUrl(ev.icon_url ?? null);
    setIconPreview(ev.icon_url ?? null);
    setStampCount(stats.stampCount || 0);
    setLoading(false);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  async function handleIconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconPreview(URL.createObjectURL(file));
    setUploading(true);
    const token = await getAccessToken();
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/events/upload-icon', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: fd,
    });
    if (res.ok) {
      const { url } = await res.json();
      setIconUrl(url);
    } else {
      setError('画像のアップロードに失敗しました');
      setIconPreview(event?.icon_url ?? null);
    }
    setUploading(false);
  }

  function removeIcon() {
    setIconPreview(null);
    setIconUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleSave = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setSaving(true);
    const token = await getAccessToken();
    const res = await fetch(`/api/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...form, icon_url: iconUrl }),
    });
    if (res.ok) {
      router.push(backHref);
    } else {
      setError('保存に失敗しました');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`「${event?.title}」を削除しますか？`)) return;
    const token = await getAccessToken();
    const res = await fetch(`/api/events/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) router.push(backHref);
  };

  const backHref = event?.project_id ? `/admin/projects/${event.project_id}` : '/admin';

  const qrUrl = event
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/event/${event.qr_token}/stamp`
    : '';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.back()} className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">イベント編集</h1>
        </div>

        <div className="bg-grad-soft border border-teal-border rounded-2xl p-4 mb-5">
          <p className="text-[12px] text-muted mb-1">スタンプ取得数</p>
          <p className="text-[30px] font-bold text-accent">{stampCount}</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-line card-shadow mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-ink text-[14px]">QRコード</h2>
            <button
              onClick={() => setShowQR(!showQR)}
              className="text-[13px] text-accent font-medium"
            >
              {showQR ? '閉じる' : '表示する'}
            </button>
          </div>
          {showQR && <QRCodeDisplay url={qrUrl} eventTitle={form.title} />}
        </div>

        <form onSubmit={handleSave} className="space-y-4 bg-white rounded-2xl p-6 border border-line card-shadow mb-4">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">イベント名</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">開催日</label>
            <input
              name="event_date"
              type="date"
              value={form.event_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">会場名</label>
            <input
              name="venue"
              value={form.venue}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">アイコン画像（任意）</label>
            {iconPreview ? (
              <div className="flex items-center gap-3">
                <div className="w-[60px] h-[60px] rounded-full overflow-hidden shrink-0 border border-line">
                  <img src={iconPreview} alt="" className="w-full h-full object-cover" />
                </div>
                <button type="button" onClick={removeIcon} className="flex items-center gap-1 text-[12px] text-danger">
                  <X size={13} strokeWidth={2} />
                  削除
                </button>
                {uploading && <span className="text-[12px] text-muted">アップロード中...</span>}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-line text-[13px] text-muted hover:border-accent hover:text-accent transition-colors w-full justify-center"
              >
                <ImagePlus size={16} strokeWidth={2} />
                画像を選択
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconChange} />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">説明</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white resize-none"
            />
          </div>
          {error && <p className="text-danger text-[13px]">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl btn-brand text-white font-bold text-[15px] disabled:opacity-50 disabled:shadow-none"
          >
            {saving ? '保存中...' : '保存する'}
          </button>
        </form>

        <button
          onClick={handleDelete}
          className="w-full py-3 rounded-xl border border-danger-border text-danger text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-danger-soft transition-colors"
        >
          <Trash2 size={14} strokeWidth={2} />
          このイベントを削除
        </button>
      </div>
    </AdminLayout>
  );
}
