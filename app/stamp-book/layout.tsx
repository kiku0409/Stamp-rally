'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronRight, Ticket } from 'lucide-react';
import { StampBookProvider, useStampBook } from './StampBookContext';
import QRScanner from '@/components/QRScanner';
import RewardTicketModal from '@/components/RewardTicketModal';
import BottomNav from '@/components/BottomNav';

function StampBookShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    showScanner, setShowScanner,
    selectedReward, setSelectedReward,
    redeemPopup, setRedeemPopup,
    participant,
    groups,
  } = useStampBook();

  const totalStamps = groups.reduce((sum, g) => sum + g.count, 0);
  const initial = participant?.nickname.charAt(0).toUpperCase() ?? '';

  function handleQRScan(token: string) {
    setShowScanner(false);
    router.push(`/event/${token}/stamp`);
  }

  return (
    <div className="min-h-screen bg-screen-bg">
      {showScanner && (
        <QRScanner
          onScan={handleQRScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      {redeemPopup && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setRedeemPopup(null)}
        >
          <div className="bg-white rounded-2xl px-8 py-10 mx-6 flex flex-col items-center gap-4 shadow-xl text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <Check size={40} strokeWidth={2.5} className="text-green-600" />
            </div>
            <p className="text-[26px] font-bold text-ink">受取完了！</p>
            <p className="text-[15px] text-muted">「{redeemPopup.label}」</p>
          </div>
        </div>
      )}

      {selectedReward && participant && (
        <RewardTicketModal
          reward={selectedReward.reward}
          nickname={participant.nickname}
          projectName={selectedReward.projectName}
          onClose={() => setSelectedReward(null)}
        />
      )}

      {/* 共通グラデーションヘッダー（ログイン時のみ） */}
      {participant && (
        <div className="header-grad sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <Link href="/profile" className="flex items-center gap-3 text-left group">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center">
                  <span className="text-white font-bold text-[15px]">{initial}</span>
                </div>
                <div>
                  <p className="font-bold text-white text-[17px] leading-tight flex items-center gap-1">
                    {participant.nickname} さん
                    <ChevronRight size={15} strokeWidth={2.5} className="text-white/60 group-hover:text-white transition-colors" />
                  </p>
                  <p className="text-white/70 text-[10px]">タップでユーザー情報・復元コード</p>
                </div>
              </Link>
              <div className="text-right">
                <p className="text-white/60 text-[11px]">獲得スタンプ</p>
                <p className="text-white text-[24px] font-bold leading-tight">{totalStamps}</p>
              </div>
            </div>
          </div>
          <div className="max-w-lg mx-auto px-4">
            <div className="relative">
              <div className="border-t-2 border-dashed border-white/20" />
              <div className="absolute -left-4 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: '#F1F8F7' }} />
              <div className="absolute -right-4 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: '#F1F8F7' }} />
            </div>
            <div className="flex items-center justify-center gap-1 py-2">
              <Ticket size={12} strokeWidth={2} className="text-white/40" />
              <span className="text-white/40 text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-mono)' }}>STAMP RALLY</span>
              <Ticket size={12} strokeWidth={2} className="text-white/40" />
            </div>
          </div>
        </div>
      )}

      <div className="pb-24">
        {children}
      </div>

      <BottomNav />
    </div>
  );
}

export default function StampBookLayout({ children }: { children: React.ReactNode }) {
  return (
    <StampBookProvider>
      <StampBookShell>{children}</StampBookShell>
    </StampBookProvider>
  );
}
