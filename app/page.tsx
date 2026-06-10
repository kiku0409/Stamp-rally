import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-50 via-white to-purple-50">
      <div className="text-center max-w-sm w-full">
        <div className="text-6xl mb-4">🎵</div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
          スタンプラリー
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          ライブ来場デジタルスタンプ
        </p>

        <div className="space-y-3">
          <Link
            href="/stamp-book"
            className="block w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold text-lg shadow-lg active:scale-95 transition-transform text-center"
          >
            📖 スタンプ帳を見る
          </Link>
          <p className="text-xs text-gray-400">
            QRコードを読み取ってスタンプを獲得しよう！
          </p>
        </div>

        <div className="mt-12 pt-6 border-t border-gray-200">
          <Link
            href="/admin"
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            管理者ページ
          </Link>
        </div>
      </div>
    </main>
  );
}
