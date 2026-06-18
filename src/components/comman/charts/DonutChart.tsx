import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const FONT = "'Poppins', sans-serif";

const DEFAULT_COLORS = [
  '#D97757', '#2C2A28', '#8C8A82', '#2D8A4E',
  '#2156A8', '#B36200', '#7C3AED', '#C0392B',
];

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

interface TooltipPayload { name: string; value: number; payload: DonutSegment }
interface CustomTooltipProps {
  active?:  boolean;
  payload?: TooltipPayload[];
  total:    number;
}

function ChartTooltip({ active, payload, total }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const seg = payload[0];
  const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0';
  return (
    <div className="bg-white border border-bone rounded-lg px-3 py-[6px] shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-xs">
      <p className="text-slate mb-0.5">{seg.name}</p>
      <p className="font-bold text-charcoal">{seg.value.toLocaleString()} <span className="font-normal text-slate">({pct}%)</span></p>
    </div>
  );
}

export interface DonutChartProps {
  data:        DonutSegment[];
  title?:      string;
  subtitle?:   string;
  size?:       number;
  innerRadius?: number;
  showLegend?: boolean;
  centerLabel?: string;
}

export function DonutChart({
  data,
  title,
  subtitle,
  size = 200,
  innerRadius,
  showLegend = true,
  centerLabel,
}: DonutChartProps) {
  const total    = data.reduce((s, d) => s + d.value, 0);
  const ir       = innerRadius ?? Math.round(size * 0.33);
  const or       = Math.round(size * 0.47);
  const segments = data.map((d, i) => ({ ...d, color: d.color ?? DEFAULT_COLORS[i % DEFAULT_COLORS.length] }));

  return (
    <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-5">
      {(title || subtitle) && (
        <div className="mb-4">
          {title    && <p className="text-sm font-bold text-charcoal">{title}</p>}
          {subtitle && <p className="text-xs text-slate mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div className="flex items-center gap-6">
        {/* Donut */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={segments}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                innerRadius={ir}
                outerRadius={or}
                paddingAngle={2}
                startAngle={90}
                endAngle={-270}
                strokeWidth={0}
              >
                {segments.map((seg, i) => (
                  <Cell key={i} fill={seg.color} />
                ))}
              </Pie>
              <Tooltip
                content={<ChartTooltip total={total} />}
                wrapperStyle={{ fontFamily: FONT }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          {centerLabel && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <p className="text-[11px] text-slate">{centerLabel}</p>
              <p className="text-[18px] font-bold text-charcoal leading-[1.2]">{total.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Legend */}
        {showLegend && (
          <div className="flex flex-col gap-[10px] min-w-0">
            {segments.map(seg => {
              const pct = total > 0 ? ((seg.value / total) * 100).toFixed(1) : '0';
              return (
                <div key={seg.label} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: seg.color }} />
                  <span className="text-[12px] text-[#4A4945] flex-1 truncate">{seg.label}</span>
                  <span className="text-[12px] font-semibold text-charcoal ml-2">{pct}%</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
