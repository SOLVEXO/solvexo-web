import {
  BarChart as RechartsBar, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const FONT = "'Poppins', sans-serif";
const TICK = { fontSize: 11, fill: '#8C8A82', fontFamily: FONT };
const GRID = { stroke: '#E8E6DC', strokeDasharray: '4 4' };

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

export interface BarChartProps {
  data: Record<string, unknown>[];
  dataKey: string;
  xKey?: string;
  title?: string;
  subtitle?: string;
  height?: number;
  color?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  maxBarSize?: number;
  yTickFormatter?: (v: number) => string;
}

export function BarChart({
  data,
  dataKey,
  xKey = 'label',
  title,
  subtitle,
  height = 220,
  color = '#D97757',
  valuePrefix = '',
  valueSuffix = '',
  maxBarSize = 40,
  yTickFormatter,
}: BarChartProps) {
  const defaultYFmt = (v: number) =>
    v >= 1000 ? `${valuePrefix}${(v / 1000).toFixed(0)}k` : `${valuePrefix}${v}`;
  const yFmt = yTickFormatter ?? defaultYFmt;

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      {(title || subtitle) && (
        <div className="px-5 pt-4 pb-2">
          {title    && <p className="text-sm font-bold text-charcoal">{title}</p>}
          {subtitle && <p className="text-xs text-slate mt-0.5">{subtitle}</p>}
        </div>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <RechartsBar data={data} margin={{ top: 4, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey={xKey}  tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={yFmt} width={40} />
          <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
          <Bar dataKey={dataKey} fill={color} radius={[4, 4, 0, 0]} maxBarSize={maxBarSize} />
        </RechartsBar>
      </ResponsiveContainer>
    </div>
  );
}
