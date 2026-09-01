import type { ThemeDefinition } from '@/api/services/themeCatalog';

/**
 * PLACEHOLDER — not a real rendered storefront yet.
 *
 * `ThemeDefinition.theme`/`header`/`footer`/`homePageSections` are shaped for
 * the OLD shared theme-rendering engine (`StorefrontColors` + a generic
 * `Section[]` renderer), which has since been fully removed in favor of
 * independent per-theme React implementations with their own hardcoded
 * chrome (see `src/features/storefront-themes/registry.ts` — Atelier/Nova,
 * no shared renderer, no `cfg`-driven inline styles). There is currently no
 * generic component that can turn a `ThemeDefinition`'s colors/sections into
 * a real storefront page.
 *
 * This stub only unblocks the build/compile; it does not implement the
 * "genuinely rendered demo storefront" behavior described in
 * `ThemePreviewPage`'s own doc comment. Revisit alongside deciding how (or
 * whether) the Theme Catalog feature should be redesigned against the new
 * per-theme registry.
 */
export function ThemeDemoStorefront({ theme }: { theme: ThemeDefinition }) {
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: 32,
        textAlign: 'center',
        background: theme.theme?.bgColor || '#FAF9F5',
        color: theme.theme?.textColor || '#161412',
      }}
    >
      <p style={{ fontSize: 18, fontWeight: 700 }}>{theme.name}</p>
      <p style={{ fontSize: 13, opacity: 0.7, maxWidth: 420 }}>{theme.description}</p>
      <p style={{ fontSize: 12, opacity: 0.5, maxWidth: 420 }}>
        A full rendered preview isn't available yet for this theme — the Theme Catalog feature predates the
        current per-theme storefront architecture. This is a placeholder.
      </p>
    </div>
  );
}
