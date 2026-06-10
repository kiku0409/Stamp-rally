'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import { getAdminPassword } from '@/lib/adminAuth';

export default function NewEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    event_date: '',
    venue: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': getAdminPassword(),
      },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push('/admin');
    } else {
      const data = await res.json();
      setError(data.error || '作成に失敗しました');
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            ←
          </button>
          <h1 className="text-xl font-bold text-gray-800">新規イベント作成</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              イベント名 <span className="text-red-400">*</span>
            </label>
            <input
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="例: 東京公演 2026"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開催日 <span className="text-red-400">*</span>
            </label>
            <input
              name="event_date"
              type="date"
              value={form.event_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              会場名 <span className="text-red-400">*</span>
            </label>
            <input
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="例: Zepp Tokyo"
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">説明（任意）</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              placeholder="イベントの説明"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-pink-400 focus:outline-none text-sm resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold shadow disabled:opacity-50"
          >
            {loading ? '作成中...' : 'イベントを作成'}
          </button>
        </form>
      </div>
    </AdminLayout>
  );
}
