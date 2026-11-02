import { describe, expect, it } from 'vitest';
import { parseCsv } from './csvFile';

describe('parseCsv', () => {
  it('reads quoted cells with commas, quotes and line breaks, and drops blank lines', () => {
    const text = '\uFEFFName,Phone,Note\r\n"Malik, Sara",0300 111,"Said ""call me""\nafter Eid"\r\n\r\nHamza,0321,\n';
    expect(parseCsv(text)).toEqual([
      ['Name', 'Phone', 'Note'],
      ['Malik, Sara', '0300 111', 'Said "call me"\nafter Eid'],
      ['Hamza', '0321', ''],
    ]);
  });

  it('uses a semicolon or tab separator when the header row does', () => {
    expect(parseCsv('a;b\n1;2')).toEqual([['a', 'b'], ['1', '2']]);
    expect(parseCsv('a\tb\n1\t2')).toEqual([['a', 'b'], ['1', '2']]);
  });
});
