'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
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
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-[54px] h-[54px] rounded-full border-[3px] border-rule border-t-brand animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-page">
        <div className="text-center max-w-sm w-full">
          <div className="w-14 h-14 rounded-full bg-brand-soft border border-brand-border flex items-center justify-center mx-auto mb-4 text-brand-deep">
            <BookOpen size={24} strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-bold text-ink mb-2">スタンプ帳</h1>
          <p className="text-subtle text-sm mb-6">
            スタンプを取得するとここに記録されます。<br />
            まずは会場のQRコードを読み取ってください。
          </p>
          <Link
            href="/"
            className="block w-full py-3.5 rounded-xl btn-brand text-white font-bold text-base text-center"
          >
            トップへ戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-page">
      <div className="sticky top-0 z-10 bg-white border-b border-rule px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen size={18} strokeWidth={2} className="text-brand" />
            <div>
              <h1 className="font-bold text-base text-ink leading-tight">スタンプ帳</h1>
              <p className="text-xs text-subtle">{participant.nickname} さん</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-faint">獲得スタンプ</p>
            <p className="text-2xl font-bold text-brand">{stampCount}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <AchievementBadge stampCount={stampCount} />

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-rule card-shadow text-center">
            <p className="text-xs text-subtle mb-1">総参加回数</p>
            <p className="text-[26px] font-bold text-ink">{stampCount}</p>
            <p className="text-xs text-faint">回</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-rule card-shadow text-center">
            <p className="text-xs text-subtle mb-1">獲得スタンプ数</p>
            <p className="text-[26px] font-bold text-ink">{stampCount}</p>
            <p className="text-xs text-faint">個</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-bold text-ink mb-3">ライブ一覧</h2>
          {events.length === 0 ? (
            <div className="text-center py-8 text-subtle">
              <p className="text-sm">イベントがまだありません</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {events.map((event) => (
                <StampCard key={event.id} event={event} stamp={stampMap.get(event.id)} />
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => window.location.href = '/'}
          className="block w-full py-3.5 rounded-xl btn-brand text-white font-bold text-sm text-center"
        >
          QRを読み取ってスタンプ獲得
        </button>

        <div className="pt-2 border-t border-rule">
          <button
            onClick={() => {
              if (confirm('参加者情報をリセットしますか？スタンプ帳のデータは保持されます。')) {
                clearLocalParticipant();
                window.location.href = '/';
              }
            }}
            className="w-full py-3 rounded-xl border border-rule text-subtle text-sm font-medium hover:border-brand hover:text-brand transition-colors"
          >
            端末の参加者情報をリセット
          </button>
        </div>
      </div>
    </main>
  );
}
