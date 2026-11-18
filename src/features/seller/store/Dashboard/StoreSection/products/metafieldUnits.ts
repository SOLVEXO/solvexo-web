/** Measurement types: a number and a unit, stored as one string ("12.5 cm"). Keep in sync with the API copy (src/metafields/metafield-units.ts). */
export const MEASURE_UNITS = {
  dimension: ['mm', 'cm', 'm', 'in', 'ft', 'yd'],
  weight: ['g', 'kg', 'oz', 'lb'],
  volume: ['ml', 'cl', 'l', 'fl oz', 'gal'],
} as const;
export type MeasureType = keyof typeof MEASURE_UNITS;

export const isMeasureType = (t: string): t is MeasureType => t in MEASURE_UNITS;

/** "12.5 cm" -> { amount: '12.5', unit: 'cm' }. Text that is not number + unit keeps the text as the amount, with the type's first unit. */
export function splitMeasure(type: MeasureType, value: string): { amount: string; unit: string } {
  const units = MEASURE_UNITS[type] as readonly string[];
  const text = value.trim();
  // The unit is whatever known unit the text ends with (longest first, so "fl oz" is not read as "oz"); the rest is the amount, even half-typed ("12.").
  for (const unit of [...units].sort((a, b) => b.length - a.length)) {
    if (text.endsWith(` ${unit}`)) return { amount: text.slice(0, text.length - unit.length - 1).trim(), unit };
  }
  return { amount: text, unit: units[0] };
}

/** The stored string for what the seller typed: an empty amount means cleared. */
export function joinMeasure(amount: string, unit: string): string {
  const a = amount.trim();
  return a === '' ? '' : `${a} ${unit}`;
}
