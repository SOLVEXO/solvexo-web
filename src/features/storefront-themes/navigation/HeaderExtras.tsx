import { ArrowUp, Search } from 'lucide-react';
import { ChromeTopStrip } from '@/features/storefront/chrome/ChromeTopStrip';
import { useTranslation } from 'react-i18next';
import { scrollRootToTop } from '@/utils/scrollRoot';
import { NavAnchor } from './NavAnchor';
import type { HeaderOptions } from './headerOptions';

/** Footer "Back to top" link. */
export function BackToTop({ color, fontFamily }: { color: string; fontFamily: string }) {
  return (
    <button type="button" onClick={() => scrollRootToTop('smooth')}
      className="inline-flex items-center gap-1 bg-transparent border-0 cursor-pointer p-0" style={{ color, fontFamily, fontSize: '12px' }}>
      <ArrowUp size={13} /> Back to top
    </button>
  );
}

/** Thin strip above the header: a short line of text plus phone / email (the email/phone hide on small screens). */
export function HeaderTopBar({ bar, fallbackBg, fallbackColor, fontFamily, maxWidth, padX }: {
  bar: NonNullable<HeaderOptions['topBar']>; fallbackBg: string; fallbackColor: string; fontFamily: string; maxWidth: string; padX: string;
}) {
  return <ChromeTopStrip bar={bar} fallbackBg={fallbackBg} fallbackColor={fallbackColor} fontFamily={fontFamily} maxWidth={maxWidth} padX={padX} />;
}

/** The retailer's call-to-action button in the header (desktop only; the mobile drawer keeps the menu clean). */
export function HeaderCta({ cta, bg, color, radius, fontFamily }: { cta: NonNullable<HeaderOptions['cta']>; bg: string; color: string; radius: string; fontFamily: string }) {
  return (
    <NavAnchor link={cta.link.startsWith('/') ? { to: cta.link } : { href: cta.link }}
      className="no-underline hidden lg:inline-flex items-center whitespace-nowrap"
      style={{ background: bg, color, borderRadius: radius, fontFamily, fontSize: '13px', fontWeight: 700, padding: '9px 16px' }}>
      {cta.label}
    </NavAnchor>
  );
}

/** "Search products…" field look that opens the theme's search panel (the real predictive search). */
export function HeaderSearchBar({ onOpen, color, border, bg, radius, fontFamily }: { onOpen: () => void; color: string; border: string; bg: string; radius: string; fontFamily: string }) {
  const { t: tr } = useTranslation('storefront');
  return (
    <button type="button" onClick={onOpen} aria-label={tr('nav.search', "Search")}
      className="hidden md:flex items-center gap-2 cursor-pointer text-left"
      style={{ width: 'clamp(160px, 22vw, 300px)', padding: '9px 14px', border: `1px solid ${border}`, background: bg, color, borderRadius: radius, fontFamily, fontSize: '13px' }}>
      <Search size={15} style={{ opacity: 0.7 }} />
      <span style={{ opacity: 0.65 }}>{tr('nav.searchProducts', "Search products…")}</span>
    </button>
  );
}
