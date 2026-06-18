'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, UserPlus, Trash2 } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { getAccessToken, getCurrentUser, isSuperAdmin } from '@/lib/adminAuth';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!isSuperAdmin(user)) {
        router.replace('/admin');
        return;
      }
      setAuthorized(true);
      loadAdmins();
    });
  }, [router]);

  async function loadAdmins() {
    const token = await getAccessToken();
    const res = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    setAdmins(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  const handleCreate = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');
    const token = await getAccessToken();
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(`${data.email} を追加しました`);
      setForm({ email: '', password: '' });
      loadAdmins();
    } else {
      setError(data.error || '作成に失敗しました');
    }
    setCreating(false);
  };

  const handleDelete = async (userId: string, email: string) => {
    if (!confirm(`「${email}」を削除しますか？`)) return;
    const token = await getAccessToken();
    const res = await fetch(`/api/admin/users?user_id=${userId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (res.ok) {
      loadAdmins();
    } else {
      const data = await res.json();
      alert(data.error || '削除に失敗しました');
    }
  };

  if (!authorized || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          <button onClick={() => router.back()} className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </button>
          <h1 className="text-[20px] font-bold text-ink">管理者一覧</h1>
        </div>

        {/* 新規追加フォーム */}
        <form onSubmit={handleCreate} className="bg-white rounded-2xl p-5 border border-line card-shadow mb-5 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <UserPlus size={15} strokeWidth={2} className="text-accent" />
            <h2 className="font-bold text-ink text-[14px]">管理者を追加</h2>
          </div>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="メールアドレス"
            required
            className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
          />
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
            placeholder="初期パスワード（8文字以上）"
            required
            minLength={8}
            className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
          />
          {error && <p className="text-danger text-[13px]">{error}</p>}
          {success && <p className="text-accent text-[13px]">{success}</p>}
          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 rounded-xl btn-brand text-white font-bold text-[14px] disabled:opacity-50 disabled:shadow-none"
          >
            {creating ? '追加中...' : '追加する'}
          </button>
        </form>

        {/* 管理者一覧 */}
        <div className="space-y-2">
          {admins.map((admin) => (
            <div key={admin.id} className="bg-white rounded-2xl p-4 border border-line card-shadow flex items-center justify-between">
              <div>
                <p className="font-medium text-ink text-[14px]">{admin.email}</p>
                <p className="text-[11px] text-muted mt-0.5">
                  {admin.role === 'super_admin' ? 'スーパー管理者' : '管理者'}
                </p>
              </div>
              {admin.role !== 'super_admin' && (
                <button
                  onClick={() => handleDelete(admin.id, admin.email)}
                  className="p-2 rounded-lg border border-danger-border text-danger hover:bg-danger-soft transition-colors"
                >
                  <Trash2 size={14} strokeWidth={2} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
