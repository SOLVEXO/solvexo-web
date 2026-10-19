import { Card, Page, SkeletonBlock } from '../../ui/primitives';
import { ts } from '@/utils/tStatic';

/** Placeholder shaped like the real checkout (steps on the left, summary on the right). */
export function CheckoutSkeleton() {
  return (
    <Page>
      <div role="status" aria-busy="true" aria-label={ts('checkout.loadingCheckout', 'Loading checkout')}>
        <div className="mb-8 h-10 w-64 animate-pulse rounded-full" style={{ background: 'rgba(127,127,127,.15)' }} />
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-10">
          <div className="order-2 flex flex-col gap-5 lg:order-1">
            {[0, 1, 2].map(i => <Card key={i}><SkeletonBlock h={i === 0 ? 120 : 84} /></Card>)}
          </div>
          <div className="order-1 lg:order-2"><SkeletonBlock h={320} /></div>
        </div>
      </div>
    </Page>
  );
}
