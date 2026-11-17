import type { VisitInput } from '@/api/services/salesVisits';

/** Every answer of the form as the rep fills it (option fields hold keys; '' = not answered). */
export interface VisitForm {
  storeName: string; unit: string; floor: string; area: string;
  category: string; categoryOther: string; priceRange: string; wholesale: string;
  contactName: string; contactRole: string; whatsapp: string; waPermission: '' | 'yes' | 'no'; bestTime: string;
  instagram: string; facebook: string; website: string;
  sellsOn: string[]; ordersPerMonth: string; payments: string[]; couriers: string[]; courierBooking: string;
  billing: string; billingSoftware: string; khata: string; seasons: string[]; bestSellers: string;
  problem: string; problemTags: string[]; objections: string[]; interest: string; nextStep: string;
  when: '' | 'tomorrow' | 'three_days' | 'next_week' | 'pick'; pickDate: string;
}
export const emptyVisit = (area = ''): VisitForm => ({
  storeName: '', unit: '', floor: '', area, category: '', categoryOther: '', priceRange: '', wholesale: '',
  contactName: '', contactRole: '', whatsapp: '', waPermission: '', bestTime: '', instagram: '', facebook: '', website: '',
  sellsOn: [], ordersPerMonth: '', payments: [], couriers: [], courierBooking: '', billing: '', billingSoftware: '', khata: '',
  seasons: [], bestSellers: '', problem: '', problemTags: [], objections: [], interest: '', nextStep: '', when: '', pickDate: '',
});

export const WHEN: { key: VisitForm['when']; en: string; ur: string; days: number }[] = [
  { key: 'tomorrow', en: 'Tomorrow', ur: 'کل', days: 1 },
  { key: 'three_days', en: 'In 3 days', ur: '3 دن بعد', days: 3 },
  { key: 'next_week', en: 'Next week', ur: 'اگلے ہفتے', days: 7 },
  { key: 'pick', en: 'Pick date…', ur: 'تاریخ چنیں', days: 0 },
];

/** The follow-up date for the chosen "when", at 10:00 local time. Null when nothing usable is chosen. */
export function nextStepDate(f: Pick<VisitForm, 'when' | 'pickDate'>, now = new Date()): Date | null {
  let d: Date;
  if (f.when === 'pick') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(f.pickDate)) return null;
    const [y, m, day] = f.pickDate.split('-').map(Number);
    d = new Date(y, m - 1, day);
  } else {
    const w = WHEN.find(x => x.key === f.when);
    if (!w) return null;
    d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + w.days);
  }
  d.setHours(10, 0, 0, 0);
  return d;
}

/** What is missing before the visit can be saved (empty = ready). */
export function missingFields(f: VisitForm): string[] {
  const out: string[] = [];
  if (!f.storeName.trim()) out.push('Store name');
  if (!f.interest) out.push('Interest');
  if (!f.nextStep) out.push('Next step');
  else if (f.nextStep !== 'none' && !nextStepDate(f)) out.push('Next step date');
  return out;
}

const t = (s: string) => (s.trim() ? s.trim() : null);
const keyOrNull = (s: string) => s || null;

/** The request body for a filled form. */
export function toVisitInput(f: VisitForm, extra: { clientId: string; visitedAt: Date; location: VisitInput['location']; photoDataUrl: string | null }): VisitInput {
  const next = f.nextStep && f.nextStep !== 'none' ? nextStepDate(f) : null;
  return {
    clientId: extra.clientId, visitedAt: extra.visitedAt.toISOString(), location: extra.location, photoDataUrl: extra.photoDataUrl,
    storeName: f.storeName.trim(), unit: t(f.unit), floor: keyOrNull(f.floor), area: t(f.area),
    category: keyOrNull(f.category), categoryOther: f.category === 'other' ? t(f.categoryOther) : null,
    priceRange: keyOrNull(f.priceRange), wholesale: keyOrNull(f.wholesale),
    contactName: t(f.contactName), contactRole: keyOrNull(f.contactRole), whatsapp: t(f.whatsapp), waPermission: f.waPermission === 'yes',
    bestTime: keyOrNull(f.bestTime), instagram: t(f.instagram), facebook: t(f.facebook), website: t(f.website),
    sellsOn: f.sellsOn, ordersPerMonth: keyOrNull(f.ordersPerMonth), payments: f.payments, couriers: f.couriers,
    courierBooking: keyOrNull(f.courierBooking), billing: keyOrNull(f.billing), billingSoftware: f.billing === 'software' ? t(f.billingSoftware) : null,
    khata: keyOrNull(f.khata), seasons: f.seasons, bestSellers: t(f.bestSellers), problem: t(f.problem), problemTags: f.problemTags,
    objections: f.objections, interest: f.interest, nextStep: f.nextStep, nextStepAt: next ? next.toISOString() : null,
  };
}
