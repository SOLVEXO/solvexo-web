import { describe, expect, it } from 'vitest';
import { suggestSpecs } from './specSuggestions';
import { MEASURE_UNITS, joinMeasure, splitMeasure } from './metafieldUnits';

const names = (r: ReturnType<typeof suggestSpecs>) => (r ? r.specs.map(s => s.name) : null);

describe('suggestSpecs', () => {
  it('clothing categories get clothing specs, including unstitched fabric and Urdu-market words', () => {
    expect(names(suggestSpecs(['Clothing'], []))).toEqual(['Size', 'Fabric', 'Fit', 'Season', 'Care instructions']);
    expect(suggestSpecs(['Unstitched Fabric'], [])?.label).toBe('Clothing');
    expect(suggestSpecs(['Kameez Shalwar'], [])?.label).toBe('Clothing');
  });
  it('other kinds of product get their own, with the right types', () => {
    const el = suggestSpecs(['Mobile Phones'], []);
    expect(el?.label).toBe('Electronics');
    expect(el?.specs.find(s => s.name === 'Weight')?.type).toBe('weight');
    expect(suggestSpecs(['Sofas'], [])?.specs.find(s => s.name === 'Width')?.type).toBe('dimension');
    expect(suggestSpecs(['Perfume'], [])?.specs.find(s => s.name === 'Volume')?.type).toBe('volume');
    expect(suggestSpecs(['Handbags'], [])?.label).toBe('Bags');
  });
  it('leaves out specs the store already has (any capitals)', () => {
    expect(names(suggestSpecs(['Clothing'], ['size', 'FABRIC']))).toEqual(['Fit', 'Season', 'Care instructions']);
  });
  it('says nothing when everything exists, when no category fits, or when there is no category', () => {
    expect(suggestSpecs(['Clothing'], ['Size', 'Fabric', 'Fit', 'Season', 'Care instructions'])).toBeNull();
    expect(suggestSpecs(['Miscellaneous'], [])).toBeNull();
    expect(suggestSpecs([], [])).toBeNull();
    expect(suggestSpecs(['', '  '], [])).toBeNull();
  });
  it('the sub-category wins over the main category', () => {
    expect(suggestSpecs(['Home', 'Sofas'], [])?.label).toBe('Furniture & decor');
    expect(suggestSpecs(['Clothing', 'Shoes'], [])?.label).toBe('Shoes');
  });
});

describe('measurements', () => {
  it('split and join round-trip, including units with a space', () => {
    expect(splitMeasure('dimension', '12.5 cm')).toEqual({ amount: '12.5', unit: 'cm' });
    expect(splitMeasure('volume', '8 fl oz')).toEqual({ amount: '8', unit: 'fl oz' });
    expect(splitMeasure('weight', '2 kg')).toEqual({ amount: '2', unit: 'kg' });
    expect(joinMeasure('12.5', 'cm')).toBe('12.5 cm');
    expect(joinMeasure('8', 'fl oz')).toBe('8 fl oz');
  });
  it('an empty amount clears the value, and a half-typed number keeps what was typed', () => {
    expect(joinMeasure('', 'cm')).toBe('');
    expect(joinMeasure('  ', 'cm')).toBe('');
    expect(splitMeasure('dimension', '12. cm')).toEqual({ amount: '12.', unit: 'cm' });
    expect(splitMeasure('dimension', '')).toEqual({ amount: '', unit: 'mm' });
  });
  it('an old plain-text value shows as the amount with the first unit', () => {
    expect(splitMeasure('weight', '2kg approx')).toEqual({ amount: '2kg approx', unit: 'g' });
  });
  it('every type has units', () => {
    for (const t of ['dimension', 'weight', 'volume'] as const) expect(MEASURE_UNITS[t].length).toBeGreaterThan(2);
  });
});
