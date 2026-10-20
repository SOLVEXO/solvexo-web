import { beforeEach, describe, expect, it } from 'vitest';
import { clearBootSnapshot, readBootSnapshot, writeBootSnapshot } from './storefrontBootCache';
import type { PublicStoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';

const store = (over: Record<string, unknown> = {}) => ({ storeId: 'S1', name: 'Amara', privacyMode: 'public', ...over }) as unknown as PublicStoreData;
const theme = { themeDefinitionId: 'theme-03-fashion' } as unknown as StoreThemeData;

describe('storefront boot cache', () => {
  beforeEach(() => localStorage.clear());

  it('remembers the last store + theme for a host and hands it back', () => {
    writeBootSnapshot(store(), theme, 'amara.solvexo.store');
    const snap = readBootSnapshot('amara.solvexo.store');
    expect(snap?.store.name).toBe('Amara');
    expect(snap?.theme.themeDefinitionId).toBe('theme-03-fashion');
  });

  it('keeps hosts apart and ignores letter case', () => {
    writeBootSnapshot(store(), theme, 'Amara.Solvexo.Store');
    expect(readBootSnapshot('amara.solvexo.store')?.store.storeId).toBe('S1');
    expect(readBootSnapshot('other.solvexo.store')).toBeNull();
  });

  it('never keeps a password or coming-soon store', () => {
    writeBootSnapshot(store({ privacyMode: 'password' }), theme, 'h.test');
    expect(readBootSnapshot('h.test')).toBeNull();
    writeBootSnapshot(store(), theme, 'h.test');
    writeBootSnapshot(store({ privacyMode: 'coming_soon' }), theme, 'h.test');
    expect(readBootSnapshot('h.test')).toBeNull();
  });

  it('drops an entry older than a week and survives junk', () => {
    writeBootSnapshot(store(), theme, 'h.test');
    const key = Object.keys(localStorage).find(k => k.includes('h.test'))!;
    const old = JSON.parse(localStorage.getItem(key)!);
    old.at = Date.now() - 8 * 24 * 3600 * 1000;
    localStorage.setItem(key, JSON.stringify(old));
    expect(readBootSnapshot('h.test')).toBeNull();
    localStorage.setItem(key, '{not json');
    expect(readBootSnapshot('h.test')).toBeNull();
  });

  it('clear removes it', () => {
    writeBootSnapshot(store(), theme, 'h.test');
    clearBootSnapshot('h.test');
    expect(readBootSnapshot('h.test')).toBeNull();
  });
});
