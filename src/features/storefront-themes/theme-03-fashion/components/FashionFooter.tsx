import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { expandCopyright, readFooterOptions, visibleFooterBlocks } from '../../navigation/headerOptions';
import { fashionTheme as t } from '../theme.config';
import { FooterColumns, FooterNewsletterStrip, type FooterColumnTokens } from './nav/FooterColumns';
import { FashionLocaleControls } from './FashionLocaleControls';

/** Footer: a dark rounded panel with the retailer's columns, newsletter and socials, plus a legal row. */
export function FashionFooter() {
  const { store, theme } = useStorefront();
  const [pages, setPages] = useState<PublicPageSummary[]>([]);
  useEffect(() => {
    let off = false;
    apiListPublicStorePages(store.storeId).then(r => { if (!off) setPages(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId]);

  const opts = readFooterOptions(theme?.footer, 'Journal');
  const bg = opts.bgColor ?? t.colors.ink;
  const fg = opts.textColor ?? t.colors.bg;
  const muted = `color-mix(in srgb, ${fg} 66%, transparent)`;
  const line = `color-mix(in srgb, ${fg} 16%, transparent)`;
  const copyright = visibleFooterBlocks(theme?.footer).find(b => b.type === 'copyright_text')?.settings.text as string | undefined;
  const legal = [...pages.filter(p => p.showInFooter && !p.policyType), ...(opts.showPolicyLinks ? pages.filter(p => p.policyType) : [])];

  const tokens: FooterColumnTokens = {
    fontBody: t.fonts.body, fontDisplay: t.fonts.display, fg, muted,
    heading: { fontFamily: t.fonts.body, fontSize: '14px', fontWeight: 600, color: fg, marginBottom: 16 },
    linkSize: '14px', brandWeight: 600,
    input: { fontFamily: t.fonts.body, fontSize: 14, color: fg, border: `1px solid ${line}`, padding: '12px 18px', borderRadius: 9999, background: 'transparent' },
    button: { fontFamily: t.fonts.body, fontSize: 14, fontWeight: 500, background: fg, color: bg, padding: '12px 24px', borderRadius: 9999 },
    doneColor: '#86EFAC', errorColor: '#FCA5A5', idPrefix: 'fx', newsletterHeading: 'Stay in the loop', blogLabel: opts.blogLabel,
  };

  return (
    <footer style={{ padding: `0 ${t.layout.containerPadX} 24px`, fontFamily: t.fonts.body, background: t.colors.bg }}>
      <div className="mx-auto overflow-hidden" style={{ maxWidth: t.layout.maxWidth, background: bg, color: fg, borderRadius: 28 }}>
        <FooterNewsletterStrip tokens={tokens} maxWidth="100%" padX="clamp(24px, 4vw, 56px)" line={line} />
        <div className="flex flex-wrap gap-x-10 gap-y-10" style={{ padding: `${opts.padding.columns}px clamp(24px, 4vw, 56px)` }}>
          <FooterColumns tokens={tokens} />
        </div>
        <div style={{ borderTop: `1px solid ${line}` }}>
          <div className="flex flex-col items-center justify-between gap-3 text-[13px] md:flex-row" style={{ padding: '20px clamp(24px, 4vw, 56px)', color: muted }}>
            <p className="m-0">{copyright ? expandCopyright(copyright) : `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`}</p>
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1" aria-label="Legal">
              {legal.map(p => <Link key={p._id} to={`/${p.slug}`} className="no-underline hover:underline" style={{ color: muted }}>{p.title}</Link>)}
              {opts.showCurrency && <FashionLocaleControls />}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}
