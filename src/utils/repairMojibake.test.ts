import { describe, expect, it } from 'vitest';
import { repairMojibake } from './repairMojibake';

const garble = (s: string) => Buffer.from(s, 'utf8').toString('latin1');

describe('repairMojibake', () => {
  it('turns UTF-8 read as Latin-1 back into the real text', () => {
    expect(repairMojibake(garble('عثمان ناصر'))).toBe('عثمان ناصر');
    expect(repairMojibake(`Osama Nasir (${garble('عثمان')})`)).toBe('Osama Nasir (عثمان)');
  });

  it('repairs Windows-1252 style text (€ for 0x80)', () => {
    expect(repairMojibake('â€œhiâ€\u009d')).toBe('“hi”');
  });

  it('leaves normal text alone', () => {
    for (const v of ['Osama Nasir', 'Café Münster', 'عثمان', 'Ã', '', null, undefined]) {
      expect(repairMojibake(v as string)).toBe(v ?? '');
    }
  });
});
