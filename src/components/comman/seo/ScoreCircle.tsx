interface ScoreCircleProps {
  score:      number;
  size?:      number;
  showLabel?: boolean;
}

function scoreColorClass(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-warning';
  return 'text-error';
}

function scoreStrokeVar(score: number): string {
  if (score >= 80) return 'var(--color-success)';
  if (score >= 60) return 'var(--color-warning)';
  return 'var(--color-error)';
}

export function ScoreCircle({ score, size = 84, showLabel = true }: ScoreCircleProps) {
  const radius = (size / 84) * 32;
  const center = size / 2;
  const circ   = 2 * Math.PI * radius;
  const dash   = (Math.max(0, Math.min(100, score)) / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={center} cy={center} r={radius} fill="none" stroke="var(--color-bone)" strokeWidth={size * 0.083} />
      <circle
        cx={center} cy={center} r={radius} fill="none"
        stroke={scoreStrokeVar(score)}
        strokeWidth={size * 0.083}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
      {showLabel && (
        <text
          x={center} y={center + size * 0.06}
          textAnchor="middle"
          fontSize={size * 0.18}
          fontWeight="700"
          className={`fill-current ${scoreColorClass(score)}`}
        >
          {Math.round(score)}
        </text>
      )}
    </svg>
  );
}
