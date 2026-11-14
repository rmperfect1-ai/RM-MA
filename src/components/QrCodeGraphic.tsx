import QRCode from 'qrcode';
import { useEffect, useState } from 'react';

interface QrCodeGraphicProps {
  value: string;
  alt: string;
  size?: number;
  className?: string;
}

export function QrCodeGraphic({
  value,
  alt,
  size = 200,
  className = 'h-40 w-40 rounded-md border border-[#C9A84C]/40 bg-[#F5EDD6] p-1.5',
}: QrCodeGraphicProps) {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 2,
      color: {
        dark: '#0A0806',
        light: '#F5EDD6',
      },
    })
      .then((url) => {
        if (!cancelled) setDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setDataUrl('');
      });

    return () => {
      cancelled = true;
    };
  }, [value, size]);

  if (!dataUrl) {
    return (
      <div
        className={`flex items-center justify-center rounded-md border border-[#C9A84C]/25 bg-[#14100C] text-[11px] text-[#B8AE98] ${className}`}
      >
        QR tayyorlanmoqda...
      </div>
    );
  }

  return <img src={dataUrl} alt={alt} className={className} data-testid="qr-code-img" />;
}
