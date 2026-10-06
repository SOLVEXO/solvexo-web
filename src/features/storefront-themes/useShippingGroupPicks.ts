import { useCallback, useMemo, useState } from 'react';
import type { ShippingGroup } from '@/api/services/shipping';
import type { ShippingSelectionPayload } from '@/api/services/checkout';

interface PickableZone { _id: string; groupKey?: string; zoneType: string }

/**
 * Shopify delivery groups at checkout: when a cart mixes products of different shipping profiles the buyer picks
 * ONE rate per group. With a single group (every store without custom profiles) `multiGroup` is false and the
 * page keeps its original single-selection flow untouched.
 */
export function useShippingGroupPicks(groups: ShippingGroup[], zones: PickableZone[], enabled: boolean) {
  const multiGroup = enabled && groups.length > 1;
  const [chosen, setChosen] = useState<Record<string, string>>({});

  const zonesKey = zones.map(z => `${z.groupKey ?? ''}:${z._id}`).join('|');
  const groupsKey = groups.map(g => g.groupKey).join('|');

  // Effective pick per group: the buyer's choice while it is still offered, else the group's first available rate.
  const picks = useMemo(() => {
    const out: Record<string, string> = {};
    if (!multiGroup) return out;
    for (const g of groups) {
      const options = zones.filter(z => z.groupKey === g.groupKey);
      const pick = options.find(z => z._id === chosen[g.groupKey]) ?? options[0];
      if (pick) out[g.groupKey] = pick._id;
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [multiGroup, zonesKey, groupsKey, chosen]);

  const setPick = useCallback((groupKey: string, zoneId: string) => setChosen(p => ({ ...p, [groupKey]: zoneId })), []);

  const allPicked = multiGroup && groups.every(g => !!picks[g.groupKey]);
  const pickupAll = allPicked && groups.every(g => zones.find(z => z._id === picks[g.groupKey])?.zoneType === 'pickup');
  const picksKey = multiGroup ? groups.map(g => picks[g.groupKey] ?? '').join(',') : '';
  const selections: ShippingSelectionPayload[] = useMemo(
    () => (multiGroup ? groups.filter(g => picks[g.groupKey]).map(g => ({ profileId: g.profileId, shippingZoneId: picks[g.groupKey] })) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [multiGroup, picksKey],
  );

  return { multiGroup, picks, setPick, allPicked, pickupAll, picksKey, selections };
}
