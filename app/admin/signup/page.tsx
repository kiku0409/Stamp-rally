'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import { signUp, signIn } from '@/lib/adminAuth';

export default function AdminSignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');
    try {
      await signUp(email, password);
      // メール確認が無効なら自動でセッションが張られる。明示的にログインも試みる。
      try {
        await signIn(email, password);
        router.push('/admin');
      } catch {
        setInfo('登録しました。確認メールが届いている場合は確認後にログインしてください。');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '登録に失敗しました';
      setError(message);
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
            <UserPlus size={22} strokeWidth={2} />
          </div>
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent inline-block" />
            <span className="text-[11px] text-muted font-medium tracking-wider">管理者登録</span>
          </div>
          <h1 className="text-[22px] font-bold text-ink">アカウント作成</h1>
          <p className="text-[12px] text-muted mt-2">
            登録後、プロジェクトを申請しスーパー管理者の承認を受けるとイベントを作成できます。
          </p>
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
            placeholder="パスワード（6文字以上）"
            minLength={6}
            className="w-full px-4 py-3.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[15px] bg-white text-ink"
            required
          />
          {error && <p className="text-danger text-[13px] text-center">{error}</p>}
          {info && <p className="text-accent text-[13px] text-center">{info}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? '登録中...' : 'アカウントを作成'}
          </button>
        </form>

        <p className="text-center text-[13px] text-muted mt-5">
          すでにアカウントをお持ちですか？{' '}
          <Link href="/admin/login" className="text-accent font-medium">ログイン</Link>
        </p>
      </div>
    </main>
  );
}
