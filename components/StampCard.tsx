'use client';

import { Music, Check } from 'lucide-react';
import { Event, EventStamp } from '@/types';

interface StampCardProps {
  event: Event;
  stamp?: EventStamp;
}

function formatStampDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function StampCard({ event, stamp }: StampCardProps) {
  const isStamped = !!stamp;
  const [, month, day] = event.event_date.split('-');
  const mmdd = `${parseInt(month)}/${parseInt(day)}`;

  if (isStamped) {
    return (
      <div className="bg-white rounded-xl overflow-hidden card-shadow flex">
        {/* Left stub: small stamp */}
        <div className="bg-soft flex items-center justify-center px-3 py-4 shrink-0">
          <div className="stamp-face w-[44px] h-[44px] rounded-full flex flex-col items-center justify-center text-accent-deep">
            <Music size={14} strokeWidth={2} />
            <span className="text-[9px] font-bold mt-0.5" style={{ fontFamily: 'var(--font-mono)' }}>
              {mmdd}
            </span>
          </div>
        </div>

        {/* Vertical perforation */}
        <div className="relative flex items-center">
          <div className="border-l-2 border-dashed border-teal-border h-full" />
          <div
            className="absolute -top-[11px] left-[-11px] w-[22px] h-[22px] rounded-full"
            style={{ backgroundColor: '#F1F8F7' }}
          />
          <div
            className="absolute -bottom-[11px] left-[-11px] w-[22px] h-[22px] rounded-full"
            style={{ backgroundColor: '#F1F8F7' }}
          />
        </div>

        {/* Right: event info */}
        <div className="flex-1 px-4 py-3 min-w-0">
          <h3 className="font-bold text-[14px] text-ink leading-snug mb-1 truncate">{event.title}</h3>
          <p className="text-[11px] text-muted truncate mb-1.5" style={{ fontFamily: 'var(--font-mono)' }}>
            {event.venue}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-accent font-bold" style={{ fontFamily: 'var(--font-mono)' }}>
            <Check size={11} strokeWidth={2.5} />
            <span>ADMITTED {stamp && formatStampDateTime(stamp.stamped_at)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden flex border border-dashed border-line opacity-60">
      {/* Left stub: empty placeholder */}
      <div className="bg-soft flex items-center justify-center px-3 py-4 shrink-0">
        <div className="w-[44px] h-[44px] rounded-full border-2 border-dashed border-teal-border flex items-center justify-center">
          <Music size={14} strokeWidth={2} className="text-faint" />
        </div>
      </div>

      {/* Vertical perforation */}
      <div className="relative flex items-center">
        <div className="border-l-2 border-dashed border-line h-full" />
        <div
          className="absolute -top-[11px] left-[-11px] w-[22px] h-[22px] rounded-full"
          style={{ backgroundColor: '#F1F8F7' }}
        />
        <div
          className="absolute -bottom-[11px] left-[-11px] w-[22px] h-[22px] rounded-full"
          style={{ backgroundColor: '#F1F8F7' }}
        />
      </div>

      {/* Right: event info */}
      <div className="flex-1 px-4 py-3 min-w-0">
        <h3 className="font-bold text-[14px] text-muted leading-snug mb-1 truncate">{event.title}</h3>
        <p className="text-[11px] text-faint truncate" style={{ fontFamily: 'var(--font-mono)' }}>
          {event.venue} · 未取得
        </p>
      </div>
    </div>
  );
}
