import {
  LineChart as RechartsLine, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';

const FONT = "'Poppins', sans-serif";
const TICK = { fontSize: 11, fill: '#8C8A82', fontFamily: FONT };
const GRID = { stroke: '#E8E6DC', strokeDasharray: '4 4' };

const DEFAULT_COLORS = ['#D97757', '#2C2A28', '#8C8A82', '#2D8A4E'];

export interface LineSeries {
  dataKey: string;
  label:   string;
  color?:  string;
}

interface TooltipPayload { value: number; name: string; color: string }
interface MultiTooltipProps {
  active?:  boolean;
  payload?: TooltipPayload[];
  label?:   string;
  valuePrefix?: string;
  valueSuffix?: string;
}

function ChartTooltip({ active, payload, label, valuePrefix = '', valueSuffix = '' }: MultiTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-2 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-xs min-w-[120px]">
      <p className="text-slate mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="text-[#4A4945]">{p.name}</span>
          </span>
          <span className="font-bold text-charcoal">{valuePrefix}{p.value.toLocaleString()}{valueSuffix}</span>
        </div>
      ))}
    </div>
  );
}

export interface LineChartProps {
  data:         Record<string, unknown>[];
  lines:        LineSeries[];
  xKey?:        string;
  title?:       string;
  subtitle?:    string;
  height?:      number;
  valuePrefix?: string;
  valueSuffix?: string;
  yTickFormatter?: (v: number) => string;
  showLegend?:  boolean;
}

export function LineChart({
  data,
  lines,
  xKey = 'label',
  title,
  subtitle,
  height = 240,
  valuePrefix = '',
  valueSuffix = '',
  yTickFormatter,
  showLegend = true,
}: LineChartProps) {
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
        <RechartsLine data={data} margin={{ top: 4, right: 20, left: 0, bottom: showLegend ? 0 : 4 }}>
          <CartesianGrid {...GRID} vertical={false} />
          <XAxis dataKey={xKey} tick={TICK} axisLine={false} tickLine={false} />
          <YAxis tick={TICK} axisLine={false} tickLine={false} tickFormatter={yFmt} width={46} />
          <Tooltip content={<ChartTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />} />
          {showLegend && (
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: 11, fontFamily: FONT, color: '#8C8A82', paddingTop: 8 }}
            />
          )}
          {lines.map((line, i) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.label}
              stroke={line.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length]}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
          ))}
        </RechartsLine>
      </ResponsiveContainer>
    </div>
  );
}
