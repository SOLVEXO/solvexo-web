import { SkeletonBox } from '@/components/comman/ui';

/** Loading placeholder shaped like a chart card — used while any chart's data is in flight. */
export function ChartCardSkeleton({ height = 220 }: { height?: number }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] p-5">
      <SkeletonBox height={14} width="30%" className="mb-4" />
      <SkeletonBox height={height} width="100%" rounded="8px" />
    </div>
  );
}

/** Loading placeholder shaped like a table card — used while any table's rows are in flight. */
export function TableCardSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-3">
      <SkeletonBox height={14} width="30%" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBox key={i} height={36} width="100%" rounded="6px" />
      ))}
    </div>
  );
}
