'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeDisplayProps {
  url: string;
  eventTitle: string;
}

export default function QRCodeDisplay({ url, eventTitle }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    if (!canvasRef.current) return;
    QRCode.toCanvas(canvasRef.current, url, {
      width: 256,
      margin: 2,
      color: { dark: '#1a1a2e', light: '#ffffff' },
    });
    QRCode.toDataURL(url, { width: 256, margin: 2 }).then(setDataUrl);
  }, [url]);

  const handleDownload = () => {
    if (!dataUrl) return;
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `qr-${eventTitle}.png`;
    a.click();
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas ref={canvasRef} className="rounded-xl shadow-md" />
      <p className="text-xs text-gray-500 break-all text-center max-w-xs">{url}</p>
      <button
        onClick={handleDownload}
        className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-400 to-purple-500 text-white text-sm font-medium shadow active:scale-95 transition-transform"
      >
        QRコードをダウンロード
      </button>
    </div>
  );
}
