import { useEffect, useRef } from 'react';

interface UzbekPatternCanvasProps {
  parallaxOffset: number;
}

export function UzbekPatternCanvas({ parallaxOffset }: UzbekPatternCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const drawPattern = () => {
      const parent = canvas.parentElement;
      const w = parent ? parent.clientWidth : 800;
      const h = parent ? parent.clientHeight : 520;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#0D0A07';
      ctx.fillRect(0, 0, w, h);

      const cell = 112;
      const cols = Math.ceil(w / cell) + 2;
      const rows = Math.ceil(h / cell) + 2;

      for (let r = -1; r < rows; r++) {
        for (let c = -1; c < cols; c++) {
          const cx = c * cell + (r % 2 === 0 ? 0 : cell * 0.5);
          const cy = r * cell * 0.866;

          // Subtle muted emerald / terracotta geometric fill
          ctx.fillStyle =
            (r + c) % 2 === 0 ? 'rgba(45, 74, 62, 0.16)' : 'rgba(139, 58, 42, 0.12)';
          ctx.beginPath();
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const radius = i % 2 === 0 ? 38 : 18;
            const px = cx + Math.cos(angle) * radius;
            const py = cy + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();

          // Gold 8-point girih star outline
          ctx.strokeStyle = 'rgba(201, 168, 76, 0.24)';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Rotated overlapping square lattice
          ctx.save();
          ctx.translate(cx, cy);
          ctx.rotate(Math.PI / 4);
          ctx.strokeStyle = 'rgba(201, 168, 76, 0.11)';
          ctx.strokeRect(-26, -26, 52, 52);
          ctx.restore();

          // Center gold pearl
          ctx.fillStyle = 'rgba(201, 168, 76, 0.35)';
          ctx.beginPath();
          ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    drawPattern();
    window.addEventListener('resize', drawPattern);
    return () => window.removeEventListener('resize', drawPattern);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        transform: `translate3d(0, ${parallaxOffset}px, 0)`,
      }}
      className="pointer-events-none absolute -top-12 inset-x-0 h-[calc(100%+6rem)] w-full transition-transform duration-75"
    />
  );
}
