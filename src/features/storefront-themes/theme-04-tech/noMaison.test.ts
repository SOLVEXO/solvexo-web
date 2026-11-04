import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = __dirname;
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
const sources = walk(ROOT).filter(f => /\.(ts|tsx|css)$/.test(f) && !/\.test\./.test(f));

describe('Tech Store is self-contained', () => {
  it('does not import anything from the Maison theme', () => {
    const offenders = sources.filter(f => /theme-03-fashion/.test(readFileSync(f, 'utf8').replace(/\/\/[^\n]*\n/g, '').replace(/\/\*[\s\S]*?\*\//g, '')));
    expect(offenders).toEqual([]);
  });

  it('does not read the Maison singleton or use its stylesheet prefix for classes', () => {
    const singleton = sources.filter(f => /\bfashionTheme\b/.test(readFileSync(f, 'utf8')));
    expect(singleton).toEqual([]);
    const css = readFileSync(join(ROOT, 'tech.css'), 'utf8');
    expect(css.includes('.fx-')).toBe(false);
  });
});
