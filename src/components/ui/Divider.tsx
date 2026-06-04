import { clsx } from 'clsx';

export function Divider({ className, my = 4 }: { className?: string; my?: number }) {
  return (
    <div
      className={clsx('h-px bg-bone', className)}
      style={{ marginTop: `${my * 4}px`, marginBottom: `${my * 4}px` }}
    />
  );
}

export function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-pale-orange text-brand-deep-orange text-[11px] font-medium border border-bone">
      {children}
    </span>
  );
}
