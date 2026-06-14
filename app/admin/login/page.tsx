'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import { setAdminPassword, verifyAdminPassword } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const ok = await verifyAdminPassword(password);
    if (ok) {
      setAdminPassword(password);
      router.push('/admin');
    } else {
      setError('パスワードが正しくありません');
    }
    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 admin-bg">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-brand-soft border border-brand-border flex items-center justify-center mx-auto mb-4 text-brand-deep">
            <Lock size={22} strokeWidth={2} />
          </div>
          <h1 className="text-[22px] font-bold text-ink">管理者ログイン</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-3.5 rounded-xl border border-rule focus:border-brand focus:outline-none text-center text-base bg-white"
            required
            autoFocus
          />
          {error && <p className="text-brand-deep text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl btn-brand text-white font-bold text-base disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </main>
  );
}
