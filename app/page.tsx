import Link from 'next/link';
import { Music } from 'lucide-react';

function Barcode() {
  return (
    <div
      className="h-[34px] w-full rounded opacity-70 mt-2"
      style={{
        background:
          'repeating-linear-gradient(90deg,#17302E 0,#17302E 2px,transparent 2px,transparent 4px,#17302E 4px,#17302E 5px,transparent 5px,transparent 8px)',
      }}
    />
  );
}

function Perforation() {
  return (
    <div className="relative my-5 mx-0">
      <div className="border-t-2 border-dashed border-teal-border" />
      <div
        className="absolute -left-5 -top-[11px] w-[22px] h-[22px] rounded-full"
        style={{ backgroundColor: '#F1F8F7' }}
      />
      <div
        className="absolute -right-5 -top-[11px] w-[22px] h-[22px] rounded-full"
        style={{ backgroundColor: '#F1F8F7' }}
      />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 bg-screen-bg">
      <div className="w-full max-w-sm">
        {/* Ticket card */}
        <div className="bg-white rounded-2xl card-shadow overflow-hidden">
          {/* Accent bar */}
          <div className="h-2 header-grad" />

          <div className="px-5 pt-5 pb-0 text-center">
            <p className="text-[11px] font-medium tracking-widest text-muted mb-4" style={{ fontFamily: 'var(--font-mono)' }}>
              LIVE STAMP · <span className="font-bold text-accent">Ticket</span>
            </p>

            {/* Stamp circle */}
            <div className="stamp-face w-[88px] h-[88px] rounded-full flex items-center justify-center text-accent-deep mx-auto mb-4">
              <Music size={32} strokeWidth={2} />
            </div>

            <h1 className="text-[22px] font-bold text-ink mb-1">スタンプラリー</h1>
            <p className="text-muted text-[13px]">ライブ来場デジタルスタンプ</p>
          </div>

          <Perforation />

          {/* Ticket stub section */}
          <div className="px-5 pb-5">
            <div className="flex items-center justify-between text-[11px] mb-3" style={{ fontFamily: 'var(--font-mono)' }}>
              <div>
                <p className="text-faint">TYPE</p>
                <p className="font-bold text-ink">ADMISSION</p>
              </div>
              <div className="text-right">
                <p className="text-faint">AREA</p>
                <p className="font-bold text-ink">ALL AREA</p>
              </div>
            </div>
            <Barcode />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-5 space-y-3">
          <Link
            href="/stamp-book"
            className="block w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] text-center"
          >
            チケットを見る
          </Link>
          <p className="text-xs text-faint text-center">QRコードを読み取ってスタンプを獲得しよう</p>
        </div>

        <div className="mt-10 pt-5 border-t border-line text-center">
          <Link href="/admin" className="text-[12px] text-faint hover:text-muted transition-colors">
            管理者ページ
          </Link>
        </div>
      </div>
    </main>
  );
}
