'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutGrid, QrCode, Ticket } from 'lucide-react';
import { useStampBook } from '@/app/stamp-book/StampBookContext';

export default function BottomNav() {
  const pathname = usePathname();
  const { setShowScanner } = useStampBook();

  const homeActive = pathname === '/stamp-book';
  const stampsActive = pathname === '/stamp-book/stamps';
  const rewardsActive = pathname === '/stamp-book/rewards';

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-line"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-lg mx-auto flex items-end justify-around px-2 h-16">
        {/* ホーム */}
        <Link href="/stamp-book" className="flex flex-col items-center gap-0.5 px-4 py-2">
          <Home size={22} strokeWidth={2} className={homeActive ? 'text-accent' : 'text-faint'} />
          <span className={`text-[10px] font-medium ${homeActive ? 'text-accent' : 'text-faint'}`}>ホーム</span>
        </Link>

        {/* スタンプ */}
        <Link href="/stamp-book/stamps" className="flex flex-col items-center gap-0.5 px-4 py-2">
          <LayoutGrid size={22} strokeWidth={2} className={stampsActive ? 'text-accent' : 'text-faint'} />
          <span className={`text-[10px] font-medium ${stampsActive ? 'text-accent' : 'text-faint'}`}>スタンプ</span>
        </Link>

        {/* QR（中央・浮き円形ボタン） */}
        <div className="flex flex-col items-center relative -top-3">
          <button
            onClick={() => setShowScanner(true)}
            className="w-14 h-14 rounded-full btn-brand text-white flex items-center justify-center shadow-lg"
            aria-label="QRを読み取る"
          >
            <QrCode size={26} strokeWidth={2} />
          </button>
          <span className="text-[10px] font-medium text-faint mt-1">QR</span>
        </div>

        {/* チケット */}
        <Link href="/stamp-book/rewards" className="flex flex-col items-center gap-0.5 px-4 py-2">
          <Ticket size={22} strokeWidth={2} className={rewardsActive ? 'text-accent' : 'text-faint'} />
          <span className={`text-[10px] font-medium ${rewardsActive ? 'text-accent' : 'text-faint'}`}>チケット</span>
        </Link>
      </div>
    </nav>
  );
}
