'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getAdminPassword } from '@/lib/adminAuth';
import { Event } from '@/types';
import { formatDate } from '@/lib/utils';

interface EventWithStats extends Event {
  stampCount: number;
}

interface Stamper {
  stamped_at: string;
  participants: { nickname: string } | null;
}

export default function AdminDashboard() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [totalStats, setTotalStats] = useState({ totalStamps: 0, totalParticipants: 0 });
  const [loading, setLoading] = useState(true);
  const [qrEvent, setQrEvent] = useState<EventWithStats | null>(null);
  const [stampersEvent, setStampersEvent] = useState<EventWithStats | null>(null);
  const [stampers, setStampers] = useState<Stamper[]>([]);
  const [stampersLoading, setStampersLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const pw = getAdminPassword();
    const headers = { 'x-admin-password': pw };

    try {
      const [eventsRes, statsRes] = await Promise.all([
        fetch('/api/events'),
        fetch('/api/admin/stats', { headers }),
      ]);

      const eventsData = await eventsRes.json();
      const statsData = await statsRes.json();

      const eventsArray: Event[] = Array.isArray(eventsData) ? eventsData : [];

      const withStats = await Promise.all(
        eventsArray.map(async (ev) => {
          const r = await fetch(`/api/admin/stats?event_id=${ev.id}`, { headers });
          const s = await r.json();
          return { ...ev, stampCount: s.stampCount || 0 };
        })
      );

      setEvents(withStats);
      if (!statsData.error) setTotalStats(statsData);
    } catch {
      // silently handle connection errors
    } finally {
      setLoading(false);
    }
  }

  async function openStampers(ev: EventWithStats) {
    setStampersEvent(ev);
    setStampers([]);
    setStampersLoading(true);
    const res = await fetch(`/api/admin/event-stamps?event_id=${ev.id}`, {
      headers: { 'x-admin-password': getAdminPassword() },
    });
    const data = await res.json();
    setStampers(Array.isArray(data) ? data : []);
    setStampersLoading(false);
  }

  const qrUrl = qrEvent
    ? `${window.location.origin}/event/${qrEvent.qr_token}/stamp`
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
                <button
                  className="flex-1 text-left"
                  onClick={() => openStampers(ev)}
                >
                  <h3 className="font-bold text-gray-800">{ev.title}</h3>
                  <p className="text-sm text-gray-500">
                    {formatDate(ev.event_date)} · {ev.venue}
                  </p>
                  <p className="text-xs text-pink-500 mt-1 font-medium">
                    スタンプ取得数: {ev.stampCount}
                  </p>
                </button>
                <div className="flex items-center gap-2 ml-3">
                  <button
                    onClick={() => setQrEvent(ev)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-pink-300 hover:text-pink-500 transition-colors"
                  >
                    QR
                  </button>
                  <Link
                    href={`/admin/events/${ev.id}`}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs text-gray-600 hover:border-pink-300 hover:text-pink-500 transition-colors"
                  >
                    編集
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setQrEvent(null)}
        >
          <div
            className="bg-white rounded-3xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-800 text-lg">{qrEvent.title}</h2>
              <button onClick={() => setQrEvent(null)} className="text-gray-400 text-xl leading-none">×</button>
            </div>
            <QRCodeDisplay url={qrUrl} eventTitle={qrEvent.title} />
          </div>
        </div>
      )}

      {/* Stampers Modal */}
      {stampersEvent && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center"
          onClick={() => setStampersEvent(null)}
        >
          <div
            className="bg-white rounded-t-3xl w-full max-w-lg p-6 max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-gray-800 text-lg">{stampersEvent.title}</h2>
                <p className="text-sm text-gray-400">スタンプ取得者一覧</p>
              </div>
              <button onClick={() => setStampersEvent(null)} className="text-gray-400 text-xl leading-none">×</button>
            </div>

            <div className="overflow-y-auto flex-1">
              {stampersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-4 border-pink-400 border-t-transparent animate-spin" />
                </div>
              ) : stampers.length === 0 ? (
                <p className="text-center text-gray-400 py-8">まだスタンプ取得者がいません</p>
              ) : (
                <ul className="space-y-2">
                  {stampers.map((s, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <span className="font-medium text-gray-700">
                        {s.participants?.nickname ?? '不明'}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(s.stamped_at).toLocaleString('ja-JP', {
                          month: 'numeric', day: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
