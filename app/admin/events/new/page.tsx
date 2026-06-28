'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ImagePlus, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { getAccessToken } from '@/lib/adminAuth';

function NewEventForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');
  const [form, setForm] = useState({ title: '', event_date: '', venue: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const title = searchParams.get('title');
    const venue = searchParams.get('venue');
    const description = searchParams.get('description');
    if (title || venue) {
      setForm((prev) => ({ ...prev, title: title ?? '', venue: venue ?? '', description: description ?? '' }));
    }
  }, [searchParams]);

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
      setIconPreview(null);
    }
    setUploading(false);
  }

  function removeIcon() {
    setIconPreview(null);
    setIconUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!projectId) {
      setError('プロジェクトが指定されていません');
      return;
    }
    setLoading(true);
    setError('');
    const token = await getAccessToken();
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...form, project_id: projectId, icon_url: iconUrl }),
    });
    if (res.ok) {
      router.push(`/admin/projects/${projectId}`);
    } else {
      const data = await res.json();
      setError(data.error || '作成に失敗しました');
      setLoading(false);
    }
  };

  const required = <span className="text-danger ml-0.5">*</span>;

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.back()} className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">新規イベント作成</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 border border-line card-shadow">
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">イベント名{required}</label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="例: 東京公演 2026"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-ink mb-1">開催日{required}</label>
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
            <label className="block text-[13px] font-medium text-ink mb-1">会場名{required}</label>
            <input
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="例: Zepp Tokyo"
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
            <label className="block text-[13px] font-medium text-ink mb-1">説明（任意）</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="イベントの説明"
              className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white resize-none"
            />
          </div>
          {error && <p className="text-danger text-[13px]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl btn-brand text-white font-bold text-[15px] disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? '作成中...' : 'イベントを作成'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}

export default function NewEventPage() {
  return (
    <Suspense>
      <NewEventForm />
    </Suspense>
  );
}
