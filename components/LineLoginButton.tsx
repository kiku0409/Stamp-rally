import { MessageCircle } from 'lucide-react';

interface LineLoginButtonProps {
  returnTo?: string;
  label?: string;
}

// LINEログイン開始ボタン。OAuth開始はcookie設定を伴うフルページ遷移が必要なため
// <a href> を使う（router.push / fetch 不可）。
export default function LineLoginButton({ returnTo, label = 'LINEでログイン' }: LineLoginButtonProps) {
  const href = returnTo
    ? `/api/auth/line/login?returnTo=${encodeURIComponent(returnTo)}`
    : '/api/auth/line/login';
  return (
    <a
      href={href}
      className="flex items-center justify-center gap-2 w-full py-[14px] rounded-xl text-white font-bold text-[15px] transition-opacity hover:opacity-90"
      style={{ background: '#06C755' }}
    >
      <MessageCircle size={17} strokeWidth={2} fill="currentColor" />
      {label}
    </a>
  );
}
