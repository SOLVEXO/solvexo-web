import { afterEach, describe, expect, it } from 'vitest';
import { beginCollect, dropSsr, dumpSsr, endCollect, failSsr, peekSsr, putSsr, wantSsr } from './ssrData';

describe('ssrData', () => {
  afterEach(() => { endCollect(); dropSsr(); delete window.__SX_DATA__; });

  it('stores, reads and forgets entries (and tells apart "no entry" from a null value)', () => {
    expect(peekSsr('a')).toBeUndefined();
    putSsr('a', { x: 1 });
    putSsr('gone', null);
    expect(peekSsr('a')).toEqual({ x: 1 });
    expect(peekSsr('gone')).toBeNull();
    dropSsr('a');
    expect(peekSsr('a')).toBeUndefined();
    expect(dumpSsr()).toEqual({ gone: null });
  });

  it('has nothing for a missing key', () => {
    expect(peekSsr(undefined)).toBeUndefined();
  });

  it('only collects loaders while a pass is being collected, once per key, and never for known or failed keys', () => {
    const loader = () => Promise.resolve(1);
    wantSsr('early', loader); // no pass running: ignored
    const wanted = beginCollect();
    wantSsr('k1', loader);
    wantSsr('k1', () => Promise.resolve(2)); // same key twice: first one stays
    putSsr('have', 'x');
    wantSsr('have', loader);
    failSsr('bad');
    wantSsr('bad', loader);
    wantSsr(undefined, loader);
    expect([...wanted.keys()]).toEqual(['k1']);
    endCollect();
    wantSsr('late', loader);
    expect(wanted.has('late')).toBe(false);
  });

  it('picks up what the server wrote into the page (window.__SX_DATA__) the first time it is read', () => {
    window.__SX_DATA__ = { 'home:1': { sections: [] } };
    dropSsr(); // fresh module state: the next read loads from the window again
    expect(peekSsr('home:1')).toEqual({ sections: [] });
  });
});
