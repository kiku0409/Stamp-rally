'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import { getAdminPassword } from '@/lib/adminAuth';
import { Event } from '@/types';
import { formatDate } from '@/lib/utils';

interface EventWithStats extends Event {
  stampCount: number;
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [totalStats, setTotalStats] = useState({ totalStamps: 0, totalParticipants: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const pw = getAdminPassword();
    const headers = { 'x-admin-password': pw };

    const [eventsRes, statsRes] = await Promise.all([
      fetch('/api/events'),
      fetch('/api/admin/stats', { headers }),
    ]);

    const eventsData: Event[] = await eventsRes.json();
    const statsData = await statsRes.json();

    // Load per-event stamp counts
    const withStats = await Promise.all(
      eventsData.map(async (ev) => {
        const r = await fetch(`/api/admin/stats?event_id=${ev.id}`, { headers });
        const s = await r.json();
        return { ...ev, stampCount: s.stampCount || 0 };
      })
    );

    setEvents(withStats);
    setTotalStats(statsData);
    setLoading(false);
  }

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
      <h1 className="text-2xl font-bold text-gray-800 mb-6">ダッシュボード</h1>

      {/* Overall stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl p-5 border border-pink-100 shadow-sm text-center">
          <p className="text-xs text-gray-400 mb-1">総スタンプ数</p>
          <p className="text-4xl font-black text-pink-500">{totalStats.totalStamps}</p>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm text-center">
          <p className="text-xs text-gray-400 mb-1">総参加者数</p>
          <p className="text-4xl font-black text-purple-500">{totalStats.totalParticipants}</p>
        </div>
      </div>

      {/* Events */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-700">イベント一覧</h2>
        <Link
          href="/admin/events/new"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white text-sm font-bold shadow"
        >
          + 新規作成
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-gray-100">
          <p className="text-gray-400 mb-4">イベントがありません</p>
          <Link href="/admin/events/new" className="text-pink-500 font-medium text-sm">
            最初のイベントを作成する →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-800">{ev.title}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(ev.event_date)} · {ev.venue}
                  </p>
                  <p className="text-xs text-pink-500 mt-1 font-medium">
                    スタンプ取得数: {ev.stampCount}
                  </p>
                </div>
                <Link
                  href={`/admin/events/${ev.id}`}
                  className="ml-3 px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-pink-300 hover:text-pink-500 transition-colors"
                >
                  編集
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
