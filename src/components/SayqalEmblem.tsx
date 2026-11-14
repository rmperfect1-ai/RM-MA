export function SayqalEmblem({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="sayqal-gold-flame" x1="12" y1="8" x2="52" y2="58" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5E3A1" />
          <stop offset="50%" stopColor="#D4AF5A" />
          <stop offset="100%" stopColor="#9A7225" />
        </linearGradient>
      </defs>
      {/* Left leaf */}
      <path
        d="M25 50C15 44 13 31 19 21C22 29 25 36 28 45C27 47 26 48.5 25 50Z"
        fill="url(#sayqal-gold-flame)"
      />
      {/* Central tall teardrop flame */}
      <path
        d="M32 7C39 17 41 29 33 42C29 48 31 54 33 57C24 51 22 39 27 28C29.5 22 31.5 15 32 7Z"
        fill="url(#sayqal-gold-flame)"
      />
      {/* Right sweeping curl */}
      <path
        d="M44 22C50 30 49 43 39 51C36 53 34 55 33 57C37 49 42 41 42 32C42 28 43 25 44 22Z"
        fill="url(#sayqal-gold-flame)"
      />
    </svg>
  );
}
