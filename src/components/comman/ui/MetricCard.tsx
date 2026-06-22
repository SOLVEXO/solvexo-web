import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';
import { SkeletonBox } from './SkeletonBox';

interface MetricCardProps {
  label:    string;
  value:    string | number;
  trend?:   string;
  trendUp?: boolean;
  sub?:     string;
  icon?:    ReactNode;
  loading?: boolean;
}

export function MetricCard({ label, value, trend, trendUp, sub, icon, loading }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="flex-1 min-w-[140px]">
        <SkeletonBox height={11} width="60%" rounded="4px" className="mb-3" />
        <SkeletonBox height={26} width="80%" rounded="6px" className="mb-2" />
        <SkeletonBox height={12} width="40%" rounded="4px" />
      </Card>
    );
  }

  return (
    <Card className="flex-1 min-w-[140px]" padding="none">
      <div className="px-5 py-5">
        {icon && (
          <div className="w-9 h-9 rounded-[10px] bg-brand-pale-orange flex items-center justify-center text-brand-orange mb-3">
            {icon}
          </div>
        )}
        <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">
          {label}
        </p>
        <p className="text-[28px] font-bold text-carbon leading-[1.15]">
          {value}
        </p>
        {trend && (
          <p className={`flex items-center gap-1 text-[12px] mt-1 ${trendUp ? 'text-success' : 'text-error'}`}>
            {trendUp
              ? <TrendingUp  size={13} className="shrink-0" />
              : <TrendingDown size={13} className="shrink-0" />}
            {trend}
          </p>
        )}
        {sub && (
          <p className="text-[11px] text-slate mt-1">{sub}</p>
        )}
      </div>
    </Card>
  );
}
