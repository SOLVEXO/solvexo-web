import { Check, Circle } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '@/components/comman/ui/Card';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';

export interface ChecklistCardItem {
  key:      string;
  label:    string;
  done:     boolean;
  automated?: boolean;
}

interface ChecklistCardProps {
  title?:    string;
  items:     ChecklistCardItem[];
  onToggle?: (key: string, nextDone: boolean) => void;
  loading?:  boolean;
  className?: string;
}

export function ChecklistCard({ title = 'Technical SEO Checklist', items, onToggle, loading, className }: ChecklistCardProps) {
  if (loading) {
    return (
      <Card className={className}>
        <SkeletonBox height={13} width="45%" rounded="4px" className="mb-3" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonBox key={i} height={13} width={`${70 - i * 4}%`} rounded="4px" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <p className="text-[13px] font-semibold text-carbon mb-3">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map(item => {
          const clickable = item.automated === false && !!onToggle;
          return (
            <div
              key={item.key}
              onClick={clickable ? () => onToggle!(item.key, !item.done) : undefined}
              className={clsx('flex items-center gap-2', clickable && 'cursor-pointer group')}
            >
              {item.done ? (
                <Check size={13} className="text-success shrink-0" />
              ) : (
                <Circle size={13} className="text-slate/50 shrink-0" />
              )}
              <span className={clsx(
                'text-[13px]',
                item.done ? 'text-graphite' : 'text-slate',
                clickable && 'group-hover:text-carbon',
              )}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
