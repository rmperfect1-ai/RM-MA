import { useEffect, useState } from 'react';
import type { DishVisualStyle } from '../types/restaurant';

interface DishVisualProps {
  style: DishVisualStyle;
  title: string;
  imageUrl?: string;
  priceLabel?: string;
  featured?: boolean;
}

export function DishVisual({
  style,
  title,
  imageUrl,
  priceLabel,
  featured,
}: DishVisualProps) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [imageUrl]);

  if (imageUrl && !imgFailed) {
    return (
      <div className="tilt-card-media-layer relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-[#120E0A]">
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover contrast-[1.03] saturate-[1.06] transition-transform duration-500 will-change-transform group-hover:scale-[1.06]"
        />
        {/* Crisp top specular rim & gentle bottom edge blend — preserves bright razor-sharp dish center */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#14100C]/85 via-transparent to-[#0A0806]/15 ring-1 ring-inset ring-[#E6CB7D]/18"
        />

        {featured && (
          <span className="tilt-card-float-price absolute left-3 top-3 inline-flex items-center rounded border border-[#E6CB7D]/60 bg-[#0A0806]/85 px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase text-[#E6CB7D] shadow-md backdrop-blur-sm">
            Signature
          </span>
        )}

        {priceLabel && (
          <span className="tilt-card-float-price absolute bottom-2.5 right-3 inline-flex items-center rounded-md border border-[#E6CB7D]/55 bg-[#0A0806]/88 px-2.5 py-1 text-xs font-bold tabular-nums tracking-wide text-[#E6CB7D] shadow-lg backdrop-blur-sm">
            {priceLabel}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="relative aspect-[4/3] w-full overflow-hidden rounded-t-xl bg-[#120E0A]"
      role="img"
      aria-label={`${title} plated presentation`}
    >
      <div
        aria-hidden="true"
        className="absolute -left-6 -top-6 h-28 w-28 rounded-full bg-[#C9A84C]/14 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-8 right-2 h-32 w-32 rounded-full bg-[#8B3A2A]/22 blur-2xl"
      />
      <svg
        viewBox="0 0 320 240"
        className="relative h-full w-full"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={`plateGrad-${style}`} cx="50%" cy="46%" r="52%">
            <stop offset="0%" stopColor="#262019" />
            <stop offset="75%" stopColor="#16120E" />
            <stop offset="100%" stopColor="#0E0B08" />
          </radialGradient>
        </defs>
        <ellipse
          cx="160"
          cy="120"
          rx="86"
          ry="68"
          fill={`url(#plateGrad-${style})`}
          stroke="#C9A84C"
          strokeOpacity="0.6"
          strokeWidth="1.6"
        />
      </svg>
    </div>
  );
}
