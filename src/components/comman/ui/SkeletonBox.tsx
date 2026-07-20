import { clsx } from 'clsx';

interface SkeletonBoxProps {
  width?:     number | string;
  height?:    number | string;
  rounded?:   string;
  className?: string;
}

export function SkeletonBox({ width, height, rounded = '4px', className }: SkeletonBoxProps) {
  return (
    <div
      className={clsx('skeleton-shimmer', className)}
      style={{ width, height, borderRadius: rounded }}
    />
  );
}
