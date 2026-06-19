'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, X, UserPlus, Trash2, KeyRound } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getAccessToken } from '@/lib/adminAuth';
import { Event, Project, ProjectMember, ProjectRole, ProjectStatus } from '@/types';
import { formatDate } from '@/lib/utils';

interface MemberRow extends ProjectMember {
  email: string | null;
}
interface EventWithStats extends Event {
  stampCount: number;
}
interface Stamper {
  stamped_at: string;
  participants: { nickname: string } | null;
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

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<Project | null>(null);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const router = useRouter();
  const [myRole, setMyRole] = useState<ProjectRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviting, setInviting] = useState(false);
  const [qrEvent, setQrEvent] = useState<EventWithStats | null>(null);
  const [stampersEvent, setStampersEvent] = useState<EventWithStats | null>(null);
  const [stampers, setStampers] = useState<Stamper[]>([]);
  const [stampersLoading, setStampersLoading] = useState(false);

  useEffect(() => { loadData(); }, [id]);

  async function authHeaders() {
    const token = await getAccessToken();
    return { 'Authorization': `Bearer ${token}` };
  }

  async function loadData() {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}`, { headers });
    if (!res.ok) { setLoading(false); return; }
    const data = await res.json();
    setProject(data.project);
    setMembers(data.members ?? []);
    setMyRole(data.myRole ?? null);

    const evs: Event[] = data.events ?? [];
    const withStats = await Promise.all(
      evs.map(async (ev) => {
        const r = await fetch(`/api/admin/stats?event_id=${ev.id}`, { headers });
        const s = await r.json();
        return { ...ev, stampCount: s.stampCount || 0 };
      })
    );
    setEvents(withStats);
    setLoading(false);
  }

  async function handleInvite(e: { preventDefault: () => void }) {
    e.preventDefault();
    setInviting(true);
    setInviteError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/members`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: inviteEmail }),
    });
    if (res.ok) {
      setInviteEmail('');
      loadData();
    } else {
      const d = await res.json();
      setInviteError(d.error || '招待に失敗しました');
    }
    setInviting(false);
  }

  async function handleRemoveMember(userId: string, email: string | null) {
    if (!confirm(`「${email ?? 'このメンバー'}」をプロジェクトから外しますか？`)) return;
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/members?user_id=${userId}`, { method: 'DELETE', headers });
    if (res.ok) loadData();
    else { const d = await res.json(); alert(d.error || '削除に失敗しました'); }
  }

  async function handleDeleteProject() {
    if (!confirm('このプロジェクトを削除しますか？\n配下のイベント・スタンプもすべて削除され、元に戻せません。')) return;
    setDeleting(true);
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}`, { method: 'DELETE', headers });
    if (res.ok) {
      router.push('/admin');
    } else {
      const d = await res.json();
      alert(d.error || '削除に失敗しました');
      setDeleting(false);
    }
  }

  async function openStampers(ev: EventWithStats) {
    setStampersEvent(ev);
    setStampers([]);
    setStampersLoading(true);
    const headers = await authHeaders();
    const res = await fetch(`/api/admin/event-stamps?event_id=${ev.id}`, { headers });
    const data = await res.json();
    setStampers(Array.isArray(data) ? data : []);
    setStampersLoading(false);
  }

  const qrUrl = qrEvent
    ? (typeof window !== 'undefined' ? window.location.origin : '') + `/event/${qrEvent.qr_token}/stamp`
    : '';

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 rounded-full border-[3px] border-line border-t-accent animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!project) {
    return (
      <AdminLayout>
        <p className="text-center text-muted py-10 text-[14px]">プロジェクトが見つかりません</p>
      </AdminLayout>
    );
  }

  const isApproved = project.status === 'approved';
  const isOwner = myRole === 'owner';
  // 承認済みプロジェクトのメンバーのみ編集可。スーパー管理者(myRole=null)は閲覧のみ。
  const canEdit = isApproved && myRole !== null;

  return (
    <AdminLayout>
      <div className="max-w-lg">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/admin" className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={20} strokeWidth={2} />
          </Link>
          <h1 className="text-[20px] font-bold text-ink flex-1 truncate">{project.name}</h1>
          <span className={`shrink-0 text-[11px] font-medium px-2 py-1 rounded-full border ${STATUS_CLASS[project.status]}`}>
            {STATUS_LABEL[project.status]}
          </span>
        </div>

        {project.description && (
          <p className="text-[13px] text-muted mb-5">{project.description}</p>
        )}

        {!isApproved && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
            <p className="text-[13px] text-amber-800">
              {project.status === 'pending'
                ? 'スーパー管理者の承認待ちです。承認されるとイベントを作成できます。'
                : 'このプロジェクトは却下されました。'}
            </p>
          </div>
        )}

        {/* Events */}
        {isApproved && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-ink">イベント</h2>
              {canEdit && (
                <Link
                  href={`/admin/events/new?project_id=${id}`}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-[9px] btn-brand text-white text-[12px] font-bold"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  新規作成
                </Link>
              )}
            </div>
            {events.length === 0 ? (
              <div className="bg-white rounded-2xl p-6 text-center border border-line card-shadow">
                <p className="text-muted text-[13px]">まだイベントがありません</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {events.map((ev) => (
                  <div key={ev.id} className="bg-white rounded-2xl p-4 border border-line card-shadow">
                    <div className="flex items-start justify-between">
                      <button className="flex-1 text-left" onClick={() => openStampers(ev)}>
                        <h3 className="font-bold text-ink text-[14px]">{ev.title}</h3>
                        <p className="text-[12px] text-muted mt-0.5">{formatDate(ev.event_date)} · {ev.venue}</p>
                        <p className={`text-[12px] font-bold mt-1 ${ev.stampCount > 0 ? 'text-accent' : 'text-faint'}`}>
                          スタンプ取得数 {ev.stampCount}
                        </p>
                      </button>
                      <div className="flex items-center gap-1.5 ml-3">
                        <button
                          onClick={() => setQrEvent(ev)}
                          className="px-3 py-1.5 rounded-lg border border-line text-[12px] text-muted hover:border-accent hover:text-accent transition-colors"
                        >
                          QR
                        </button>
                        {canEdit && (
                          <Link
                            href={`/admin/events/${ev.id}`}
                            className="px-3 py-1.5 rounded-lg border border-line text-[12px] text-muted hover:border-accent hover:text-accent transition-colors"
                          >
                            編集
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Members */}
        <section>
          <h2 className="text-[15px] font-bold text-ink mb-3">メンバー</h2>
          <div className="space-y-2">
            {members.map((m) => (
              <div key={m.id} className="bg-white rounded-2xl p-3.5 border border-line card-shadow flex items-center justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-ink text-[13px] truncate">{m.email ?? '(不明なユーザー)'}</p>
                  <p className="text-[11px] text-muted mt-0.5">{m.role === 'owner' ? 'オーナー' : 'メンバー'}</p>
                </div>
                {isOwner && m.role !== 'owner' && (
                  <button
                    onClick={() => handleRemoveMember(m.user_id, m.email)}
                    className="p-2 rounded-lg border border-danger-border text-danger hover:bg-danger-soft transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={2} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {isOwner && (
            <form onSubmit={handleInvite} className="mt-3 bg-white rounded-2xl p-4 border border-line card-shadow">
              <div className="flex items-center gap-2 mb-2">
                <UserPlus size={15} strokeWidth={2} className="text-accent" />
                <span className="font-bold text-ink text-[13px]">メンバーを招待</span>
              </div>
              <p className="text-[11px] text-muted mb-2">登録済みの管理者のメールアドレスを入力してください。</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="member@example.com"
                  required
                  className="flex-1 px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
                />
                <button
                  type="submit"
                  disabled={inviting}
                  className="px-4 rounded-xl btn-brand text-white font-bold text-[13px] disabled:opacity-50 disabled:shadow-none"
                >
                  {inviting ? '...' : '追加'}
                </button>
              </div>
              {inviteError && <p className="text-danger text-[12px] mt-2">{inviteError}</p>}
            </form>
          )}

          {/* Join code (members only) */}
          {myRole && project.join_code && (
            <div className="mt-3 bg-grad-soft border border-teal-border rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-1.5">
                <KeyRound size={15} strokeWidth={2} className="text-accent-deep" />
                <span className="font-bold text-ink text-[13px]">参加コード</span>
              </div>
              <p className="text-[11px] text-muted mb-2">このコードを共同編集者に伝えると、相手がコード入力で参加できます。</p>
              <p className="text-[22px] font-bold text-accent-deep tracking-[0.3em]" style={{ fontFamily: 'var(--font-mono)' }}>
                {project.join_code}
              </p>
            </div>
          )}
        </section>

        {/* Delete project (owner only) */}
        {isOwner && (
          <button
            onClick={handleDeleteProject}
            disabled={deleting}
            className="w-full mt-6 py-3 rounded-xl border border-danger-border text-danger text-[14px] font-medium flex items-center justify-center gap-2 hover:bg-danger-soft transition-colors disabled:opacity-50"
          >
            <Trash2 size={14} strokeWidth={2} />
            {deleting ? '削除中...' : 'このプロジェクトを削除'}
          </button>
        )}
      </div>

      {/* QR Modal */}
      {qrEvent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setQrEvent(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm border border-line card-shadow" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-ink text-[15px] truncate flex-1 mr-2">{qrEvent.title}</h2>
              <button onClick={() => setQrEvent(null)} className="text-faint hover:text-muted transition-colors">
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <QRCodeDisplay url={qrUrl} eventTitle={qrEvent.title} />
          </div>
        </div>
      )}

      {/* Stampers modal */}
      {stampersEvent && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center" onClick={() => setStampersEvent(null)}>
          <div className="bg-white rounded-t-2xl w-full max-w-lg p-6 max-h-[70vh] flex flex-col border-t border-line" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-ink text-[15px]">{stampersEvent.title}</h2>
                <p className="text-[12px] text-muted">スタンプ取得者一覧</p>
              </div>
              <button onClick={() => setStampersEvent(null)} className="text-faint hover:text-muted transition-colors">
                <X size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="overflow-y-auto flex-1">
              {stampersLoading ? (
                <div className="flex justify-center py-8">
                  <div className="w-8 h-8 rounded-full border-[3px] border-line border-t-accent animate-spin" />
                </div>
              ) : stampers.length === 0 ? (
                <p className="text-center text-muted py-8 text-[14px]">まだスタンプ取得者がいません</p>
              ) : (
                <ul>
                  {stampers.map((s, i) => (
                    <li key={i} className="flex items-center justify-between py-2.5 border-b border-line last:border-0">
                      <span className="font-medium text-ink text-[14px]">{s.participants?.nickname ?? '不明'}</span>
                      <span className="text-[11px] text-faint" style={{ fontFamily: 'var(--font-mono)' }}>
                        {new Date(s.stamped_at).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
