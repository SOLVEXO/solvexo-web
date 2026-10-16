import { fashionTheme as t } from '../../theme.config';
import type { OrderDetail } from '@/api/services/orders';
import { buildOrderTimeline } from '../../../orderUi';

/** Ordered -> Paid -> Shipped -> Delivered (or pickup / cancelled variants) as a segmented progress bar. */
export function OrderTimeline({ order }: { order: OrderDetail }) {
  const steps = buildOrderTimeline(order);
  const cancelled = order.orderStatus === 'cancelled';
  return (
    <ol aria-label="Order status" className="m-0 grid list-none gap-2 p-0" style={{ gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))` }}>
      {steps.map((step, i) => {
        const bad = cancelled && i === steps.length - 1;
        const color = bad ? t.colors.danger : step.done ? t.colors.ink : t.colors.border;
        return (
          <li key={step.label} aria-current={step.done && !steps[i + 1]?.done ? 'step' : undefined} className="min-w-0">
            <span aria-hidden className="mb-2.5 block h-1.5 rounded-full" style={{ background: color }} />
            <p className="m-0 text-[13px] font-semibold leading-tight" style={{ color: bad ? t.colors.danger : step.done ? t.colors.ink : t.colors.inkMuted }}>
              {step.label}<span className="sr-only">{step.done ? ' (done)' : ' (not yet)'}</span>
            </p>
            {step.date && <p className="m-0 mt-0.5 text-xs" style={{ color: t.colors.inkMuted }}>{step.date}</p>}
          </li>
        );
      })}
    </ol>
  );
}
