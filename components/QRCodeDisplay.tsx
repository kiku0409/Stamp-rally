'use client';

import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';

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
      color: { dark: '#17302E', light: '#ffffff' },
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
      <canvas ref={canvasRef} className="rounded-xl" style={{ boxShadow: '0 1px 2px rgba(7,60,56,.05), 0 6px 18px rgba(7,60,56,.07)' }} />
      <p
        className="text-[11px] text-muted break-all text-center max-w-xs"
        style={{ fontFamily: 'var(--font-mono)' }}
      >
        {url}
      </p>
      <button
        onClick={handleDownload}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl btn-brand text-white text-[14px] font-bold"
      >
        <Download size={14} strokeWidth={2} />
        QRコードをダウンロード
      </button>
    </div>
  );
}
