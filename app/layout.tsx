import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ subsets: ['latin'] });

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
      <body className={`${geist.className} bg-gray-50 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}
