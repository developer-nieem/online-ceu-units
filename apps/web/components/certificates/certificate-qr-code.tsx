'use client';

import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

export function CertificateQrCode({
  url,
  size = 120,
  label,
}: {
  url: string;
  size?: number;
  label?: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: size,
    })
      .then((value) => {
        if (!cancelled) setDataUrl(value);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (!dataUrl) {
    return (
      <div
        className="flex items-center justify-center rounded-md border border-dashed bg-white text-xs text-muted-foreground"
        style={{ width: size, height: size }}
        aria-hidden
      >
        QR…
      </div>
    );
  }

  return (
    <figure className="flex flex-col items-center gap-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dataUrl}
        alt={label ?? 'Certificate verification QR code'}
        width={size}
        height={size}
        className="rounded-md border border-slate-200 bg-white p-1.5"
      />
      <figcaption className="max-w-[9rem] text-center text-[10px] leading-tight text-muted-foreground">
        Scan to verify
      </figcaption>
    </figure>
  );
}
