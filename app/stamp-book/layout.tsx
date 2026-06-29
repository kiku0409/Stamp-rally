'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Check, ChevronRight, ChevronDown, Ticket } from 'lucide-react';
import { StampBookProvider, useStampBook } from './StampBookContext';
import QRScanner from '@/components/QRScanner';
import RewardTicketModal from '@/components/RewardTicketModal';
import BottomNav from '@/components/BottomNav';
import { getTheme } from '@/lib/themes';

function StampBookShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const {
    showScanner, setShowScanner,
    selectedReward, setSelectedReward,
    redeemPopup, setRedeemPopup,
    participant,
    groups,
    activeProjectId,
    setActiveProject,
  } = useStampBook();

  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const totalStamps = groups.reduce((sum, g) => sum + g.count, 0);
  const initial = participant?.nickname.charAt(0).toUpperCase() ?? '';

  const activeGroup = groups.find(g => g.project.id === activeProjectId) ?? groups[0];
  const activeTheme = getTheme(activeGroup?.project.theme_id);

  function handleQRScan(token: string) {
    setShowScanner(false);
    router.push(`/event/${token}/stamp`);
  }

  const themeVars = {
    '--color-header-from': activeTheme.headerFrom,
    '--color-header-to': activeTheme.headerTo,
    '--color-accent': activeTheme.accent,
    '--color-accent-deep': activeTheme.accentDeep,
    '--color-soft': activeTheme.soft,
    '--color-track': activeTheme.track,
    '--color-screen-bg': activeTheme.screenBg ?? '#F1F8F7',
    ...(activeTheme.ink && { '--color-ink': activeTheme.ink }),
    ...(activeTheme.muted && { '--color-muted': activeTheme.muted }),
    ...(activeTheme.line && { '--color-line': activeTheme.line }),
    ...(activeTheme.cardBg && { '--color-card-bg': activeTheme.cardBg }),
  } as React.CSSProperties;

  return (
    <div className="min-h-screen bg-screen-bg" style={themeVars}>
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

      {/* プロジェクト切り替えシート */}
      {showProjectPicker && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex flex-col justify-end"
          onClick={() => setShowProjectPicker(false)}
        >
          <div
            className="bg-white rounded-t-2xl px-4 pt-4 pb-8 max-h-[60vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 rounded-full bg-line mx-auto mb-4" />
            <p className="text-[13px] font-bold text-muted mb-3 px-1">プロジェクトを切り替え</p>
            {groups.map(g => {
              const t = getTheme(g.project.theme_id);
              const isActive = g.project.id === activeProjectId;
              return (
                <button
                  key={g.project.id}
                  onClick={() => {
                    setActiveProject(g.project.id);
                    setShowProjectPicker(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl mb-1 text-left transition-colors ${
                    isActive ? 'bg-soft' : 'hover:bg-gray-50 active:bg-gray-100'
                  }`}
                >
                  <div
                    className="w-3.5 h-3.5 rounded-full flex-shrink-0"
                    style={{ background: t.accent }}
                  />
                  <span className="flex-1 font-semibold text-[14px] text-ink truncate">
                    {g.project.name}
                  </span>
                  <span className="text-[12px] text-muted">{g.count}個</span>
                  {isActive && <Check size={14} className="text-accent flex-shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 共通グラデーションヘッダー（ログイン時のみ） */}
      {participant && (
        <div className="header-grad sticky top-0 z-10">
          <div className="max-w-lg mx-auto px-4 pt-4 pb-3">
            <div className="flex items-center justify-between">
              <Link href="/profile" className="flex items-center gap-3 text-left group">
                <div className="w-10 h-10 rounded-full bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-[15px]">{initial}</span>
                </div>
                <div>
                  <p className="font-bold text-white text-[17px] leading-tight flex items-center gap-1">
                    {participant.nickname} さん
                    <ChevronRight size={15} strokeWidth={2.5} className="text-white/60 group-hover:text-white transition-colors" />
                  </p>
                  {/* プロジェクト切り替えチップ */}
                  {groups.length > 0 && activeGroup && (
                    <button
                      onClick={e => { e.preventDefault(); setShowProjectPicker(true); }}
                      className="flex items-center gap-1.5 bg-white/20 border border-white/30 rounded-lg px-2 py-0.5 mt-1.5"
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: activeTheme.accent }}
                      />
                      <span className="text-white/90 text-[10px] font-medium truncate max-w-[140px]">
                        {activeGroup.project.name}
                      </span>
                      {groups.length > 1 && (
                        <ChevronDown size={10} className="text-white/70 flex-shrink-0" />
                      )}
                    </button>
                  )}
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
              <div className="absolute -left-4 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: activeTheme.screenBg ?? '#F1F8F7' }} />
              <div className="absolute -right-4 -top-[11px] w-[22px] h-[22px] rounded-full" style={{ backgroundColor: activeTheme.screenBg ?? '#F1F8F7' }} />
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
