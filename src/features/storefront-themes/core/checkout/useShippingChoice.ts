import { useMemo, useState } from 'react';
import { apiGetLiveShippingRates, type LiveShippingRate } from '@/api/services/shipping';
import { useShippingZones } from '@/hooks/shipping/useShippingZones';
import { isSameCountry } from '@/utils/countries';
import { useShippingGroupPicks } from '../../useShippingGroupPicks';
import { useLoad } from '../pageHooks';
import { buildShipOptions, type AddressLike, type ShipOption } from './shippingOptions';

interface Args {
  storeId: string;
  /** False for digital-only carts (no shipping at all). */
  enabled: boolean;
  address: AddressLike | null;
  /** Currency the zone list is requested in (the checkout's own currency once it exists, else the store's). */
  zoneCurrency: string;
}

/** Zones + live carrier rates + per-profile delivery groups, reduced to what the checkout needs. Selection is derived. */
export function useShippingChoice({ storeId, enabled, address, zoneCurrency }: Args) {
  const zonesQ = useShippingZones(storeId, zoneCurrency);
  const liveQ = useLoad<LiveShippingRate[]>(
    () => (enabled ? apiGetLiveShippingRates(storeId).then(r => r.data ?? []).catch(() => []) : Promise.resolve([])),
    [storeId, enabled],
  );

  const built = useMemo(
    () => buildShipOptions({ zones: zonesQ.zones, liveRates: liveQ.data ?? [], address, zoneCurrency, sameCountry: isSameCountry }),
    [zonesQ.zones, liveQ.data, address, zoneCurrency],
  );
  const options = built.options;
  const groups = zonesQ.groups;
  const gp = useShippingGroupPicks(groups, options, enabled);

  const [chosenId, setChosenId] = useState<string | null>(null);
  const singleId = options.find(o => o._id === chosenId)?._id ?? options[0]?._id ?? null;

  const single: ShipOption | null = options.find(o => o._id === singleId) ?? null;
  const pickupSelected = enabled && (gp.multiGroup ? gp.pickupAll : single?.zoneType === 'pickup');
  const chosen = enabled && (gp.multiGroup ? gp.allPicked : !!singleId);

  return {
    options, groups, noMatching: built.noMatching,
    // Zones are the part the buyer must wait for; live rates are optional extras that arrive later.
    loading: zonesQ.loading && options.length === 0, error: zonesQ.error, retry: zonesQ.refetch,
    liveLoading: liveQ.loading,
    multiGroup: gp.multiGroup, picks: gp.picks, setPick: gp.setPick, selections: gp.selections, picksKey: gp.picksKey,
    singleId, single, select: setChosenId, pickupSelected, chosen,
  };
}
