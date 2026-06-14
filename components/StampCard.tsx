'use client';

import { Music, Plus } from 'lucide-react';
import { Event, EventStamp } from '@/types';
import { formatDate } from '@/lib/utils';

interface StampCardProps {
  event: Event;
  stamp?: EventStamp;
}

export default function StampCard({ event, stamp }: StampCardProps) {
  const isStamped = !!stamp;
  const [, month, day] = event.event_date.split('-');
  const mmdd = `${parseInt(month)}.${parseInt(day)}`;

  return (
    <div
      className={`rounded-2xl p-4 border flex items-center gap-4 card-shadow ${
        isStamped ? 'border-brand-border bg-white' : 'border-rule bg-white opacity-60'
      }`}
    >
      {isStamped ? (
        <div
          className="w-[52px] h-[52px] rounded-full stamp-acquired flex flex-col items-center justify-center shrink-0 text-brand-deep"
          style={{ transform: 'rotate(-6deg)' }}
        >
          <Music size={16} strokeWidth={2} />
          <span className="text-[10px] font-bold mt-0.5">{mmdd}</span>
        </div>
      ) : (
        <div className="w-[52px] h-[52px] rounded-full border-[1.5px] border-dashed border-rule flex items-center justify-center shrink-0 text-faint">
          <Plus size={14} strokeWidth={2} />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-xs text-subtle mb-0.5">{formatDate(event.event_date)}</p>
        <h3 className={`font-bold text-sm leading-snug ${isStamped ? 'text-ink' : 'text-subtle'}`}>
          {event.title}
        </h3>
        <p className={`text-xs mt-0.5 ${isStamped ? 'text-subtle' : 'text-faint'}`}>
          {event.venue}
        </p>
        {isStamped && stamp && (
          <p className="text-xs text-brand font-bold mt-1">
            ✓ {formatDate(stamp.stamped_at)} 取得
          </p>
        )}
      </div>
    </div>
  );
}
