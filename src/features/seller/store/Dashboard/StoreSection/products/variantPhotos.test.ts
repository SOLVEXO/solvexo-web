import { describe, expect, it } from 'vitest';
import { blankVariantRow, type VariantRow } from './variantMatrix';
import { claimedByOthers, groupValue, photoLabels, photoOptionName, sameGroupKeys, setRowImages, tagText, unlinkedPhotos } from './variantPhotos';

const row = (opts: [string, string][], images: string[] = []): VariantRow =>
  ({ ...blankVariantRow({ key: opts.map(o => o.join(':')).join('|'), options: opts.map(([name, value]) => ({ name, value })) }), images });

const rows = [
  row([['Size', 'S'], ['Color', 'Black']], ['b1', 'b2']),
  row([['Size', 'M'], ['Color', 'Black']], ['b1', 'b2']),
  row([['Size', 'S'], ['Color', 'Pink']], ['p1']),
  row([['Size', 'M'], ['Color', 'Pink']]),
];

describe('variantPhotos', () => {
  it('groups by the Colour option when there is one, else by the first option', () => {
    expect(photoOptionName(rows)).toBe('Color');
    expect(photoOptionName([row([['Size', 'S']])])).toBe('Size');
    expect(photoOptionName([])).toBeNull();
  });

  it('finds every variant of the same colour', () => {
    const opt = photoOptionName(rows);
    expect(groupValue(rows[0], opt)).toBe('Black');
    expect(sameGroupKeys(rows, rows[0], opt)).toEqual([rows[0].key, rows[1].key]);
    expect(sameGroupKeys(rows, rows[3], opt)).toEqual([rows[2].key, rows[3].key]);
    expect(sameGroupKeys(rows, rows[0], null)).toEqual([rows[0].key]);
  });

  it('knows which photos other variants already use', () => {
    expect([...claimedByOthers(rows, [rows[0].key, rows[1].key])]).toEqual(['p1']);
  });

  it('labels each photo with the colours it is linked to', () => {
    const labels = photoLabels(rows);
    expect(labels).toEqual({ b1: ['Black'], b2: ['Black'], p1: ['Pink'] });
    expect(tagText(labels.b1)).toBe('Black');
    expect(tagText(['Black', 'Pink', 'Red'])).toBe('Black +2');
    expect(tagText(undefined)).toBe('');
  });

  it('links and unlinks photos for several rows at once', () => {
    const keys = sameGroupKeys(rows, rows[3], 'Color');
    const next = setRowImages(rows, keys, cur => [...cur, 'p2']);
    expect(next[2].images).toEqual(['p1', 'p2']);
    expect(next[3].images).toEqual(['p2']);
    expect(next[0].images).toEqual(['b1', 'b2']);
  });

  it('lists the shared (unlinked) photos', () => {
    expect(unlinkedPhotos(rows, ['b1', 'b2', 'p1', 'box'])).toEqual(['box']);
  });
});
