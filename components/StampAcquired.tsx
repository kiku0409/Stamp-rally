'use client';

import Link from 'next/link';
import { Music } from 'lucide-react';
import { Event } from '@/types';

interface StampAcquiredProps {
  event: Event;
  stampedAt: string;
  nickname?: string;
}

function Barcode() {
  return (
    <div
      className="h-[28px] w-full rounded opacity-70 mt-1"
      style={{
        background:
          'repeating-linear-gradient(90deg,#17302E 0,#17302E 2px,transparent 2px,transparent 4px,#17302E 4px,#17302E 5px,transparent 5px,transparent 8px)',
      }}
    />
  );
}

function Perforation({ bgColor = '#F1F8F7' }: { bgColor?: string }) {
  return (
    <div className="relative my-4 mx-0">
      <div className="border-t-2 border-dashed border-teal-border" />
      <div
        className="absolute -left-5 -top-[11px] w-[22px] h-[22px] rounded-full"
        style={{ backgroundColor: bgColor }}
      />
      <div
        className="absolute -right-5 -top-[11px] w-[22px] h-[22px] rounded-full"
        style={{ backgroundColor: bgColor }}
      />
    </div>
  );
}

function formatStampDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StampAcquired({ event, stampedAt }: StampAcquiredProps) {
  const [, month, day] = event.event_date.split('-');
  const mmdd = `${parseInt(month)}/${parseInt(day)}`;

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Ticket card */}
      <div className="bg-white rounded-2xl overflow-hidden card-shadow">
        {/* Accent bar */}
        <div className="h-2 header-grad" />

        <div className="px-5 pt-5 text-center">
          <p
            className="text-[11px] tracking-widest text-muted mb-4"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            LIVE STAMP · <span className="font-bold text-accent">Ticket</span>
          </p>

          {/* Stamp */}
          <div
            className="stamp-face w-[110px] h-[110px] rounded-full flex flex-col items-center justify-center text-accent-deep mx-auto animate-stamp-pop"
          >
            <Music size={30} strokeWidth={2} />
            <span className="text-[11px] font-bold mt-1" style={{ fontFamily: 'var(--font-mono)' }}>
              {mmdd}
            </span>
          </div>

          <h2 className="text-[22px] font-bold text-ink mt-4 mb-1 animate-fade-up">スタンプ獲得</h2>
          <p className="text-muted text-[13px] animate-fade-up">{event.title}</p>
        </div>

        <Perforation />

        {/* Stub section */}
        <div className="px-5 pb-5 animate-fade-up">
          <div className="space-y-2 mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
            <div className="flex justify-between text-[11px]">
              <span className="text-faint">VENUE</span>
              <span className="text-ink font-medium text-right max-w-[60%] truncate">{event.venue}</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-faint">DATE</span>
              <span className="text-ink font-medium">{formatStampDate(stampedAt)}</span>
            </div>
          </div>
          <Barcode />
        </div>
      </div>

      <div className="mt-4 space-y-2 animate-fade-up">
        <Link
          href="/stamp-book"
          className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
        >
          チケットを見る
        </Link>
        <p className="text-[11px] text-faint text-center">同じライブのスタンプは1回のみ獲得できます</p>
      </div>
    </div>
  );
}
