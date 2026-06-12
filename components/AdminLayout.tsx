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
      <div className="min-h-screen flex items-center justify-center admin-bg">
        <div className="w-10 h-10 rounded-full border-4 border-rule border-t-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen admin-bg">
      <header className="bg-white border-b border-rule sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-ink">
              <span className="w-2 h-2 rounded-full bg-brand inline-block" />
              管理画面
            </Link>
            <nav className="hidden sm:flex items-center gap-3 text-sm">
              <Link href="/admin" className="text-subtle hover:text-brand transition-colors">
                ダッシュボード
              </Link>
            </nav>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-subtle hover:text-ink transition-colors"
          >
            ログアウト
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
