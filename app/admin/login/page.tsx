'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { signIn } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      router.push('/admin');
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-5 admin-bg">
      <div className="fixed top-0 left-0 right-0 h-1 header-grad" />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-soft border border-teal-border flex items-center justify-center mx-auto mb-4 text-accent-deep">
            <Lock size={22} strokeWidth={2} />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            <span className="text-[11px] text-muted font-medium tracking-wider">管理画面</span>
          </div>
          <h1 className="text-[22px] font-bold text-ink">管理者ログイン</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="メールアドレス"
            className="w-full px-4 py-3.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[15px] bg-white text-ink"
            required
            autoFocus
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-3.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[15px] bg-white text-ink"
            required
          />
          {error && <p className="text-danger text-[13px] text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </main>
  );
}
