'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Music, Ticket } from 'lucide-react';
import { Event, EventStamp } from '@/types';
import { getLocalParticipant, clearLocalParticipant } from '@/lib/storage';
import StampCard from '@/components/StampCard';
import AchievementBadge from '@/components/AchievementBadge';
import QRScanner from '@/components/QRScanner';

export default function StampBookPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [stamps, setStamps] = useState<EventStamp[]>([]);
  const [loading, setLoading] = useState(true);
  const [participant, setParticipant] = useState<{ participant_id: string; nickname: string } | null>(null);
  const [showScanner, setShowScanner] = useState(false);

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

  function handleQRScan(token: string) {
    setShowScanner(false);
    router.push(`/event/${token}/stamp`);
  }

  const stampMap = new Map(stamps.map((s) => [s.event_id, s]));
  const stampCount = stamps.length;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-screen-bg">
        <div className="w-[54px] h-[54px] rounded-full border-[3px] border-line border-t-accent animate-spin" />
      </div>
    );
  }

  if (!participant) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-screen-bg">
        {showScanner && (
          <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
        )}
        <div className="text-center max-w-sm w-full">
          <div className="stamp-face w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto mb-5 text-accent-deep">
            <Music size={26} strokeWidth={2} />
          </div>
          <h1 className="text-[24px] font-bold text-ink mb-2">TICKETS</h1>
          <p className="text-muted text-[14px] mb-7 leading-relaxed">
            スタンプを取得するとここに記録されます。<br />
            まずは会場のQRコードを読み取ってください。
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setShowScanner(true)}
              className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
            >
              QRを読み取る
            </button>
            <Link
              href="/"
              className="block w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium text-center hover:border-accent hover:text-accent transition-colors"
            >
              トップへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const initial = participant.nickname.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-screen-bg">
      {showScanner && (
        <QRScanner onScan={handleQRScan} onClose={() => setShowScanner(false)} />
      )}

      {/* Header */}
      <div className="header-grad sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 pt-4 pb-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {/* Avatar circle */}
              <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                <span className="text-white font-bold text-[15px]">{initial}</span>
              </div>
              <div>
                <h1 className="font-bold text-white text-[17px] leading-tight">TICKETS</h1>
                <p className="text-white/70 text-[12px]">{participant.nickname} さん</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[11px]">獲得スタンプ</p>
              <p className="text-white text-[24px] font-bold leading-tight">{stampCount}</p>
            </div>
          </div>
          {/* Perforation */}
          <div className="relative">
            <div className="border-t-2 border-dashed border-white/20" />
            <div
              className="absolute -left-4 -top-[11px] w-[22px] h-[22px] rounded-full"
              style={{ backgroundColor: '#F1F8F7' }}
            />
            <div
              className="absolute -right-4 -top-[11px] w-[22px] h-[22px] rounded-full"
              style={{ backgroundColor: '#F1F8F7' }}
            />
          </div>
          {/* Ticket icon strip */}
          <div className="flex items-center justify-center gap-1 py-2">
            <Ticket size={12} strokeWidth={2} className="text-white/40" />
            <span
              className="text-white/40 text-[10px] tracking-widest"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              STAMP RALLY
            </span>
            <Ticket size={12} strokeWidth={2} className="text-white/40" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <AchievementBadge stampCount={stampCount} />

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-line card-shadow text-center">
            <p className="text-[12px] text-muted mb-1">総参加回数</p>
            <p className="text-[26px] font-bold text-ink">{stampCount}</p>
            <p className="text-[11px] text-faint">回</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-line card-shadow text-center">
            <p className="text-[12px] text-muted mb-1">獲得スタンプ数</p>
            <p className="text-[26px] font-bold text-ink">{stampCount}</p>
            <p className="text-[11px] text-faint">個</p>
          </div>
        </div>

        <div>
          <h2 className="text-[14px] font-bold text-ink mb-3">ライブ一覧</h2>
          {events.length === 0 ? (
            <div className="text-center py-8 text-muted">
              <p className="text-[14px]">イベントがまだありません</p>
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
          onClick={() => setShowScanner(true)}
          className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
        >
          QRを読み取ってスタンプ獲得
        </button>

        <div className="pt-2 border-t border-line">
          <button
            onClick={() => {
              if (confirm('参加者情報をリセットしますか？スタンプ帳のデータは保持されます。')) {
                clearLocalParticipant();
                window.location.href = '/';
              }
            }}
            className="w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium hover:border-accent hover:text-accent transition-colors"
          >
            端末の参加者情報をリセット
          </button>
        </div>
      </div>
    </main>
  );
}
