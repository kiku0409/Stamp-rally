'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, X } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { getAccessToken, getCurrentUser, isSuperAdmin } from '@/lib/adminAuth';
import { Project, ProjectStatus } from '@/types';

const STATUS_LABEL: Record<ProjectStatus, string> = {
  pending: '承認待ち',
  approved: '承認済み',
  rejected: '却下',
};
const STATUS_CLASS: Record<ProjectStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-soft text-accent-deep border-teal-border',
  rejected: 'bg-danger-soft text-danger border-danger-border',
};

export default function SuperAdminPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser().then((user) => {
      if (!isSuperAdmin(user)) {
        router.replace('/admin');
        return;
      }
      setAuthorized(true);
      loadData();
    });
  }, [router]);

  async function loadData() {
    const token = await getAccessToken();
    const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
    const data = await res.json();
    setProjects(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  async function act(projectId: string, action: 'approve' | 'reject') {
    let reason: string | null = null;
    if (action === 'reject') {
      reason = window.prompt('却下理由を入力してください（任意・申請者に表示されます）', '');
      if (reason === null) return; // キャンセル
    }
    setBusyId(projectId);
    const token = await getAccessToken();
    const res = await fetch(`/api/projects/${projectId}/${action}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: action === 'reject' ? JSON.stringify({ reason }) : undefined,
    });
    if (res.ok) await loadData();
    else { const d = await res.json(); alert(d.error || '操作に失敗しました'); }
    setBusyId(null);
  }

  if (!authorized || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  const pending = projects.filter((p) => p.status === 'pending');
  const others = projects.filter((p) => p.status !== 'pending');

  return (
    <AdminLayout>
      <h1 className="text-[22px] font-bold text-ink mb-5">承認・全体管理</h1>

      <section className="mb-7">
        <h2 className="text-[15px] font-bold text-ink mb-3">承認待ち（{pending.length}）</h2>
        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-line card-shadow">
            <p className="text-muted text-[13px]">承認待ちのプロジェクトはありません</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {pending.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl p-4 border border-line card-shadow">
                <Link href={`/admin/projects/${p.id}`} className="block mb-3">
                  <h3 className="font-bold text-ink text-[14px]">{p.name}</h3>
                  {p.description && <p className="text-[12px] text-muted mt-0.5">{p.description}</p>}
                </Link>
                <div className="flex gap-2">
                  <button
                    onClick={() => act(p.id, 'approve')}
                    disabled={busyId === p.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg btn-brand text-white text-[13px] font-bold disabled:opacity-50"
                  >
                    <Check size={14} strokeWidth={2.5} />
                    承認
                  </button>
                  <button
                    onClick={() => act(p.id, 'reject')}
                    disabled={busyId === p.id}
                    className="flex-1 flex items-center justify-center gap-1 py-2 rounded-lg border border-danger-border text-danger text-[13px] font-medium hover:bg-danger-soft transition-colors disabled:opacity-50"
                  >
                    <X size={14} strokeWidth={2.5} />
                    却下
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-[15px] font-bold text-ink mb-3">すべてのプロジェクト</h2>
        {others.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 text-center border border-line card-shadow">
            <p className="text-muted text-[13px]">まだありません</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {others.map((p) => (
              <Link
                key={p.id}
                href={`/admin/projects/${p.id}`}
                className="block bg-white rounded-2xl p-4 border border-line card-shadow hover:border-accent transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-ink text-[14px] truncate">{p.name}</h3>
                    {p.description && <p className="text-[12px] text-muted mt-0.5 line-clamp-1">{p.description}</p>}
                  </div>
                  <span className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full border ${STATUS_CLASS[p.status]}`}>
                    {STATUS_LABEL[p.status]}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AdminLayout>
  );
}
