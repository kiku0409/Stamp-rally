'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, ShieldCheck } from 'lucide-react';
import { getSession, signOut, getCurrentUser, isSuperAdmin } from '@/lib/adminAuth';
import type { User } from '@supabase/supabase-js';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    getSession().then((session) => {
      if (!session) {
        router.replace('/admin/login');
        return;
      }
      getCurrentUser().then((user) => {
        setCurrentUser(user);
        setChecking(false);
      });
    });
  }, [router]);

  const handleLogout = async () => {
    await signOut();
    router.push('/admin/login');
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center admin-bg">
        <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen admin-bg">
      <header className="header-grad sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-white inline-block" />
            <Link href="/admin" className="font-bold text-white text-[14px]">管理画面</Link>
            {isSuperAdmin(currentUser) && (
              <Link
                href="/admin/super"
                className="flex items-center gap-1 text-[12px] text-white/70 hover:text-white transition-colors"
              >
                <ShieldCheck size={12} strokeWidth={2} />
                承認・全体
              </Link>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-[12px] text-white/70 hover:text-white transition-colors"
          >
            <LogOut size={13} strokeWidth={2} />
            ログアウト
          </button>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
