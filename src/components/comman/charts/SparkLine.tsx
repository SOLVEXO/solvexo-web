import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface TooltipPayload { value: number }
interface SparkTooltipProps {
  active?:      boolean;
  payload?:     TooltipPayload[];
  valuePrefix?: string;
  valueSuffix?: string;
}

function SparkTooltip({ active, payload, valuePrefix = '', valueSuffix = '' }: SparkTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-bone rounded-md px-2 py-1 shadow-[0_4px_12px_rgba(0,0,0,0.08)] text-[11px]">
      <span className="font-bold text-charcoal">{valuePrefix}{payload[0].value.toLocaleString()}{valueSuffix}</span>
    </div>
  );
}

export interface SparkLineProps {
  data:         number[];
  color?:       string;
  width?:       number;
  height?:      number;
  valuePrefix?: string;
  valueSuffix?: string;
  showTooltip?: boolean;
}

export function SparkLine({
  data,
  color = '#D97757',
  width = 80,
  height = 36,
  valuePrefix = '',
  valueSuffix = '',
  showTooltip = true,
}: SparkLineProps) {
  const chartData = data.map((v, i) => ({ i, v }));
  const gradId = `spark-grad-${color.replace('#', '')}`;

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
              <stop offset="95%" stopColor={color} stopOpacity={0}   />
            </linearGradient>
          </defs>
          {showTooltip && (
            <Tooltip
              content={<SparkTooltip valuePrefix={valuePrefix} valueSuffix={valueSuffix} />}
              cursor={false}
            />
          )}
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.8}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 3, fill: color, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
