import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AreaChart as RechartsArea, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { CHART_TICK, CHART_GRID, CHART_DEFAULT_COLOR } from './chartTheme';

interface TooltipPayload { value: number }
interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  valuePrefix?: string;
  valueSuffix?: string;
}

function ChartTooltip({ active, payload, label, valuePrefix = '', valueSuffix = '' }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-[6px] text-xs">
      <p className="text-slate mb-0.5">{label}</p>
      <p className="font-bold text-charcoal">{valuePrefix}{payload[0].value.toLocaleString()}{valueSuffix}</p>
    </div>
  );
}

export interface AreaChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  height?: number;
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  yTickFormatter?: (v: number) => string;
  /** True while a refetch (e.g. a range-filter change) is in flight — keeps the
   *  previous chart visible underneath a subtle overlay instead of either
   *  blanking the chart or silently leaving stale data with no loading signal. */
  loading?: boolean;
  /** Shown when `data` has points but every value is 0 (e.g. a new store with
   *  no sales yet in the selected range) — distinct from the "no data at all"
   *  case below, since a flat/invisible line with no message reads as broken. */
  emptyValueLabel?: string;
}

export function AreaChart({
  data,
  dataKey,
  xKey = 'label',
  title,
  subtitle,
  action,
  height = 220,
  color = CHART_DEFAULT_COLOR,
  valuePrefix = '',
  valueSuffix = '',
  yTickFormatter,
  loading = false,
  emptyValueLabel = 'No revenue in this period yet',
}: AreaChartProps) {
  const gradId = `area-grad-${dataKey}`;
  const defaultYFmt = (v: number) =>
    v >= 1000 ? `${valuePrefix}${(v / 1000).toFixed(0)}k` : `${valuePrefix}${v}`;
  const yFmt = yTickFormatter ?? defaultYFmt;
  const ariaLabel = title ? `${title} chart` : 'Chart';
  const hasPoints = data.length > 0;
  const hasValue = data.some(d => Number(d[dataKey]) !== 0);
  const showEmptyState = !hasPoints || !hasValue;

  const header = (title || subtitle || action) ? (
    <div className="px-5 pt-4 pb-2 flex items-center justify-between gap-3">
      <div className="min-w-0">
        {title    && <p className="text-sm font-bold text-charcoal">{title}</p>}
        {subtitle && <p className="text-xs text-slate mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  ) : null;

  return (
    <div
      className="bg-white border border-bone rounded-[10px] transition-colors duration-200 hover:border-slate/30"
      role="img"
      aria-label={ariaLabel}
    >
      {header}
      <div className="relative">
        {showEmptyState ? (
          <div className="flex items-center justify-center" style={{ height }}>
            <p className="text-slate text-[13px]">{hasPoints ? emptyValueLabel : 'No data yet'}</p>
          </div>
        ) : (
          <div className="px-3 pb-4">
            <ResponsiveContainer width="100%" height={height}>
              <RechartsArea data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...CHART_GRID} vertical={false} />
                <XAxis dataKey={xKey}  tick={CHART_TICK} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_TICK} axisLine={false} tickLine={false} tickFormatter={yFmt} width={46} />
                <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
                <Area
                  // Linear, not smoothed — a monotone curve bows a bulge
                  // between two real points (e.g. Rs0 → a sale → Rs0), which
                  // reads as gradual rise-and-fall that never actually
                  // happened. Real revenue-over-time charts (Shopify, Stripe)
                  // plot sparse period data linearly for the same reason.
                  type="linear"
                  dataKey={dataKey}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#${gradId})`}
                  dot={false}
                  activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
                />
              </RechartsArea>
            </ResponsiveContainer>
          </div>
        )}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-white/70 rounded-b-[10px]"
            aria-hidden
          >
            <Loader2 size={20} className="animate-spin text-slate" />
          </div>
        )}
      </div>
    </div>
  );
}
