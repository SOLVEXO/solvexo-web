/**
 * Arabic counted nouns ("3 أيام", "14 يومًا", "يومان"). Arabic changes the noun with the number:
 * 1 and 2 have their own forms, 3–10 take the plural, 11–99 the accusative singular, round hundreds the singular.
 * Western digits, as GCC websites use.
 */
export interface ArabicNoun {
  /** "يوم واحد" */ one: string;
  /** "يومان" */ two: string;
  /** "أيام" (3–10, number written before it) */ few: string;
  /** "يومًا" (11–99) */ many: string;
  /** "يوم" (100, 200, 1,000…) */ hundred: string;
}

export function arCount(n: number, noun: ArabicNoun): string {
  if (n === 1) return noun.one;
  if (n === 2) return noun.two;
  const num = n.toLocaleString('en-US');
  const rest = n % 100;
  if (rest >= 3 && rest <= 10) return `${num} ${noun.few}`;
  if (rest >= 11) return `${num} ${noun.many}`;
  return `${num} ${noun.hundred}`;
}

export const AR_DAYS: ArabicNoun = { one: 'يوم واحد', two: 'يومين', few: 'أيام', many: 'يومًا', hundred: 'يوم' };
export const AR_MONTHS: ArabicNoun = { one: 'شهر', two: 'شهرين', few: 'أشهر', many: 'شهرًا', hundred: 'شهر' };

/**
 * Keeps a Latin/number run such as "$6" in its own left-to-right island inside Arabic text. Without it the
 * Unicode bidi rules flip it to "6$" (a number after Arabic letters loses the "$" that precedes it).
 */
export const ltr = (s: string) => `⁦${s}⁩`;
