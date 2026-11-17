/**
 * Answer options of the field-visit form, in English with Urdu. The keys must match
 * `solvexo-api/src/sales-ops/field-visit.constants.ts` (the API validates them); change both together.
 */
export interface VisitOption { key: string; en: string; ur: string }
const o = (key: string, en: string, ur: string): VisitOption => ({ key, en, ur });

export const VISIT_OPTIONS = {
  floor: [o('basement', 'Basement', 'تہہ خانہ'), o('ground', 'Ground', 'گراؤنڈ'), o('first', '1st', 'پہلی'), o('second', '2nd', 'دوسری'), o('third_plus', '3rd+', 'تیسری+')],
  category: [
    o('clothing', 'Clothing', 'کپڑے'), o('shoes', 'Shoes', 'جوتے'), o('bags_accessories', 'Bags & accessories', 'بیگ اور اسیسریز'),
    o('jewellery', 'Jewellery', 'زیورات'), o('cosmetics', 'Cosmetics', 'کاسمیٹکس'), o('electronics_mobiles', 'Electronics & mobiles', 'الیکٹرانکس اور موبائل'),
    o('home_kitchen', 'Home & kitchen', 'گھر اور کچن'), o('kids_toys', 'Kids & toys', 'بچے اور کھلونے'), o('grocery', 'Grocery', 'کریانہ'),
    o('pharmacy', 'Pharmacy', 'فارمیسی'), o('other', 'Other', 'دیگر'),
  ],
  priceRange: [o('budget', 'Budget', 'سستا'), o('mid', 'Mid', 'درمیانہ'), o('premium', 'Premium', 'مہنگا')],
  wholesale: [o('retail', 'Retail only', 'صرف ریٹیل'), o('wholesale', 'Wholesale only', 'صرف ہول سیل'), o('both', 'Both', 'دونوں')],
  contactRole: [o('owner', 'Owner', 'مالک'), o('partner', 'Partner', 'پارٹنر'), o('manager', 'Manager', 'مینیجر'), o('staff', 'Staff', 'عملہ')],
  bestTime: [o('morning', 'Morning', 'صبح'), o('afternoon', 'Afternoon', 'دوپہر'), o('evening', 'Evening', 'شام'), o('after_closing', 'After closing', 'دکان بند ہونے کے بعد')],
  sellsOn: [o('shop', 'Shop', 'دکان'), o('instagram', 'Instagram', 'انسٹاگرام'), o('facebook', 'Facebook', 'فیس بک'), o('whatsapp', 'WhatsApp', 'واٹس ایپ'), o('daraz', 'Daraz', 'دراز'), o('website', 'Website', 'ویب سائٹ')],
  ordersPerMonth: [o('none', '0', '0'), o('1_20', '1–20', '1–20'), o('21_100', '21–100', '21–100'), o('101_500', '101–500', '101–500'), o('500_plus', '500+', '500+')],
  payments: [o('cod', 'COD', 'کیش آن ڈیلیوری'), o('easypaisa', 'Easypaisa', 'ایزی پیسہ'), o('jazzcash', 'JazzCash', 'جاز کیش'), o('bank', 'Bank transfer', 'بینک ٹرانسفر'), o('card', 'Card', 'کارڈ')],
  couriers: [
    o('tcs', 'TCS', 'ٹی سی ایس'), o('leopards', 'Leopards', 'لیپرڈز'), o('mnp', 'M&P', 'ایم اینڈ پی'), o('postex', 'PostEx', 'پوسٹ ایکس'), o('trax', 'Trax', 'ٹریکس'),
    o('blueex', 'BlueEx', 'بلو ایکس'), o('call_courier', 'Call Courier', 'کال کوریئر'), o('own_rider', 'Own rider', 'اپنا رائیڈر'), o('none', 'None', 'کوئی نہیں'),
  ],
  courierBooking: [o('portal', 'Courier portal', 'کوریئر پورٹل'), o('phone', 'Phone call', 'فون کال'), o('rider_pickup', 'Rider pickup', 'رائیڈر پک اپ'), o('app', 'App', 'ایپ')],
  billing: [o('manual', 'Manual register', 'رجسٹر / کاپی'), o('excel', 'Excel', 'ایکسل'), o('software', 'Software (name it)', 'سافٹ ویئر'), o('none', 'None', 'کوئی نہیں')],
  khata: [o('no', 'No', 'نہیں'), o('paper', 'Yes · paper', 'ہاں · کاغذ'), o('app', 'Yes · app', 'ہاں · ایپ')],
  seasons: [
    o('eid_fitr', 'Eid ul-Fitr', 'عید الفطر'), o('eid_adha', 'Eid ul-Adha', 'عید الاضحیٰ'), o('ramadan', 'Ramadan', 'رمضان'), o('wedding', 'Wedding season', 'شادیوں کا سیزن'),
    o('winter', 'Winter', 'سردی'), o('summer', 'Summer', 'گرمی'), o('back_to_school', 'Back to school', 'اسکول کھلنے پر'), o('sale_events', '11.11 / Black Friday', '11.11 / بلیک فرائیڈے'),
  ],
  problemTags: [o('low_sales', 'Low sales', 'کم سیل'), o('stock_tracking', 'Stock tracking', 'اسٹاک کا حساب'), o('cod_returns', 'COD returns', 'سی او ڈی واپسی'), o('no_time_online', 'No time online', 'آن لائن کے لیے وقت نہیں'), o('courier_issues', 'Courier issues', 'کوریئر کے مسائل')],
  objections: [
    o('too_expensive', 'Too expensive', 'بہت مہنگا'), o('has_system', 'Already have a system', 'پہلے سے سسٹم ہے'), o('not_tech_savvy', 'Not tech-savvy', 'ٹیکنالوجی نہیں آتی'),
    o('no_time', 'No time', 'وقت نہیں'), o('ask_partner', 'Need to ask partner', 'پارٹنر سے پوچھنا ہے'), o('trust', 'Trust / security', 'بھروسہ / سیکیورٹی'), o('think_about_it', 'Will think about it', 'سوچ کر بتائیں گے'),
  ],
  interest: [o('hot', '🔥 Hot', 'بہت دلچسپی'), o('warm', 'Warm', 'کچھ دلچسپی'), o('cold', 'Cold', 'کم دلچسپی'), o('not_interested', 'Not interested', 'دلچسپی نہیں')],
  nextStep: [o('demo', 'Demo', 'ڈیمو'), o('send_price', 'Send price on WhatsApp', 'واٹس ایپ پر قیمت بھیجیں'), o('revisit', 'Revisit', 'دوبارہ وزٹ'), o('signup', 'Sign-up', 'سائن اپ'), o('call_back', 'Call back', 'دوبارہ کال'), o('none', 'None', 'کوئی نہیں')],
} as const satisfies Record<string, readonly VisitOption[]>;

export type VisitOptionGroup = keyof typeof VISIT_OPTIONS;

/** English label for a stored key ('' when empty). Interest loses its emoji in tables and the CSV. */
export function optionLabel(group: VisitOptionGroup, key: string | null | undefined): string {
  if (!key) return '';
  const hit = (VISIT_OPTIONS[group] as readonly VisitOption[]).find(x => x.key === key);
  return hit ? hit.en.replace(/^🔥\s*/, '') : key;
}
export const optionLabels = (group: VisitOptionGroup, keys: string[] | null | undefined) => (keys ?? []).map(k => optionLabel(group, k)).join(', ');
