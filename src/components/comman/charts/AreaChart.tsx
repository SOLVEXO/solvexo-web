import type { ReactNode } from 'react';
import {
  AreaChart as RechartsArea, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const FONT  = "'Poppins', sans-serif";
const TICK  = { fontSize: 11, fill: '#8C8A82', fontFamily: FONT };
const GRID  = { stroke: '#E8E6DC', strokeDasharray: '4 4' };

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
    <div className="bg-white border border-bone rounded-lg px-3 py-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-xs">
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
}

export function AreaChart({
  data,
  dataKey,
  xKey = 'label',
  title,
  subtitle,
  action,
  height = 220,
  color = '#D97757',
  valuePrefix = '',
  valueSuffix = '',
  yTickFormatter,
}: AreaChartProps) {
  const gradId = `area-grad-${dataKey}`;
  const defaultYFmt = (v: number) =>
    v >= 1000 ? `${valuePrefix}${(v / 1000).toFixed(0)}k` : `${valuePrefix}${v}`;
  const yFmt = yTickFormatter ?? defaultYFmt;

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {(title || subtitle || action) && (
        <div className="px-5 pt-4 pb-2 flex items-center justify-between">
          <div>
            {title    && <p className="text-sm font-bold text-charcoal">{title}</p>}
            {subtitle && <p className="text-xs text-slate mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="px-3 pb-4">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsArea data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.22} />
              <stop offset="95%" stopColor={color} stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey={xKey}  tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={yFmt} width={46} />
          <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
          <Area
            type="monotone"
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
    </div>
  );
}
