import { type ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from './Card';
import { SkeletonBox } from './SkeletonBox';
import { SparkLine } from '@/components/comman/charts';
import { useCountUp } from '@/hooks/useCountUp';

interface MetricCardProps {
  label:    string;
  value:    string | number;
  trend?:   string;
  trendUp?: boolean;
  sub?:     string;
  icon?:    ReactNode;
  loading?: boolean;
  /** Overrides the default brand-orange icon background/foreground color. */
  color?:   string;
  /** Optional trend series (e.g. the same data already powering the page's main chart) rendered as a small sparkline. Omit if no matching series exists — never fabricate one. */
  sparkline?: number[];
}

export function MetricCard({ label, value, trend, trendUp, sub, icon, loading, color, sparkline }: MetricCardProps) {
  if (loading) {
    return (
      <Card className="flex-1 min-w-[140px]">
        <SkeletonBox height={9} width={36} rounded="4px" className="mb-3" />
        <SkeletonBox height={11} width="60%" rounded="4px" className="mb-3" />
        <SkeletonBox height={26} width="80%" rounded="6px" className="mb-2" />
        <SkeletonBox height={12} width="40%" rounded="4px" />
      </Card>
    );
  }

  const accent = color ?? '#D97757';
  // The number is the reason this card exists — it counts up from its
  // previous value (not from zero every re-render) the first time it
  // scrolls into view, so "value → importance → change" reads as one
  // designed moment instead of three static lines of text.
  const { display, ref: valueRef } = useCountUp<HTMLParagraphElement>(value);

  return (
    <Card className="metric-card-enter flex-1 min-w-[140px] group" padding="none" hover>
      <div className="px-5 py-5 relative overflow-hidden">
        {/* A faint directional glow anchored to the icon corner — the one
           deliberate "surprise" per card (rule 27: 90% precision / 10%
           surprise), not a glow applied to every surface on the page. */}
        {icon && (
          <div
            aria-hidden
            className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-slow pointer-events-none"
            style={{ background: `radial-gradient(circle, ${accent}22, transparent 70%)` }}
          />
        )}
        <div className="flex items-start justify-between gap-3 mb-3 relative">
          {icon && (
            <div
              className={color ? 'w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-normal ease-spring group-hover:scale-110 group-hover:-rotate-3' : 'w-9 h-9 rounded-[10px] bg-brand-pale-orange flex items-center justify-center text-brand-orange shrink-0 transition-transform duration-normal ease-spring group-hover:scale-110 group-hover:-rotate-3'}
              style={color ? { background: `${color}18`, color } : undefined}
            >
              {icon}
            </div>
          )}
          {sparkline && sparkline.length > 1 && (
            <div className="opacity-70 group-hover:opacity-100 transition-opacity duration-normal">
              <SparkLine data={sparkline} color={accent} width={64} height={28} showTooltip={false} />
            </div>
          )}
        </div>
        <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">
          {label}
        </p>
        <p ref={valueRef} className="text-[28px] font-bold text-carbon leading-[1.15] tabular-nums tracking-tight">
          {display}
        </p>
        {trend && (
          <span className={`inline-flex items-center gap-1 text-[11.5px] font-semibold mt-[7px] px-[7px] py-[2px] rounded-full tabular-nums ${trendUp ? 'text-success bg-success-bg' : 'text-error bg-error-bg'}`}>
            {trendUp
              ? <TrendingUp  size={12} className="shrink-0" />
              : <TrendingDown size={12} className="shrink-0" />}
            {trend}
          </span>
        )}
        {sub && (
          <p className="text-[11px] text-slate mt-[7px]">{sub}</p>
        )}
      </div>
    </Card>
  );
}
