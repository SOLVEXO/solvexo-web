import { Card } from './Card';

interface MetricCardProps {
  label:    string;
  value:    string | number;
  trend?:   string;
  trendUp?: boolean;
  sub?:     string;
}

// Reference exact values:
// label: 11px, w-500, slate, uppercase, letterSpacing 0.06em, mb 4
// value: 26px, w-700, carbon, lineHeight 1.2
// trend: 12px, success/error, mt 4
// sub:   11px, slate, mt 2
export function MetricCard({ label, value, trend, trendUp, sub }: MetricCardProps) {
  return (
    <Card className="flex-1 min-w-[140px]">
      <p className="block text-[11px] font-medium text-slate uppercase mb-1 tracking-[0.06em]">
        {label}
      </p>
      <p className="block text-[26px] font-bold text-carbon leading-[1.2]">
        {value}
      </p>
      {trend && (
        <p className={`block text-[12px] mt-1 ${trendUp ? 'text-success' : 'text-error'}`}>
          {trendUp ? '▲' : '▼'} {trend}
        </p>
      )}
      {sub && (
        <p className="block text-[11px] text-slate mt-0.5">
          {sub}
        </p>
      )}
    </Card>
  );
}
