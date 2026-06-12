import type { Metadata, Viewport } from 'next';
import { Zen_Kaku_Gothic_New } from 'next/font/google';
import './globals.css';

const zenKaku = Zen_Kaku_Gothic_New({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: 'スタンプラリー | ライブ来場スタンプ',
  description: 'ライブイベント向けデジタル来場スタンプアプリ',
  icons: { icon: '/favicon.ico' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className={`${zenKaku.className} bg-page min-h-screen text-ink`}>
        {children}
      </body>
    </html>
  );
}
