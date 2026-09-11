import { Badge } from '@/components/comman/ui';

const COLORS: Record<string, 'green' | 'yellow' | 'blue' | 'red' | 'gray' | 'orange'> = {
  completed: 'green',
  pending: 'yellow',
  processing: 'blue',
  failed: 'red',
  reversed: 'orange',
};

export function FinanceStatusBadge({ status }: { status: string }) {
  const color = COLORS[status] ?? 'gray';
  return (
    <Badge color={color} size="sm">
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}
