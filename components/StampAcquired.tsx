'use client';

import Link from 'next/link';
import { Music, MapPin } from 'lucide-react';
import { Event } from '@/types';
import { formatDateTime } from '@/lib/utils';

interface StampAcquiredProps {
  event: Event;
  stampedAt: string;
  nickname?: string;
}

export default function StampAcquired({ event, stampedAt }: StampAcquiredProps) {
  const [, month, day] = event.event_date.split('-');
  const mmdd = `${parseInt(month)}.${parseInt(day)}`;

  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div
        className="w-[120px] h-[120px] rounded-full stamp-acquired flex flex-col items-center justify-center text-brand-deep mx-auto mb-6 animate-stamp-pop"
      >
        <Music size={34} strokeWidth={2} />
        <span className="text-sm font-bold mt-1">{mmdd}</span>
      </div>

      <h2 className="text-[22px] font-bold text-ink mb-1 animate-fade-up">スタンプ獲得</h2>
      <p className="text-subtle text-sm mb-6 animate-fade-up">{event.title}</p>

      <div className="bg-brand-soft border border-brand-border rounded-2xl p-4 text-left mb-6 space-y-2 animate-fade-up">
        <div className="flex items-center gap-1.5 text-xs text-subtle">
          <MapPin size={12} strokeWidth={2} />
          <span>{event.venue}</span>
        </div>
        <p className="text-xs text-subtle">{formatDateTime(stampedAt)}</p>
      </div>

      <Link
        href="/stamp-book"
        className="block w-full py-3.5 rounded-xl btn-brand text-white font-bold text-base text-center animate-fade-up"
      >
        スタンプ帳を見る
      </Link>
      <p className="text-xs text-faint mt-4">同じライブのスタンプは1回のみ獲得できます</p>
    </div>
  );
}
