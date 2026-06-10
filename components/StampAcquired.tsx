'use client';

import Link from 'next/link';
import { Event } from '@/types';
import { formatDate, formatDateTime } from '@/lib/utils';

interface StampAcquiredProps {
  event: Event;
  stampedAt: string;
  nickname: string;
}

export default function StampAcquired({ event, stampedAt, nickname }: StampAcquiredProps) {
  return (
    <div className="w-full max-w-sm mx-auto text-center">
      <div className="mb-6 animate-bounce-slow">
        <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shadow-2xl">
          <span className="text-6xl">⭐</span>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-3xl p-6 border-2 border-pink-200 shadow-lg mb-6">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-1">
          スタンプ獲得！
        </h2>
        <p className="text-gray-500 text-sm mb-4">ライブ参加ありがとうございました！</p>

        <div className="space-y-2 text-left">
          <div className="bg-white rounded-xl p-3 border border-pink-100">
            <p className="text-xs text-gray-400">イベント</p>
            <p className="font-bold text-gray-800">{event.title}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-pink-100">
            <p className="text-xs text-gray-400">開催日</p>
            <p className="font-medium text-gray-700">{formatDate(event.event_date)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-pink-100">
            <p className="text-xs text-gray-400">会場</p>
            <p className="font-medium text-gray-700">📍 {event.venue}</p>
          </div>
          <div className="bg-white rounded-xl p-3 border border-pink-100">
            <p className="text-xs text-gray-400">取得日時</p>
            <p className="font-medium text-gray-700">{formatDateTime(stampedAt)}</p>
          </div>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-6">
        {nickname} さんのスタンプ帳に記録しました！
      </p>

      <Link
        href="/stamp-book"
        className="block w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform text-center"
      >
        スタンプ帳を見る 📖
      </Link>
    </div>
  );
}
