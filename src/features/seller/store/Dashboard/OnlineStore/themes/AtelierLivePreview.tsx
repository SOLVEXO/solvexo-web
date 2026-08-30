import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { StorefrontProvider, resolveStorefrontCfg, resolveStorefrontLink, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import { AtelierSectionRenderer } from '@/features/storefront-themes/theme-01-atelier/sections';
import { AtelierNavbar } from '@/features/storefront-themes/theme-01-atelier/components/AtelierNavbar';
import { AtelierFooter } from '@/features/storefront-themes/theme-01-atelier/components/AtelierFooter';
import { apiGetPublicStore, type PublicStoreData, type StoreAnnouncementType } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';
import { StoreAnnouncementBar } from '@/components/comman/ui';
import { CartProvider } from '@/contexts/CartContext';
import type { Section } from '@/api/services/storefrontTypes';
import { atelierTheme as t, applyMerchantThemeOverrides } from '@/features/storefront-themes/theme-01-atelier/theme.config';

/** Shape of `PublicStoreData['announcementBar']` — repeated here (not
 *  imported) because that field is inline-typed on `PublicStoreData` rather
 *  than named, and this is the shape `announcementOverride` below accepts. */
export interface AnnouncementBarPreviewValue {
  message: string | null;
  type: StoreAnnouncementType;
  ctaLabel: string | null;
  ctaLink: string | null;
}

/** A real, isolated `StorefrontProvider` for a live preview panel — built
 *  from the SAME real store data the public storefront uses (fetched once
 *  here, not synthetic/demo), so `AtelierSectionRenderer` renders through
 *  the identical runtime a buyer would see. The only thing that differs
 *  from the real storefront is which `sections`/`theme` are fed in: here
 *  it's the seller's unsaved draft, not the published document.
 *
 *  Shared by the Customize page (Home/Product/Collection/Search/Cart/Blog
 *  section editing) AND the Header & Footer page — both need "show me what
 *  this looks like before I publish," and both need the exact same real
 *  chrome/section-rendering, so this one component is the single source of
 *  truth for "what does a draft look like" rather than two hand-rolled
 *  previews that could silently drift apart.
 *
 *  `showChrome` renders the REAL `AtelierNavbar`/`AtelierFooter` around the
 *  section content — those two components already read `theme.header`/
 *  `theme.footer` from context, so passing the seller's real draft theme
 *  through `draftTheme` reflects UNSAVED header/footer edits live, not just
 *  section edits. This is what makes the Header & Footer editor's preview
 *  genuinely show its own changes instead of staying static.
 *
 *  `announcementOverride` — the announcement bar is `Store.announcementBar`,
 *  a plain field that saves and goes live IMMEDIATELY (no draft/publish step
 *  the way theme/header/footer have one), so there's no "draft" to fetch and
 *  show here the way `draftTheme` works. Instead, the Announcement tab passes
 *  its own in-progress form state through this prop so the seller sees their
 *  unsaved edits reflected live, exactly like every other tab. When omitted
 *  (`undefined`), this falls back to the real store's published, already
 *  schedule/active-gated `announcementBar` — so every OTHER scope's preview
 *  (Home/Product/Collection/Search/Cart/Blog, and Header/Footer's own
 *  preview) now honestly shows the real announcement bar in context too,
 *  instead of silently omitting it as before. Pass `null` explicitly to
 *  force "no bar" (e.g. while the seller has cleared the message field).
 *
 *  `interactive`/`selectedSectionId`/`onSelectSection` — click-to-select.
 *  The whole preview stays `pointer-events:none` by default (so chrome links/
 *  buttons/forms can never actually fire inside an editor page) EXCEPT the
 *  sections area, which is switched to `pointer-events:auto` only when
 *  `interactive` is on, and `AtelierSectionRenderer`'s own capture-phase
 *  click guard (see its `selectable` prop) is what makes clicking inside a
 *  section safe even then — it intercepts before any real link/button/form
 *  in that section's markup can fire, and reports the section id instead. */
export function AtelierLivePreview({
  sections, showChrome, draftTheme, announcementOverride, interactive, selectedSectionId, onSelectSection,
}: {
  sections: Section[];
  showChrome: boolean;
  draftTheme?: StoreThemeData | null;
  announcementOverride?: AnnouncementBarPreviewValue | null;
  interactive?: boolean;
  selectedSectionId?: string | null;
  onSelectSection?: (sectionId: string) => void;
}) {
  const [store, setStore] = useState<PublicStoreData | null>(null);
  const { store: workspaceStore } = useStoreWorkspace();

  useEffect(() => {
    if (!workspaceStore?.slug) return;
    let cancelled = false;
    apiGetPublicStore(workspaceStore.slug).then(res => { if (!cancelled) setStore(res.data); }).catch(() => {});
    return () => { cancelled = true; };
  }, [workspaceStore?.slug]);

  if (!store) {
    return <div className="flex items-center justify-center h-full"><Loader2 size={20} className="animate-spin text-slate" /></div>;
  }

  const theme: StoreThemeData | null = draftTheme ?? null;
  const contextValue: StorefrontContextValue = {
    store,
    theme,
    cfg: resolveStorefrontCfg(theme),
    resolveLink: resolveStorefrontLink,
  };

  // Preview always shows the DRAFT (unsaved-but-saved-as-draft, or — when
  // the seller is actively editing the Theme scope — the in-progress working
  // copy the caller composites into `draftTheme.draft` before passing it
  // down here) — never the published live theme. Falls back to the live
  // `theme` fields only if a draft was never created (matches every other
  // scope's "draft defaults to a copy of live" convention).
  applyMerchantThemeOverrides(draftTheme?.draft?.theme ?? draftTheme?.theme ?? null);
  const previewCustomCss = draftTheme?.draft?.customCss ?? draftTheme?.customCss ?? null;

  // Same ordering as the real storefront (`AtelierLayout`): navbar first,
  // announcement bar directly under it — kept identical so the preview never
  // diverges from what a buyer actually sees.
  const announcementBar = announcementOverride !== undefined ? announcementOverride : store.announcementBar;

  const body = (
    <StorefrontProvider value={contextValue}>
      <div style={{ background: t.colors.bg, fontFamily: t.fonts.body, pointerEvents: 'none' }}>
        {previewCustomCss && <style>{previewCustomCss}</style>}
        {showChrome && <AtelierNavbar />}
        {showChrome && announcementBar?.message && (
          <StoreAnnouncementBar
            storeId={store.storeId}
            message={announcementBar.message}
            type={announcementBar.type}
            ctaLabel={announcementBar.ctaLabel}
            ctaLink={announcementBar.ctaLink}
          />
        )}
        <div style={{ pointerEvents: interactive ? 'auto' : 'none' }}>
          <AtelierSectionRenderer
            sections={sections}
            selectable={interactive}
            selectedSectionId={selectedSectionId}
            onSelectSection={onSelectSection}
          />
        </div>
        {showChrome && <AtelierFooter />}
      </div>
    </StorefrontProvider>
  );

  // AtelierNavbar reads `useCartContext()` — only needed when chrome is
  // shown, so the lighter section-only scopes (Product/Collection/Search/
  // Cart/Blog) skip mounting a real CartProvider (and its real fetch)
  // entirely, same as before this extraction.
  return showChrome ? <CartProvider storeId={store.storeId}>{body}</CartProvider> : body;
}
