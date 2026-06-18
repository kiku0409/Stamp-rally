'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, FolderOpen } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import { getAccessToken } from '@/lib/adminAuth';
import { Project, ProjectStatus, ProjectRole } from '@/types';

interface ProjectRow extends Project {
  role?: ProjectRole;
}

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

export default function AdminDashboard() {
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      const token = await getAccessToken();
      const res = await fetch('/api/projects', { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setProjects(Array.isArray(data) ? data : []);
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
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
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[22px] font-bold text-ink">プロジェクト</h1>
        <Link
          href="/admin/projects/new"
          className="flex items-center gap-1 px-3 py-2 rounded-[9px] btn-brand text-white text-[13px] font-bold"
        >
          <Plus size={14} strokeWidth={2.5} />
          申請する
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center border border-line card-shadow">
          <FolderOpen size={28} strokeWidth={1.5} className="text-faint mx-auto mb-3" />
          <p className="text-muted mb-4 text-[14px]">まだプロジェクトがありません</p>
          <Link href="/admin/projects/new" className="text-accent font-medium text-[14px]">
            プロジェクトを申請する →
          </Link>
          <p className="text-[12px] text-faint mt-3">
            フェスや連続ライブなどの単位で申請し、承認されるとイベントを作成できます。
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/projects/${p.id}`}
              className="block bg-white rounded-2xl p-4 border border-line card-shadow hover:border-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-ink text-[15px] truncate">{p.name}</h3>
                  {p.description && (
                    <p className="text-[12px] text-muted mt-0.5 line-clamp-2">{p.description}</p>
                  )}
                  {p.role === 'owner' && (
                    <span className="inline-block mt-1.5 text-[11px] text-faint">オーナー</span>
                  )}
                </div>
                <span className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full border ${STATUS_CLASS[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
