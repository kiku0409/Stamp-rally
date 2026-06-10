'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setAdminPassword, verifyAdminPassword } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
    <main className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">管理者ログイン</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワード"
            className="w-full px-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-pink-400 focus:outline-none text-center text-lg bg-white"
            required
            autoFocus
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-pink-400 to-purple-500 text-white font-bold text-lg shadow-lg disabled:opacity-50"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </main>
  );
}
