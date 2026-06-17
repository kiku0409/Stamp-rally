'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Camera } from 'lucide-react';

interface QRScannerProps {
  onScan: (token: string) => void;
  onClose: () => void;
}

function extractToken(raw: string): string | null {
  try {
    const url = new URL(raw);
    const parts = url.pathname.split('/');
    const idx = parts.indexOf('event');
    if (idx !== -1 && parts[idx + 1]) {
      return parts[idx + 1];
    }
  } catch {
    // not a URL — treat raw value as token
  }
  if (/^[a-zA-Z0-9_-]+$/.test(raw.trim())) {
    return raw.trim();
  }
  return null;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  const stopCamera = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  useEffect(() => {
    let active = true;

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError('このブラウザはカメラに対応していません。HTTPS接続が必要です。');
        return;
      }

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
      } catch (e: unknown) {
        if (!active) return;
        const err = e as { name?: string };
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('カメラの使用が許可されていません。ブラウザの設定をご確認ください。');
        } else {
          setError('カメラを起動できませんでした。別のアプリが使用中の可能性があります。');
        }
        return;
      }

      if (!active) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
      setReady(true);

      // Dynamically import ZXing to avoid SSR issues
      const { BrowserMultiFormatReader } = await import('@zxing/browser');
      if (!active) return;

      const reader = new BrowserMultiFormatReader();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      function scanFrame() {
        if (!active || !videoRef.current || !ctx) return;
        const video = videoRef.current;
        if (video.readyState < video.HAVE_ENOUGH_DATA) {
          animFrameRef.current = requestAnimationFrame(scanFrame);
          return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        try {
          const result = reader.decodeFromCanvas(canvas);
          if (result) {
            const token = extractToken(result.getText());
            if (token) {
              stopCamera();
              onScan(token);
              return;
            }
          }
        } catch {
          // no QR found in frame, continue scanning
        }
        animFrameRef.current = requestAnimationFrame(scanFrame);
      }

      animFrameRef.current = requestAnimationFrame(scanFrame);
    }

    start();
    return () => {
      active = false;
      stopCamera();
    };
  }, [onScan, stopCamera]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ backgroundColor: 'rgba(0,0,0,0.92)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <p className="text-white text-[15px] font-medium">QRコードをかざしてください</p>
        <button
          onClick={handleClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white"
        >
          <X size={20} strokeWidth={2} />
        </button>
      </div>

      {/* Camera view */}
      <div className="flex-1 flex items-center justify-center px-6">
        {error ? (
          <div className="text-center max-w-xs">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Camera size={28} strokeWidth={2} className="text-white/60" />
            </div>
            <p className="text-white text-[15px] font-medium mb-2">カメラを起動できません</p>
            <p className="text-white/60 text-[13px] leading-relaxed mb-6">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-3 rounded-xl btn-brand text-white font-bold text-[14px]"
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-xs aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover rounded-2xl"
              playsInline
              muted
            />
            {/* Scan frame corners */}
            <div className="absolute inset-0 rounded-2xl">
              {/* Corner markers */}
              {[
                'top-0 left-0 border-t-4 border-l-4 rounded-tl-xl',
                'top-0 right-0 border-t-4 border-r-4 rounded-tr-xl',
                'bottom-0 left-0 border-b-4 border-l-4 rounded-bl-xl',
                'bottom-0 right-0 border-b-4 border-r-4 rounded-br-xl',
              ].map((cls, i) => (
                <div
                  key={i}
                  className={`absolute w-8 h-8 border-accent ${cls}`}
                />
              ))}
            </div>
            {!ready && (
              <div className="absolute inset-0 flex items-center justify-center rounded-2xl" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div className="w-10 h-10 rounded-full border-[3px] border-white/20 border-t-accent animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>

      <div className="px-6 pb-8 text-center">
        <p className="text-white/40 text-[12px]">
          会場に掲示されているQRコードをカメラに向けてください
        </p>
      </div>
    </div>
  );
}
