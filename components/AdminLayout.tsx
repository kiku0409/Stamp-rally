'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAdminPassword, clearAdminPassword, verifyAdminPassword } from '@/lib/adminAuth';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const pw = getAdminPassword();
    if (!pw) {
      router.replace('/admin/login');
      return;
    }
    verifyAdminPassword(pw).then((ok) => {
      if (!ok) {
        clearAdminPassword();
        router.replace('/admin/login');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  const handleLogout = () => {
    clearAdminPassword();
    router.push('/admin/login');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 rounded-full border-4 border-pink-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="font-bold text-gray-800">
              🛠 管理画面
            </Link>
            <nav className="hidden sm:flex items-center gap-3 text-sm">
              <Link href="/admin" className="text-gray-600 hover:text-pink-500">
                ダッシュボード
              </Link>
              <Link href="/admin/events" className="text-gray-600 hover:text-pink-500">
                イベント管理
              </Link>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
