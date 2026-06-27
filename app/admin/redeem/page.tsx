'use client';

import { useState } from 'react';
import { Camera, Gift, Check, X, RotateCcw, AlertTriangle } from 'lucide-react';
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

type Step = 'scan' | 'loading' | 'preview' | 'confirm' | 'redeeming' | 'done';

function fmt(d: string) {
  return new Date(d).toLocaleString('ja-JP', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function InfoCard({ info }: { info: RewardInfo }) {
  return (
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
    </div>
  );
}

export default function RedeemPage() {
  const [step, setStep] = useState<Step>('scan');
  const [showScanner, setShowScanner] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [code, setCode] = useState('');
  const [info, setInfo] = useState<RewardInfo | null>(null);
  const [error, setError] = useState('');

  async function lookup(c: string) {
    setStep('loading');
    setError('');
    setInfo(null);
    setCode(c);
    const token = await getAccessToken();
    const res = await fetch(`/api/rewards/redeem?code=${encodeURIComponent(c)}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (res.ok) {
      setInfo(data);
      setStep('preview');
    } else {
      setError(data.error || '照合に失敗しました');
      setStep('scan');
    }
  }

  function handleScan(c: string) {
    setShowScanner(false);
    lookup(c);
  }

  async function handleConfirm() {
    setStep('redeeming');
    setError('');
    const token = await getAccessToken();
    const res = await fetch('/api/rewards/redeem', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    if (res.ok || res.status === 409) {
      setInfo(data);
      setStep('done');
    } else {
      setError(data.error || '使用済み化に失敗しました');
      setStep('preview');
    }
  }

  function reset() {
    setInfo(null);
    setError('');
    setCode('');
    setManualCode('');
    setStep('scan');
  }

  return (
    <AdminLayout>
      {showScanner && <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} />}

      <h1 className="text-[22px] font-bold text-ink mb-2">特典の引き換え</h1>
      <p className="text-[13px] text-muted mb-5">来場者の特典QRをスキャンすると、名前と特典内容が表示されます。</p>

      {/* SCAN */}
      {step === 'scan' && (
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
                disabled={!manualCode}
                className="px-4 rounded-xl btn-brand text-white font-bold text-[13px] disabled:opacity-50 disabled:shadow-none"
              >
                照合
              </button>
            </div>
          </div>
          {error && <p className="text-danger text-[13px]">{error}</p>}
        </div>
      )}

      {/* LOADING */}
      {(step === 'loading' || step === 'redeeming') && (
        <div className="text-center py-10">
          <div className="w-[54px] h-[54px] mx-auto mb-4 rounded-full border-[3px] border-line border-t-accent animate-spin" />
          <p className="text-muted text-[14px]">{step === 'loading' ? '照合中...' : '処理中...'}</p>
        </div>
      )}

      {/* PREVIEW */}
      {step === 'preview' && info && (
        <div className="space-y-4">
          <InfoCard info={info} />
          {info.redeemed_at ? (
            <div className="flex items-center gap-2 text-danger font-bold text-[15px]">
              <X size={18} strokeWidth={2.5} />
              引き換え済み（{fmt(info.redeemed_at)}）
            </div>
          ) : (
            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3 rounded-xl btn-brand text-white font-bold text-[15px] flex items-center justify-center gap-2"
            >
              <Gift size={18} strokeWidth={2} />
              引き換えする
            </button>
          )}
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

      {/* CONFIRM */}
      {step === 'confirm' && info && (
        <div className="space-y-4">
          <InfoCard info={info} />
          <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3">
            <AlertTriangle size={16} strokeWidth={2} className="text-yellow-600 mt-0.5 shrink-0" />
            <p className="text-[13px] text-yellow-700 font-medium">引き換えると取り消せません</p>
          </div>
          <button
            onClick={handleConfirm}
            className="w-full py-3 rounded-xl btn-brand text-white font-bold text-[15px] flex items-center justify-center gap-2"
          >
            <Check size={18} strokeWidth={2.5} />
            確定（引き換える）
          </button>
          <button
            onClick={() => setStep('preview')}
            className="w-full py-3 rounded-xl border border-line text-muted text-[14px] font-medium flex items-center justify-center gap-2 hover:border-accent hover:text-accent transition-colors"
          >
            戻る
          </button>
        </div>
      )}

      {/* DONE */}
      {step === 'done' && info && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-8 border border-line card-shadow text-center">
            <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
              <Check size={32} strokeWidth={2.5} className="text-accent" />
            </div>
            <h2 className="text-[20px] font-bold text-ink mb-2">引き換え完了！</h2>
            <p className="text-[15px] font-bold text-accent-deep mb-1">{info.label}</p>
            <p className="text-[14px] text-muted">{info.nickname} さん</p>
          </div>
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
