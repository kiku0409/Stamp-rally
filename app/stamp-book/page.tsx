'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Event, EventStamp } from '@/types';
import { getLocalParticipant, clearLocalParticipant } from '@/lib/storage';
import StampCard from '@/components/StampCard';
import AchievementBadge from '@/components/AchievementBadge';

export default function StampBookPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [stamps, setStamps] = useState<EventStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<{ participant_id: string; nickname: string } | null>(null);

  useEffect(() => {
    const local = getLocalParticipant();
    setParticipant(local);
    if (local) {
      loadData(local.participant_id);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadData(participantId: string) {
    try {
      const [eventsRes, stampsRes] = await Promise.all([
        fetch('/api/events'),
        fetch(`/api/stamps?participant_id=${participantId}`),
      ]);
      const [eventsData, stampsData] = await Promise.all([
        eventsRes.json(),
        stampsRes.json(),
      ]);
      setEvents(eventsData);
      setStamps(stampsData);
    } catch {
      // silently handle error
    } finally {
      setLoading(false);
    }
  }

  const stampMap = new Map(stamps.map((s) => [s.event_id, s]));
  const stampCount = stamps.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="w-12 h-12 rounded-full border-4 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 via-white to-purple-50">
        <div className="text-center max-w-sm w-full">
          <div className="text-5xl mb-4">📖</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">スタンプ帳</h1>
          <p className="text-gray-500 text-sm mb-6">
            スタンプを取得するとここに記録されます。
            <br />
            まずは会場のQRコードを読み取ってください。
          </p>
          <Link
            href="/"
            className="block w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold text-lg shadow-lg text-center"
          >
            トップへ戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-pink-100 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-black text-lg text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
              📖 スタンプ帳
            </h1>
            <p className="text-xs text-gray-500">{participant.nickname} さん</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">獲得スタンプ</p>
            <p className="text-2xl font-black text-pink-500">{stampCount}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Achievement */}
        <AchievementBadge stampCount={stampCount} />

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-pink-100 shadow-sm text-center">
            <p className="text-xs text-gray-400 mb-1">総参加回数</p>
            <p className="text-3xl font-black text-pink-500">{stampCount}</p>
            <p className="text-xs text-gray-400">回</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm text-center">
            <p className="text-xs text-gray-400 mb-1">獲得スタンプ数</p>
            <p className="text-3xl font-black text-purple-500">{stampCount}</p>
            <p className="text-xs text-gray-400">個</p>
          </div>
        </div>

        {/* Stamp List */}
        <div>
          <h2 className="text-sm font-bold text-gray-600 mb-3">ライブ一覧</h2>
          {events.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm">イベントがまだありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <StampCard
                  key={event.id}
                  event={event}
                  stamp={stampMap.get(event.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Reset */}
        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={() => {
              if (confirm('参加者情報をリセットしますか？スタンプ帳のデータは保持されます。')) {
                clearLocalParticipant();
                window.location.href = '/';
              }
            }}
            className="w-full py-3 rounded-2xl border-2 border-gray-200 text-gray-400 text-sm font-medium"
          >
            端末の参加者情報をリセット
          </button>
        </div>
      </div>
    </main>
  );
}
