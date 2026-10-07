import { describe, expect, it } from 'vitest';
import { atelierThemeManifest } from './theme-01-atelier/theme.manifest';
import { resolveAtelierCollectionId } from './theme-01-atelier/sections/collectionScope';
import { novaThemeManifest } from './theme-02-nova/theme.manifest';
import { resolveNovaCollectionId } from './theme-02-nova/sections/collectionScope';

const expectedScopes = ['home', 'product', 'collection', 'pages', 'search', 'cart', 'blogIndex', 'blogArticle'];

describe('storefront theme template scopes', () => {
  it.each([
    ['Atelier', atelierThemeManifest],
    ['Nova', novaThemeManifest],
  ] as const)('%s exposes complete-page previews for supported templates', (_name, manifest) => {
    expect(manifest.templates.map(template => template.id)).toEqual(expectedScopes);
    expect(manifest.templates.every(template => template.showChrome)).toBe(true);
  });

  it('uses the real collection route before the editor preview collection', () => {
    expect(resolveAtelierCollectionId('route-collection', 'preview-collection')).toBe('route-collection');
    expect(resolveNovaCollectionId('route-collection', 'preview-collection')).toBe('route-collection');
  });

  it('uses the selected collection when rendering a collection template preview', () => {
    expect(resolveAtelierCollectionId(null, 'preview-collection')).toBe('preview-collection');
    expect(resolveNovaCollectionId(null, 'preview-collection')).toBe('preview-collection');
  });

  it('does not invent a collection outside a collection route or template preview', () => {
    expect(resolveAtelierCollectionId(null, null)).toBeNull();
    expect(resolveNovaCollectionId(null, undefined)).toBeNull();
  });
});
