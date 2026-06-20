'use client';

import { useState } from 'react';
import { Camera, Gift, Check, X, RotateCcw } from 'lucide-react';
import AdminLayout from '@/components/AdminLayout';
import QRScanner from '@/components/QRScanner';
import { getAccessToken } from '@/lib/adminAuth';

interface RewardInfo {
  nickname: string;
  label: string;
  threshold: number;
  project_name: string;
  redeemed_at: string | null;
}

function fmt(d: string) {
  return new Date(d).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RedeemPage() {
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<RewardInfo | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  async function lookup(c: string) {
    setLoading(true);
    setError('');
    setInfo(null);
    setCode(c);
    const token = await getAccessToken();
    const res = await fetch(`/api/rewards/redeem?code=${encodeURIComponent(c)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) setInfo(data);
    else setError(data.error || '照合に失敗しました');
    setLoading(false);
  }

  function handleScan(c: string) {
    setShowScanner(false);
    lookup(c);
  }

  async function handleRedeem() {
    setRedeeming(true);
    setError('');
    const token = await getAccessToken();
    const res = await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (res.ok || res.status === 409) setInfo(data);
    else setError(data.error || '使用済み化に失敗しました');
    setRedeeming(false);
  }

  function reset() {
    setInfo(null);
    setError('');
    setCode('');
    setManualCode('');
  }

  return (
    <AdminLayout>
      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <h1 className="text-[22px] font-bold text-ink mb-2">特典の引き換え</h1>
      <p className="text-[13px] text-muted mb-5">来場者の特典QRをスキャンすると、名前と特典内容が表示されます。</p>

      {!info && (
        <div className="space-y-3">
          <button
            onClick={() => setShowScanner(true)}
            className="w-full py-[14px] rounded-xl btn-brand text-white font-bold text-[15px] flex items-center justify-center gap-2"
          >
            <Camera size={18} strokeWidth={2} />
            QRをスキャン
          </button>

          <div className="bg-white rounded-2xl p-4 border border-line card-shadow">
            <p className="text-[12px] text-muted mb-2">コードを直接入力して照合することもできます。</p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                placeholder="引き換えコード"
                className="flex-1 px-3 py-2.5 rounded-xl border border-line focus:border-accent focus:outline-none text-[14px] text-ink bg-white tracking-widest"
                style={{ fontFamily: 'var(--font-mono)' }}
              />
              <button
                onClick={() => manualCode && lookup(manualCode)}
                disabled={!manualCode || loading}
                className="px-4 rounded-xl btn-brand text-white font-bold text-[13px] disabled:opacity-50 disabled:shadow-none"
              >
                {loading ? '...' : '照合'}
              </button>
            </div>
          </div>
          {error && <p className="text-danger text-[13px]">{error}</p>}
        </div>
      )}

      {info && (
        <div className="space-y-4">
          <div className={`rounded-2xl p-5 border card-shadow ${info.redeemed_at ? 'bg-danger-soft border-danger-border' : 'bg-white border-line'}`}>
            <div className="flex items-center gap-2 mb-3">
              <Gift size={18} strokeWidth={2} className="text-accent-deep" />
              <span className="font-bold text-ink text-[15px]">{info.label}</span>
            </div>
            <div className="space-y-1.5 text-[14px]">
              <div className="flex justify-between"><span className="text-muted">お名前</span><span className="font-bold text-ink">{info.nickname}</span></div>
              <div className="flex justify-between"><span className="text-muted">プロジェクト</span><span className="text-ink">{info.project_name}</span></div>
              <div className="flex justify-between"><span className="text-muted">条件</span><span className="text-ink">{info.threshold}個</span></div>
            </div>

            {info.redeemed_at ? (
              <div className="mt-4 flex items-center gap-2 text-danger font-bold text-[15px]">
                <X size={18} strokeWidth={2.5} />
                引き換え済み（{fmt(info.redeemed_at)}）
              </div>
            ) : (
              <button
                onClick={handleRedeem}
                disabled={redeeming}
                className="mt-4 w-full py-3 rounded-xl btn-brand text-white font-bold text-[15px] flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Check size={18} strokeWidth={2.5} />
                {redeeming ? '処理中...' : 'お渡し完了（使用済みにする）'}
              </button>
            )}
          </div>

          {error && <p className="text-danger text-[13px]">{error}</p>}

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors"
          >
            <RotateCcw size={15} strokeWidth={2} />
            次の人をスキャン
          </button>
        </div>
      )}
    </AdminLayout>
  );
}
