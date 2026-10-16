import { ArrowUp, Mail, Phone, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { NavAnchor } from '../../../navigation/NavAnchor';
import type { HeaderOptions } from '../../../navigation/headerOptions';
import { fashionTheme as t } from '../../theme.config';

/** Footer "Back to top" pill. */
export function BackToTop({ color, fontFamily }: { color: string; fontFamily: string }) {
  return (
    <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border bg-transparent px-3.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-70"
      style={{ color, fontFamily, borderColor: `color-mix(in srgb, ${color} 25%, transparent)` }}>
      <ArrowUp size={13} /> Back to top
    </button>
  );
}

/** Thin strip above the header: a short line of text plus phone / email (those hide on small screens). */
export function HeaderTopBar({ bar, fallbackBg, fallbackColor, fontFamily, maxWidth, padX }: {
  bar: NonNullable<HeaderOptions['topBar']>; fallbackBg: string; fallbackColor: string; fontFamily: string; maxWidth: string; padX: string;
}) {
  const color = bar.color ?? fallbackColor;
  return (
    <div style={{ background: bar.bg ?? fallbackBg, color, fontFamily }}>
      <div className="mx-auto flex items-center justify-between gap-4 text-[13px] font-medium" style={{ maxWidth, padding: `9px ${padX}` }}>
        <span className="min-w-0 truncate">{bar.text}</span>
        <span className="hidden shrink-0 items-center gap-5 sm:flex">
          {bar.phone && <a href={`tel:${bar.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 no-underline hover:underline" style={{ color }}><Phone size={13} />{bar.phone}</a>}
          {bar.email && <a href={`mailto:${bar.email}`} className="flex items-center gap-1.5 no-underline hover:underline" style={{ color }}><Mail size={13} />{bar.email}</a>}
        </span>
      </div>
    </div>
  );
}

/** The retailer's call-to-action pill in the header (desktop only; the mobile drawer keeps the menu clean). */
export function HeaderCta({ cta, bg, color, radius, fontFamily }: { cta: NonNullable<HeaderOptions['cta']>; bg: string; color: string; radius: string; fontFamily: string }) {
  return (
    <NavAnchor link={cta.link.startsWith('/') ? { to: cta.link } : { href: cta.link }}
      className="mr-1.5 hidden items-center whitespace-nowrap no-underline transition-opacity hover:opacity-85 lg:inline-flex"
      style={{ background: bg, color, borderRadius: radius, fontFamily, fontSize: 14, fontWeight: 500, padding: '10px 20px' }}>
      {cta.label}
    </NavAnchor>
  );
}

/** "Search products…" pill that opens the search panel (the real predictive search). */
export function HeaderSearchBar({ onOpen, color, fontFamily }: { onOpen: () => void; color: string; fontFamily: string }) {
  const { t: tr } = useTranslation('storefront');
  return (
    <button type="button" onClick={onOpen} aria-label={tr('nav.search', 'Search')}
      className="hidden cursor-pointer items-center gap-2.5 rounded-full border-0 text-left md:flex"
      style={{ width: 'clamp(170px, 22vw, 300px)', padding: '10px 16px', background: t.colors.bgAlt, color, fontFamily, fontSize: 14 }}>
      <Search size={16} style={{ opacity: 0.7 }} />
      <span style={{ opacity: 0.65 }}>{tr('nav.searchProducts', 'Search products…')}</span>
    </button>
  );
}
