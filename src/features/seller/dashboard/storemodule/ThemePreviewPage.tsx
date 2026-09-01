import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Check, Monitor, Tablet, Smartphone } from 'lucide-react';
import { clsx } from 'clsx';
import { apiGetThemeCatalogBySlug, apiApplyThemeDefinition, type ThemeDefinition } from '@/api/services/themeCatalog';
import { DeviceFrame } from './builder/DeviceFrame';
import { ThemeDemoStorefront } from './builder/ThemeDemoStorefront';
import { ConfirmDialog } from './builder/ConfirmDialog';

type Device = 'desktop' | 'tablet' | 'mobile';
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, tablet: 768, mobile: 390 };
const DEVICE_ICON: Record<Device, typeof Monitor> = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };

/**
 * A standalone page (opened in its own browser tab, no seller-dashboard
 * sidebar/chrome) that renders exactly ONE theme, resolved purely from the
 * `:themeId` route param (actually the theme's `slug` — see
 * `ThemeTab.openPreview`) fetched fresh from the public Theme Marketplace
 * catalog — never from any in-memory "currently active"/"currently being
 * edited" state. This is the deliberate fix for Preview showing the wrong
 * theme: a brand-new page load has no shared state with the Theme Library
 * tab to possibly leak from, so the previewed theme can never silently
 * become the active/customized one.
 *
 * Renders a complete, rich DEMO storefront (`ThemeDemoStorefront`, full
 * size, every section down to testimonials/footer) — like a real
 * WordPress/Shopify theme preview — rather than the seller's own real
 * (possibly sparse/unfinished) page content, so every catalog theme always
 * looks like a fully realized, distinct site regardless of how much the
 * seller has actually built out yet. "Use This Theme" applies to the
 * seller's REAL store via the same backend `applyThemeDefinition` call the
 * Theme Library tab uses — stages the theme into the DRAFT only, nothing
 * goes live until the seller publishes from Store Builder.
 */
export function ThemePreviewPage() {
  const { storeId = '', themeId: slug = '' } = useParams<{ storeId: string; themeId: string }>();
  const [theme, setTheme] = useState<ThemeDefinition | null>(null);
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState<Device>('desktop');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    apiGetThemeCatalogBySlug(slug)
      .then(res => { if (!cancelled) setTheme(res.data); })
      .catch(() => { if (!cancelled) setTheme(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const [confirming, setConfirming] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const confirmApply = useCallback(async () => {
    if (!theme) return;
    setApplying(true);
    try {
      await apiApplyThemeDefinition(storeId, theme._id);
      setConfirming(false);
      setApplied(true);
    } finally {
      setApplying(false);
    }
  }, [storeId, theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-6">
        <p className="text-[14px] text-slate">Loading theme…</p>
      </div>
    );
  }

  if (!theme) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9F5] p-6">
        <p className="text-[14px] text-slate">Unknown theme "{slug}". Close this tab and reopen Preview from the Theme Library.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EDEBE3] flex flex-col">
      {/* Deliberately lightweight — the storefront itself is the focus here,
          not a recreation of the seller dashboard's heavy chrome. */}
      <div className="sticky top-0 z-10 bg-white border-b border-bone px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={`/store/${storeId}/storebuilder`}
            className="flex items-center gap-1.5 text-[12.5px] font-semibold text-slate hover:text-charcoal no-underline shrink-0"
          >
            <ArrowLeft size={14} /> Back to Theme Library
          </Link>
          <span className="w-px h-4 bg-bone shrink-0" />
          <div className="min-w-0">
            <p className="text-[14px] font-bold text-charcoal truncate">{theme.name}</p>
            {theme.tags.length > 0 && <p className="text-[10.5px] text-slate">{theme.tags.join(' · ')}</p>}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 bg-cream border border-bone rounded-lg p-[3px]">
            {(['desktop', 'tablet', 'mobile'] as Device[]).map(d => {
              const Icon = DEVICE_ICON[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-label={d}
                  title={d.charAt(0).toUpperCase() + d.slice(1)}
                  className={clsx(
                    'w-8 h-7 rounded-md flex items-center justify-center border-none cursor-pointer transition-colors',
                    device === d ? 'bg-white text-brand-deep-orange shadow-sm' : 'bg-transparent text-slate hover:text-charcoal',
                  )}
                >
                  <Icon size={14} />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={applied}
            className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60"
            style={{ background: applied ? '#2E9E5B' : '#D97757' }}
          >
            {applied ? <><Check size={14} /> Applied</> : 'Use This Theme'}
          </button>
        </div>
      </div>

      {applied && (
        <p className="bg-success-bg text-success text-[12.5px] font-semibold text-center py-2 px-4">
          {theme.name} applied to your store. Switch back to (or refresh) your Theme Library tab to see it there.
        </p>
      )}

      <div className="flex-1 flex justify-center py-6 px-4 overflow-x-auto">
        <div
          className={clsx('bg-white shrink-0', device !== 'desktop' && 'rounded-2xl overflow-hidden border border-bone shadow-lg')}
          style={{ width: DEVICE_WIDTH[device], height: 'calc(100vh - 130px)' }}
        >
          <DeviceFrame width={DEVICE_WIDTH[device]}>
            <ThemeDemoStorefront theme={theme} />
          </DeviceFrame>
        </div>
      </div>

      {confirming && (
        <ConfirmDialog
          title={`Apply ${theme.name}?`}
          message="Your current theme customization will be replaced by this theme. You can customize it again afterward."
          confirmLabel="Apply Theme"
          loading={applying}
          onCancel={() => setConfirming(false)}
          onConfirm={confirmApply}
        />
      )}
    </div>
  );
}
