import { useMemo, useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';
import type { StoreData } from '@/api/services/store';
import type { StoreThemeData } from '@/api/services/storeTheme';
import type { Section } from '@/api/services/storefrontTypes';
import { StorefrontProvider, resolveStorefrontCfg, type StorefrontContextValue } from '@/features/storefront/StorefrontContext';
import { SectionRenderer } from '@/features/storefront/SectionRenderer';
import { StorefrontNavbar } from '@/features/storefront/StorefrontNavbar';
import { StorefrontFooter } from '@/features/storefront/StorefrontFooter';
import { DeviceFrame } from './DeviceFrame';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };
const DEVICE_ICON: Record<Device, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

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
export function BuilderPreview({ store, theme, sections, heightClass = 'h-[70vh]' }: {
  store: StoreData;
  theme: StoreThemeData | null;
  sections: Section[];
  /** Taller on the Theme tab, where visual judgment is the whole point —
   *  see `StoreBuilder`'s theme-tab-specific grid. */
  heightClass?: string;
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

  const cfg = useMemo(() => resolveStorefrontCfg(theme), [theme]);

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
      <div className={clsx(heightClass, 'overflow-x-auto overflow-y-hidden flex justify-center bg-[#EDEBE3] pointer-events-none')}>
        <div className={clsx('h-full bg-white shrink-0', device !== 'desktop' && 'my-3 rounded-2xl overflow-hidden border border-bone shadow-md')} style={{ width: DEVICE_WIDTH[device] }}>
          <DeviceFrame width={DEVICE_WIDTH[device]}>
            <div style={{ background: cfg.bgColor }}>
              <StorefrontProvider value={contextValue}>
                <StorefrontNavbar />
                {debouncedSections.length === 0
                  ? <p style={{ fontSize: 13, color: '#8C8A82', textAlign: 'center', padding: '64px 16px' }}>Add a section to see it here.</p>
                  : <SectionRenderer sections={debouncedSections} />}
                <StorefrontFooter />
              </StorefrontProvider>
            </div>
          </DeviceFrame>
        </div>
      </div>
    </div>
  );
}
