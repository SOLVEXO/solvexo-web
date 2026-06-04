import { Card } from './Card';

interface MetricCardProps {
  label: string;
  value: string | number;
  trend?: string;
  trendUp?: boolean;
  sub?: string;
}

// Reference exact values:
// label: size 11, weight 500, color slate, uppercase, letterSpacing "0.06em", mb 4
// value: size 26, weight 700, color carbon, lineHeight 1.2
// trend: size 12, color success/error, mt 4
// sub:   size 11, color slate, mt 2
export function MetricCard({ label, value, trend, trendUp, sub }: MetricCardProps) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <p
        className="block text-[11px] font-medium text-slate uppercase mb-1"
        style={{ letterSpacing: '0.06em', fontFamily: "'Poppins', sans-serif" }}
      >
        {label}
      </p>
      <p
        className="block text-[26px] font-bold text-carbon"
        style={{ lineHeight: 1.2, fontFamily: "'Poppins', sans-serif" }}
      >
        {value}
      </p>
      {trend && (
        <p
          className={`block text-[12px] mt-1 ${trendUp ? 'text-success' : 'text-error'}`}
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {trendUp ? '▲' : '▼'} {trend}
        </p>
      )}
      {sub && (
        <p
          className="block text-[11px] text-slate mt-0.5"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          {sub}
        </p>
      )}
    </Card>
  );
}
