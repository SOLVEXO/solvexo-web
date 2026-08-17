import { useMemo, useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';
import type { StoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';
import type { Section } from '@/api/services/storefrontTypes';
import { StorefrontProvider, STOREFRONT_CFG_DEFAULT, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import { SectionRenderer } from '@/features/storefront/SectionRenderer';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };
const DEVICE_ICON: Record<Device, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

/**
 * Renders `children` inside a real `<iframe>` (not just a width-constrained
 * div) so the Tablet/Mobile preview actually triggers the storefront's own
 * responsive breakpoints — Tailwind's `sm:`/`md:`/`lg:` classes respond to
 * the *viewport* width, which a shrunk container alone can't fake; an iframe
 * gets its own real, independent viewport. Every stylesheet/style tag from
 * the builder page is cloned into the iframe's document once it loads, and
 * content is portaled into its body — React context (cart/wishlist/currency/
 * auth-gate, all provided above the router) still flows through normally,
 * since a portal only changes *where in the DOM* something renders, not its
 * position in the React tree.
 */
function DeviceFrame({ width, children }: { width: number; children: React.ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    // Vite's dev server injects/replaces <style>/<link> tags into the main
    // document lazily as more components/routes are touched — a one-time
    // clone at iframe-load only captured whatever existed at that instant,
    // so the preview would silently drift out of sync with real styling
    // (utility classes used for the first time later never made it in).
    // A MutationObserver on the main document's <head> keeps re-cloning
    // anything new into the iframe for as long as it's mounted.
    const cloneNode = (node: Element) => {
      const doc = iframe.contentDocument;
      if (doc) doc.head.appendChild(node.cloneNode(true));
    };
    const copyStylesAndMount = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.head.innerHTML = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(cloneNode);
      doc.body.style.margin = '0';
      setMountNode(doc.body);
    };
    iframe.addEventListener('load', copyStylesAndMount);
    if (iframe.contentDocument?.readyState === 'complete') copyStylesAndMount();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && (node.tagName === 'STYLE' || (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet'))) {
            cloneNode(node);
          }
        }
      }
    });
    observer.observe(document.head, { childList: true });

    return () => {
      iframe.removeEventListener('load', copyStylesAndMount);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <iframe ref={iframeRef} title="Storefront preview" style={{ width, height: '100%', border: 'none', display: 'block' }} />
      {mountNode && createPortal(children, mountNode)}
    </>
  );
}

/**
 * Live preview inside the builder — reuses the EXACT same `SectionRenderer`
 * (and section components underneath it) as the real public storefront, fed
 * by the seller's own real store/product data via the same public endpoints
 * (safe to call from the dashboard too, since they require no auth and this
 * seller owns the store being previewed). This is what makes the preview
 * genuinely WYSIWYG, unlike the old Store Builder's disconnected mock
 * (`StorePreview`, which rendered hardcoded sample products and features —
 * a custom footer, hero text — the real page never displayed).
 */
export function BuilderPreview({ store, theme, sections }: {
  store: StoreData;
  theme: StoreThemeData | null;
  sections: Section[];
}) {
  const [device, setDevice] = useState<Device>('desktop');

  // `sections` changes on every keystroke in any field editor on the page
  // (heading, a hero slide's text, etc.), and re-rendering `SectionRenderer`
  // is genuinely heavy — it's the real storefront's own component tree,
  // portaled into a live iframe. Doing that synchronously on every single
  // character was the actual cause of the "type one letter, click the
  // field again" complaint: the main thread was busy re-rendering the whole
  // preview on each keystroke, not that the input itself lost focus. A
  // short debounce lets typing stay instant in the real form (which reads
  // `sections` directly, not this) while the expensive preview settles
  // shortly after the user pauses.
  const [debouncedSections, setDebouncedSections] = useState(sections);
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSections(sections), 400);
    return () => clearTimeout(t);
  }, [sections]);

  const cfg = useMemo(() => ({
    primaryColor: theme?.theme.primaryColor ?? STOREFRONT_CFG_DEFAULT.primaryColor,
    bgColor:      theme?.theme.bgColor      ?? STOREFRONT_CFG_DEFAULT.bgColor,
    textColor:    theme?.theme.textColor    ?? STOREFRONT_CFG_DEFAULT.textColor,
    accentColor:  theme?.theme.accentColor  ?? STOREFRONT_CFG_DEFAULT.accentColor,
    font:         theme?.theme.font         ?? STOREFRONT_CFG_DEFAULT.font,
  }), [theme]);

  const contextValue: StorefrontContextValue = useMemo(() => ({
    store: {
      storeId: store._id, sellerId: store.sellerId, name: store.name, slug: store.slug,
      logo: store.logo, coverImage: store.coverImage, description: store.description,
      followersCount: 0, averageRating: 0, reviewCount: 0, builderConfig: null,
      baseCurrency: store.baseCurrency, sellerType: store.sellerType, badges: [],
      createdAt: store.createdAt, activeCampaign: null, announcementBar: null,
    },
    theme,
    cfg,
    resolveLink: () => ({ to: undefined, href: undefined }), // links are inert inside the preview
  }), [store, theme, cfg]);

  return (
    <div className="border border-bone rounded-2xl overflow-hidden bg-white shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="px-3.5 py-2.5 bg-cream border-b border-bone flex items-center justify-between">
        <span className="text-[10.5px] font-bold uppercase tracking-wide text-slate">Live Preview</span>
        <div className="flex items-center gap-1 bg-white border border-bone rounded-lg p-[3px]">
          {(['desktop', 'tablet', 'mobile'] as Device[]).map(d => {
            const Icon = DEVICE_ICON[d];
            return (
              <button
                key={d}
                onClick={() => setDevice(d)}
                aria-label={d}
                title={d.charAt(0).toUpperCase() + d.slice(1)}
                className={clsx(
                  'w-7 h-6 rounded-md flex items-center justify-center border-none cursor-pointer transition-colors',
                  device === d ? 'bg-brand-pale-orange text-brand-deep-orange' : 'bg-transparent text-slate hover:bg-cream',
                )}
              >
                <Icon size={13} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="h-[70vh] overflow-x-auto overflow-y-hidden flex justify-center bg-[#EDEBE3] pointer-events-none">
        <div className={clsx('h-full bg-white shrink-0', device !== 'desktop' && 'my-3 rounded-2xl overflow-hidden border border-bone shadow-md')} style={{ width: DEVICE_WIDTH[device] }}>
          <DeviceFrame width={DEVICE_WIDTH[device]}>
            <div style={{ background: cfg.bgColor }}>
              <StorefrontProvider value={contextValue}>
                {debouncedSections.length === 0
                  ? <p style={{ fontSize: 13, color: '#8C8A82', textAlign: 'center', padding: '64px 16px' }}>Add a section to see it here.</p>
                  : <SectionRenderer sections={debouncedSections} />}
              </StorefrontProvider>
            </div>
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}
