'use client';

import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Gift } from 'lucide-react';
import { StampBookReward } from '@/types';

interface Props {
  reward: StampBookReward;
  nickname: string;
  projectName: string;
  onClose: () => void;
}

function fmt(d: string) {
  return new Date(d).toLocaleString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

export default function RewardTicketModal({ reward, nickname, projectName, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const redeemed = !!reward.redeemed_at;

  useEffect(() => {
    if (!canvasRef.current || redeemed) return;
    QRCode.toCanvas(canvasRef.current, reward.redeem_code, {
      width: 220,
      margin: 2,
      color: { dark: '#17302E', light: '#ffffff' },
    });
  }, [reward.redeem_code, redeemed]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden card-shadow" onClick={(e) => e.stopPropagation()}>
        <div className="header-grad px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift size={18} strokeWidth={2} className="text-white" />
            <span className="font-bold text-white text-[15px]">特典チケット</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} strokeWidth={2} /></button>
        </div>

        <div className="p-6 text-center">
          <p className="text-[11px] text-muted mb-1" style={{ fontFamily: 'var(--font-mono)' }}>{projectName}</p>
          <h2 className="text-[20px] font-bold text-ink mb-1">{reward.label}</h2>
          <p className="text-[13px] text-muted mb-4">{nickname} さん</p>

          {redeemed ? (
            <div className="py-8">
              <div className="w-20 h-20 rounded-full bg-danger-soft border border-danger-border flex items-center justify-center mx-auto mb-3 text-danger">
                <X size={32} strokeWidth={2.5} />
              </div>
              <p className="text-danger font-bold text-[16px]">引き換え済み</p>
              <p className="text-muted text-[12px] mt-1">{reward.redeemed_at && fmt(reward.redeemed_at)}</p>
            </div>
          ) : (
            <>
              <div className="flex justify-center mb-3">
                <canvas ref={canvasRef} className="rounded-xl" />
              </div>
              <p className="text-[16px] font-bold text-ink tracking-[0.2em]" style={{ fontFamily: 'var(--font-mono)' }}>
                {reward.redeem_code}
              </p>
              <p className="text-[12px] text-muted mt-3">この画面を会場スタッフに見せてください。</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
