import Link from 'next/link';
import { Music } from 'lucide-react';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-page">
      <div className="text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-brand-soft border border-brand-border flex items-center justify-center mx-auto mb-5 text-brand-deep">
          <Music size={28} strokeWidth={2} />
        </div>
        <h1 className="text-3xl font-bold text-ink mb-2">スタンプラリー</h1>
        <p className="text-subtle text-sm mb-8">ライブ来場デジタルスタンプ</p>

        <div className="space-y-3">
          <Link
            href="/stamp-book"
            className="block w-full py-3.5 rounded-xl btn-brand text-white font-bold text-base text-center"
          >
            スタンプ帳を見る
          </Link>
          <p className="text-xs text-faint">QRコードを読み取ってスタンプを獲得しよう</p>
        </div>

        <div className="mt-12 pt-6 border-t border-rule">
          <Link href="/admin" className="text-xs text-faint hover:text-subtle transition-colors">
            管理者ページ
          </Link>
        </div>
      </div>
    </main>
  );
}
