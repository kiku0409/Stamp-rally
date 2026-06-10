'use client';

import { Event, EventStamp } from '@/types';
import { formatDate } from '@/lib/utils';

interface StampCardProps {
  event: Event;
  stamp?: EventStamp;
}

export default function StampCard({ event, stamp }: StampCardProps) {
  const isStamped = !!stamp;

  return (
    <div
      className={`relative rounded-2xl p-4 border-2 transition-all duration-300 ${
        isStamped
          ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 shadow-md'
          : 'border-gray-200 bg-gray-50 opacity-70'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-gray-500 mb-1">
            {formatDate(event.event_date)}
          </p>
          <h3
            className={`font-bold text-base mb-1 ${
              isStamped ? 'text-gray-800' : 'text-gray-400'
            }`}
          >
            {event.title}
          </h3>
          <p
            className={`text-xs ${isStamped ? 'text-gray-600' : 'text-gray-400'}`}
          >
            📍 {event.venue}
          </p>
          {isStamped && stamp && (
            <p className="text-xs text-pink-500 mt-1 font-medium">
              ✓ {formatDate(stamp.stamped_at)} 取得
            </p>
          )}
        </div>
        <div className="ml-4 flex-shrink-0">
          {isStamped ? (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-lg">
              <span className="text-2xl">⭐</span>
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full border-4 border-dashed border-gray-300 flex items-center justify-center">
              <span className="text-2xl opacity-30">⭐</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
