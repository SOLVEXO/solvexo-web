import { clsx } from 'clsx';

interface LogoProps {
  size?:          number;
  showWordmark?:  boolean;
  className?:     string;
}

export function SolvexoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0"
    >
      <rect width="32" height="32" rx="8" fill="#D97757"/>
      <text x="4" y="26" fontFamily="'Poppins',sans-serif" fontWeight="800" fontSize="26" fill="white">s</text>
      <rect x="16.5" y="2" width="13" height="13" rx="3.5" fill="#C8694E" fillOpacity="0.7"/>
      <path d="M23 11.5V5.5M23 5.5L20 8.5M23 5.5L26 8.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function SolvexoLogo({ size = 32, showWordmark = true, className }: LogoProps) {
  const textSize = Math.round(size * 0.53);
  return (
    <div className={clsx('flex items-center gap-2', className)}>
      <SolvexoIcon size={size} />
      {showWordmark && (
        <div className="flex items-center" style={{ fontSize: textSize }}>
          <span className="font-bold text-carbon tracking-tight">Solvex</span>
          <span className="font-bold text-brand-orange tracking-tight">o</span>
        </div>
      )}
    </div>
  );
}
