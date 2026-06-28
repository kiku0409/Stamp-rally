'use client';

import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
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
    reload,
  } = useStampBook();

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
