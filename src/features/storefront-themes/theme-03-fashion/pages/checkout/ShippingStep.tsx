import { Store, Truck } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { ErrorState, Notice, SkeletonBlock } from '../../ui/primitives';
import { RadioRow, StepCard } from './CheckoutParts';
import type { ShipOption } from '../../../core/checkout/shippingOptions';
import type { useShippingChoice } from '../../../core/checkout/useShippingChoice';

type Ship = ReturnType<typeof useShippingChoice>;

interface RowsProps {
  name: string;
  options: ShipOption[];
  current: string | null | undefined;
  onPick: (id: string) => void;
  priceText: (o: ShipOption) => string;
}

function ShipRows({ name, options, current, onPick, priceText }: RowsProps) {
  return (
    <div role="radiogroup" aria-label="Delivery options" className="flex flex-col gap-3">
      {options.map(o => (
        <RadioRow key={o._id} name={name} checked={current === o._id} onChange={() => onPick(o._id)} label={`${o.label}, ${priceText(o)}`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-2 text-sm font-medium">
                {o.zoneType === 'pickup' ? <Store size={15} aria-hidden /> : <Truck size={15} aria-hidden />}<span className="truncate">{o.label}</span>
              </p>
              {(o.eta || o.arrival) && <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>{[o.eta, o.arrival].filter(Boolean).join(' - ')}</p>}
              {o.zoneType === 'pickup' && (o.pickupAddress || o.pickupInstructions) && (
                <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>{[o.pickupAddress, o.pickupInstructions].filter(Boolean).join(' - ')}</p>
              )}
            </div>
            <span className="shrink-0 text-sm font-semibold">{priceText(o)}</span>
          </div>
        </RadioRow>
      ))}
    </div>
  );
}

interface Props {
  step: number;
  ship: Ship;
  /** Price of an option expressed in the currency the summary uses. */
  priceText: (o: ShipOption) => string;
  dutiesNotice: boolean;
  /** A delivery address (or a pickup choice) exists; the step is only complete once it does. */
  addressReady: boolean;
}

export function ShippingStep({ step, ship, priceText, dutiesNotice, addressReady }: Props) {
  let body;
  if (ship.loading) body = <SkeletonBlock h={68} rows={2} />;
  else if (ship.error && ship.options.length === 0) body = <ErrorState message="We could not load delivery options." onRetry={ship.retry} />;
  else if (ship.options.length === 0) {
    body = <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{ship.noMatching ? "Sorry, this store doesn't currently ship to your address's country." : 'No delivery options are available yet.'}</p>;
  } else if (!ship.multiGroup) {
    body = <ShipRows name="shipping-rate" options={ship.options} current={ship.singleId} onPick={ship.select} priceText={priceText} />;
  } else {
    body = (
      <div className="flex flex-col gap-6">
        {ship.groups.map(g => {
          const options = ship.options.filter(o => o.groupKey === g.groupKey);
          return (
            <div key={g.groupKey} className="flex flex-col gap-3">
              <h3 className="m-0 text-sm font-semibold">Shipping: {g.name}</h3>
              {options.length === 0
                ? <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>No delivery option is available for these items to your address.</p>
                : <ShipRows name={`shipping-${g.groupKey}`} options={options} current={ship.picks[g.groupKey]} onPick={id => ship.setPick(g.groupKey, id)} priceText={priceText} />}
            </div>
          );
        })}
      </div>
    );
  }
  return (
    <StepCard step={step} title="Delivery" done={ship.chosen && addressReady}>
      <div className="flex flex-col gap-4" aria-live="polite">
        {body}
        {ship.liveLoading && ship.options.length > 0 && <p className="m-0 text-xs" style={{ color: t.colors.inkMuted }}>Checking carrier rates...</p>}
        {dutiesNotice && <Notice>Duties and import taxes are not included in your total. You may be charged by the carrier on delivery.</Notice>}
      </div>
    </StepCard>
  );
}

