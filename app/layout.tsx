import type { Metadata, Viewport } from 'next';
import { Zen_Kaku_Gothic_New, Roboto_Mono } from 'next/font/google';
import './globals.css';

const zenKaku = Zen_Kaku_Gothic_New({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-zen',
});

const robotoMono = Roboto_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
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
      <body
        className={`${zenKaku.variable} ${robotoMono.variable}`}
        style={{ fontFamily: 'var(--font-zen), sans-serif', backgroundColor: '#F1F8F7', minHeight: '100vh' }}
      >
        {children}
      </body>
    </html>
  );
}
