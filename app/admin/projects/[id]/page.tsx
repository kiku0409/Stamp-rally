'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Plus, X, UserPlus, Trash2, KeyRound, Gift, Pencil, Check, QrCode } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { getAccessToken } from '@/lib/adminAuth';
import { Event, Project, ProjectMember, ProjectRole, ProjectStatus, RewardTier } from '@/types';
import { formatDate } from '@/lib/utils';
import { toCsv, downloadCsv } from '@/lib/csv';
import { THEMES, getTheme, headerGradient } from '@/lib/themes';

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
interface Recipient {
  nickname: string;
  label: string;
  threshold: number;
  issued_at: string;
  redeemed_at: string | null;
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
  const [rewardTiers, setRewardTiers] = useState<RewardTier[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [tierThreshold, setTierThreshold] = useState('');
  const [tierLabel, setTierLabel] = useState('');
  const [tierError, setTierError] = useState('');
  const [addingTier, setAddingTier] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [resubmitting, setResubmitting] = useState(false);
  const [resubmitError, setResubmitError] = useState('');
  const [editTierId, setEditTierId] = useState<string | null>(null);
  const [editTierThreshold, setEditTierThreshold] = useState('');
  const [editTierLabel, setEditTierLabel] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [themeId, setThemeId] = useState('teal');

  useEffect(() => { loadData(); }, [id]);

  async function authHeaders() {
    const token = await getAccessToken();
    return { 'Authorization': `Bearer ${token}` };
  }

  async function loadData() {
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/projects/${id}`, { headers });
      if (!res.ok) return;
      const data = await res.json();
      setProject(data.project);
      setEditName(data.project?.name ?? '');
      setEditDesc(data.project?.description ?? '');
      setThemeId(data.project?.theme_id ?? 'teal');
      setMembers(data.members ?? []);
      setMyRole(data.myRole ?? null);
      setRewardTiers(data.rewardTiers ?? []);
      // stampCount は API が集約済み（イベント毎の逐次取得を廃止）
      setEvents((data.events ?? []) as EventWithStats[]);

      // 特典取得者一覧
      const rr = await fetch(`/api/projects/${id}/rewards`, { headers });
      if (rr.ok) setRecipients(await rr.json());
    } catch {
      // 失敗してもスピナーは止める
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTier(e: { preventDefault: () => void }) {
    e.preventDefault();
    setAddingTier(true);
    setTierError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/reward-tiers`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ threshold: Number(tierThreshold), label: tierLabel }),
    });
    if (res.ok) {
      setTierThreshold('');
      setTierLabel('');
      loadData();
    } else {
      const d = await res.json();
      setTierError(d.error || '追加に失敗しました');
    }
    setAddingTier(false);
  }

  async function handleDeleteTier(tierId: string) {
    if (!confirm('この段階を削除しますか？\n取得済みの記録も削除されます。')) return;
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/reward-tiers?tier_id=${tierId}`, { method: 'DELETE', headers });
    if (res.ok) loadData();
    else { const d = await res.json(); alert(d.error || '削除に失敗しました'); }
  }

  function exportRecipientsCsv() {
    const rows = recipients.map((r) => [
      r.nickname,
      r.label,
      r.threshold,
      new Date(r.issued_at).toLocaleString('ja-JP'),
      r.redeemed_at ? '引換済' : '未引換',
      r.redeemed_at ? new Date(r.redeemed_at).toLocaleString('ja-JP') : '',
    ]);
    const csv = toCsv(['ニックネーム', '特典', '必要個数', '獲得日時', '引換状態', '引換日時'], rows);
    downloadCsv(`特典取得者_${project?.name ?? ''}.csv`, csv);
  }

  async function exportStampsCsv() {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/stamps`, { headers });
    if (!res.ok) { alert('取得に失敗しました'); return; }
    const data: { event_title: string; nickname: string; stamped_at: string }[] = await res.json();
    const rows = data.map((d) => [d.event_title, d.nickname, new Date(d.stamped_at).toLocaleString('ja-JP')]);
    const csv = toCsv(['イベント', 'ニックネーム', '取得日時'], rows);
    downloadCsv(`スタンプ取得者_${project?.name ?? ''}.csv`, csv);
  }

  function startEditTier(t: RewardTier) {
    setEditTierId(t.id);
    setEditTierThreshold(String(t.threshold));
    setEditTierLabel(t.label);
  }

  async function handleSaveTier() {
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}/reward-tiers`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier_id: editTierId, threshold: Number(editTierThreshold), label: editTierLabel }),
    });
    if (res.ok) {
      setEditTierId(null);
      loadData();
    } else {
      const d = await res.json();
      alert(d.error || '更新に失敗しました');
    }
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

  async function handleResubmit(e: { preventDefault: () => void }) {
    e.preventDefault();
    setResubmitting(true);
    setResubmitError('');
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName, description: editDesc, resubmit: true }),
    });
    if (res.ok) {
      loadData();
    } else {
      const d = await res.json();
      setResubmitError(d.error || '再申請に失敗しました');
    }
    setResubmitting(false);
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

  async function handleSaveName() {
    if (!editName.trim()) return;
    setSavingName(true);
    const headers = await authHeaders();
    const res = await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    });
    if (res.ok) {
      setEditingName(false);
      loadData();
    }
    setSavingName(false);
  }

  async function handleSaveTheme(newThemeId: string) {
    setThemeId(newThemeId);
    const headers = await authHeaders();
    await fetch(`/api/projects/${id}`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ theme_id: newThemeId }),
    });
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
          {editingName && isOwner ? (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false); }}
                autoFocus
                maxLength={50}
                className="flex-1 min-w-0 text-[18px] font-bold text-ink border-b-2 border-accent outline-none bg-transparent"
              />
              <button onClick={handleSaveName} disabled={savingName || !editName.trim()} className="text-accent-deep disabled:opacity-40 shrink-0">
                <Check size={18} strokeWidth={2.5} />
              </button>
              <button onClick={() => setEditingName(false)} className="text-muted shrink-0">
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <h1 className="text-[20px] font-bold text-ink truncate">{project.name}</h1>
              {isOwner && (
                <button onClick={() => setEditingName(true)} className="text-muted hover:text-accent-deep transition-colors shrink-0">
                  <Pencil size={14} strokeWidth={2} />
                </button>
              )}
            </div>
          )}
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
                : 'このプロジェクトは却下されました。内容を修正して再申請できます。'}
            </p>
            {project.status === 'rejected' && project.reject_reason && (
              <p className="text-[12px] text-amber-900 mt-2 bg-amber-100 rounded-lg px-3 py-2">
                却下理由: {project.reject_reason}
              </p>
            )}
          </div>
        )}

        {/* Edit & resubmit (rejected, owner only) */}
        {project.status === 'rejected' && isOwner && (
          <form onSubmit={handleResubmit} className="bg-white rounded-2xl p-5 border border-line card-shadow mb-5 space-y-3">
            <h2 className="font-bold text-ink text-[14px]">内容を修正して再申請</h2>
            <div>
              <label className="block text-[12px] font-medium text-ink mb-1">プロジェクト名</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-ink mb-1">概要</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white resize-none"
              />
            </div>
            {resubmitError && <p className="text-danger text-[12px]">{resubmitError}</p>}
            <button
              type="submit"
              disabled={resubmitting}
              className="w-full py-2.5 rounded-xl btn-brand text-white font-bold text-[14px] disabled:opacity-50 disabled:shadow-none"
            >
              {resubmitting ? '再申請中...' : '修正して再申請する'}
            </button>
          </form>
        )}

        {/* Theme selector (owner only, approved projects) */}
        {isApproved && isOwner && (
          <section className="mb-6">
            <div
              className="h-1.5 rounded-t-xl"
              style={{ background: headerGradient(getTheme(themeId)) }}
            />
            <div className="bg-white rounded-b-2xl p-4 border border-t-0 border-line card-shadow">
              <h2 className="text-[14px] font-bold text-ink mb-3">テーマカラー</h2>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((t) => {
                  const selected = themeId === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSaveTheme(t.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[12px] font-medium transition-all ${
                        selected
                          ? 'border-transparent text-white'
                          : 'border-line text-muted hover:border-line/60'
                      }`}
                      style={selected ? { background: headerGradient(t) } : {}}
                    >
                      <span
                        className="w-4 h-4 rounded-full shrink-0 border-2"
                        style={{
                          background: `linear-gradient(135deg, ${t.headerFrom}, ${t.headerTo})`,
                          borderColor: selected ? 'rgba(255,255,255,0.6)' : t.accent,
                        }}
                      />
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Events */}
        {isApproved && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-[15px] font-bold text-ink">イベント</h2>
              <div className="flex items-center gap-2">
                {events.length > 0 && (
                  <button onClick={exportStampsCsv} className="text-[12px] text-accent font-medium border border-teal-border rounded-lg px-2.5 py-1.5 hover:bg-soft transition-colors">
                    スタンプCSV
                  </button>
                )}
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

        {/* Slots (動的QR) */}
        {isApproved && canEdit && (
          <section className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <QrCode size={16} strokeWidth={2} className="text-accent" />
                <h2 className="text-[15px] font-bold text-ink">スロット管理（動的QR）</h2>
              </div>
              <Link
                href={`/admin/projects/${id}/slots`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-[9px] border border-teal-border text-accent text-[12px] font-bold hover:bg-soft transition-colors"
              >
                スロット一覧・設定
              </Link>
            </div>
            <div className="bg-white rounded-2xl px-5 py-4 border border-line card-shadow">
              <p className="text-[13px] text-muted">
                印刷済みQR1枚で時間帯ごとに異なるスタンプが押せます。スロット設定でタイムテーブルを管理してください。
              </p>
            </div>
          </section>
        )}

        {/* Reward tiers */}
        <section className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Gift size={16} strokeWidth={2} className="text-accent" />
            <h2 className="text-[15px] font-bold text-ink">特典段階</h2>
          </div>
          {rewardTiers.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 border border-line card-shadow">
              <p className="text-muted text-[13px]">まだ特典段階がありません。{isOwner ? '下のフォームで追加できます。' : ''}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {rewardTiers.map((t) => (
                <div key={t.id} className="bg-white rounded-2xl p-3.5 border border-line card-shadow">
                  {editTierId === t.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        min={1}
                        value={editTierThreshold}
                        onChange={(e) => setEditTierThreshold(e.target.value)}
                        className="w-16 px-2 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-[13px] text-ink bg-white"
                      />
                      <input
                        value={editTierLabel}
                        onChange={(e) => setEditTierLabel(e.target.value)}
                        className="flex-1 px-2 py-2 rounded-lg border border-line focus:border-accent focus:outline-none text-[13px] text-ink bg-white"
                      />
                      <button onClick={handleSaveTier} className="px-3 py-2 rounded-lg btn-brand text-white text-[12px] font-bold">保存</button>
                      <button onClick={() => setEditTierId(null)} className="px-2 py-2 rounded-lg border border-line text-muted text-[12px]">取消</button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[13px] font-bold text-accent shrink-0">{t.threshold}個</span>
                        <span className="text-[13px] text-ink truncate">{t.label}</span>
                      </div>
                      {isOwner && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => startEditTier(t)}
                            className="p-2 rounded-lg border border-line text-muted hover:border-accent hover:text-accent transition-colors"
                          >
                            <Pencil size={14} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() => handleDeleteTier(t.id)}
                            className="p-2 rounded-lg border border-danger-border text-danger hover:bg-danger-soft transition-colors"
                          >
                            <Trash2 size={14} strokeWidth={2} />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {isOwner && (
            <form onSubmit={handleAddTier} className="mt-3 bg-white rounded-2xl p-4 border border-line card-shadow">
              <p className="text-[12px] text-muted mb-2">スタンプ数の閾値と特典名を設定（複数段階可）。</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={1}
                  value={tierThreshold}
                  onChange={(e) => setTierThreshold(e.target.value)}
                  placeholder="個数"
                  required
                  className="w-20 px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
                />
                <input
                  value={tierLabel}
                  onChange={(e) => setTierLabel(e.target.value)}
                  placeholder="特典名（例: 限定ステッカー）"
                  required
                  className="flex-1 px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white"
                />
                <button
                  type="submit"
                  disabled={addingTier}
                  className="px-4 rounded-xl btn-brand text-white font-bold text-[13px] disabled:opacity-50 disabled:shadow-none"
                >
                  {addingTier ? '...' : '追加'}
                </button>
              </div>
              {tierError && <p className="text-danger text-[12px] mt-2">{tierError}</p>}
            </form>
          )}
        </section>

        {/* Reward recipients */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[15px] font-bold text-ink">特典取得者（{recipients.length}）</h2>
            <div className="flex items-center gap-2">
              {recipients.length > 0 && (
                <button onClick={exportRecipientsCsv} className="text-[12px] text-accent font-medium border border-teal-border rounded-lg px-2.5 py-1.5 hover:bg-soft transition-colors">
                  CSV
                </button>
              )}
              <Link href="/admin/redeem" className="text-[12px] text-white font-bold btn-brand rounded-lg px-2.5 py-1.5">
                引き換えスキャン
              </Link>
            </div>
          </div>
          {recipients.length === 0 ? (
            <div className="bg-white rounded-2xl p-4 border border-line card-shadow">
              <p className="text-muted text-[13px]">まだ特典取得者がいません</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-line card-shadow divide-y divide-line">
              {recipients.map((r, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-2.5">
                  <div className="min-w-0">
                    <span className="text-[14px] font-medium text-ink">{r.nickname}</span>
                    <span className="text-[12px] text-muted ml-2">{r.label}（{r.threshold}個）</span>
                  </div>
                  {r.redeemed_at ? (
                    <span className="text-[10px] text-danger font-medium shrink-0">引換済</span>
                  ) : (
                    <span className="text-[10px] text-accent font-medium shrink-0">未引換</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

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
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setStampersEvent(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[70vh] flex flex-col border border-line card-shadow" onClick={(e) => e.stopPropagation()}>
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
