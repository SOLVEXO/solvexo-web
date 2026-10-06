import type { ShippingZone } from '@/api/services/shipping';

const norm = (v?: string | null) => (v ?? '').trim().toLowerCase();

export const normPostcode = (v?: string | null) => (v ?? '').toUpperCase().replace(/[\s-]+/g, '');

const toRad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km (mirrors the backend's haversineKm). */
export function haversineKm(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Pickup is always offered; local delivery matches the buyer's city / address line; normal zones match by country. */
export function zoneMatchesAddress(
  z: ShippingZone,
  addr: { country?: string | null; city?: string | null; addressLine1?: string | null; zipCode?: string | null; latitude?: number | null; longitude?: number | null } | null | undefined,
  sameCountry: (a: string, b: string) => boolean,
): boolean {
  if (z.zoneType === 'pickup') return true;
  if (!addr) return true;
  if (z.zoneType === 'local_delivery') {
    // A radius around the ship-from location decides when both it and the buyer's map pin have coordinates.
    if (
      z.radiusKm != null && z.radiusKm > 0
      && typeof z.originLatitude === 'number' && typeof z.originLongitude === 'number'
      && typeof addr.latitude === 'number' && typeof addr.longitude === 'number'
    ) {
      return haversineKm({ latitude: z.originLatitude, longitude: z.originLongitude }, { latitude: addr.latitude, longitude: addr.longitude }) <= z.radiusKm;
    }
    // Postcode list wins when the seller set one; otherwise fall back to the city/area match.
    const codes = (z.postalCodes ?? []).map(normPostcode).filter(Boolean);
    if (codes.length > 0) return !!addr.zipCode && codes.includes(normPostcode(addr.zipCode));
    const area = norm(z.city);
    return !!area && (norm(addr.city) === area || norm(addr.addressLine1).includes(area));
  }
  return sameCountry(z.country, addr.country ?? '');
}

/** Buyer-facing option label: custom name first, then pickup / area / city. */
export function zoneLabel(z: ShippingZone): string {
  if (z.name) return z.name;
  if (z.zoneType === 'pickup') return 'Local pickup';
  if (z.zoneType === 'local_delivery') return `Local delivery · ${z.city ?? ''}`;
  return [z.city, z.province].filter(Boolean).join(', ') || z.country;
}

const DAY_MS = 86_400_000;
const fmtDay = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

/** "Arrives Oct 9 - Oct 12" from the zone's numeric day window (calendar days from today); null when unset. */
export function zoneArrivalRange(z: Pick<ShippingZone, 'minDays' | 'maxDays' | 'zoneType'>, today: Date = new Date()): string | null {
  if (z.zoneType === 'pickup') return null;
  const min = z.minDays ?? z.maxDays;
  const max = z.maxDays ?? z.minDays;
  if (min == null || max == null) return null;
  const a = fmtDay(new Date(today.getTime() + min * DAY_MS));
  const b = fmtDay(new Date(today.getTime() + max * DAY_MS));
  return a === b ? `Arrives ${a}` : `Arrives ${a} - ${b}`;
}

export interface ZoneRegion { key: string; label: string; country: string; province: string; regionName: string; zones: ShippingZone[] }

/**
 * Shopify "zone = region with several rates": rows that share country + province + regionName are shown as one
 * region card listing their rates. Purely presentational — each row stays one rate in the backend.
 */
export function groupZonesByRegion(zones: ShippingZone[]): ZoneRegion[] {
  const map = new Map<string, ZoneRegion>();
  for (const z of zones) {
    const country = z.country ?? '';
    const province = z.province ?? '';
    const regionName = (z.regionName ?? '').trim();
    const key = [country, province, regionName].map(v => v.trim().toLowerCase()).join('|');
    let r = map.get(key);
    if (!r) {
      r = { key, label: regionName || [province, country].filter(Boolean).join(', ') || country, country, province, regionName, zones: [] };
      map.set(key, r);
    }
    r.zones.push(z);
  }
  return [...map.values()];
}
