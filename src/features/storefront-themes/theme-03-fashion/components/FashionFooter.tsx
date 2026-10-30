import { useEffect, useState } from 'react';
import { handleOf } from '@/utils/activeStoreText';
import { ts, tsNodes } from '@/utils/tStatic';
import { Link } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { expandCopyright, readFooterOptions, visibleFooterBlocks } from '../../navigation/headerOptions';
import { fashionTheme as t } from '../theme.config';
import { FooterColumns, FooterNewsletterStrip, SocialRow, type FooterColumnTokens } from './nav/FooterColumns';
import { FashionLocaleControls } from './FashionLocaleControls';
import { BackToTop } from './nav/HeaderExtras';
import { PaymentBadges } from './nav/FooterParts';
import { FashionSectionRenderer } from '../sections';
import { EditableText, useInlineEditActive } from '../../inlineEdit';

/** Footer: a dark rounded panel with the retailer's columns, newsletter and socials, plus a legal row. */
export function FashionFooter() {
  const { store, theme } = useStorefront();
  const [pages, setPages] = useState<PublicPageSummary[]>([]);
  useEffect(() => {
    let off = false;
    apiListPublicStorePages(store.storeId).then(r => { if (!off) setPages(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId]);

  const opts = readFooterOptions(theme?.footer, ts('blog.journal', 'Journal'));
  const bg = opts.bgColor ?? t.colors.ink;
  const fg = opts.textColor ?? t.colors.bg;
  const muted = `color-mix(in srgb, ${fg} 66%, transparent)`;
  const line = `color-mix(in srgb, ${fg} 16%, transparent)`;
  const copyrightBlock = visibleFooterBlocks(theme?.footer).find(b => b.type === 'copyright_text');
  const copyright = copyrightBlock?.settings.text as string | undefined;
  // Social icons live in the Brand block; with no Brand block they go in the bottom bar so they never vanish.
  const footerBlocks = visibleFooterBlocks(theme?.footer);
  const bottomSocials = footerBlocks.some(b => b.type === 'footer_brand') ? [] : footerBlocks.filter(b => b.type === 'social_link');
  const paymentIcons = footerBlocks.filter(b => b.type === 'footer_payment_icons').flatMap(b => (Array.isArray(b.settings?.icons) ? b.settings.icons as string[] : []));
  const editing = useInlineEditActive();
  const legal = [...pages.filter(p => p.showInFooter && !p.policyType), ...(opts.showPolicyLinks ? pages.filter(p => p.policyType) : [])];

  const tokens: FooterColumnTokens = {
    fontBody: t.fonts.body, fontDisplay: t.fonts.display, fg, muted,
    heading: { fontFamily: t.fonts.body, fontSize: '14px', fontWeight: 600, color: fg, marginBottom: 16 },
    linkSize: '14px', brandWeight: 600,
    input: { fontFamily: t.fonts.body, fontSize: 14, color: fg, border: `1px solid ${line}`, padding: '12px 18px', borderRadius: 9999, background: 'transparent' },
    button: { fontFamily: t.fonts.body, fontSize: 14, fontWeight: 500, background: fg, color: bg, padding: '12px 24px', borderRadius: 9999 },
    doneColor: '#86EFAC', errorColor: '#FCA5A5', idPrefix: 'fx', newsletterHeading: ts('pg.stay_in_the_loop', 'Stay in the loop'), blogLabel: opts.blogLabel,
  };

  return (
    <>
    {(theme?.footer?.sections?.length ?? 0) > 0 && <FashionSectionRenderer sections={theme?.footer?.sections ?? []} />}
    <footer style={{ padding: `0 ${t.layout.containerPadX} 24px`, fontFamily: t.fonts.body, background: t.colors.bg }}>
      <div className="mx-auto overflow-hidden" style={{ maxWidth: t.layout.maxWidth, background: bg, color: fg, borderRadius: t.sectionRadiusPx }}>
        <FooterNewsletterStrip tokens={tokens} maxWidth="100%" padX="clamp(24px, 4vw, 56px)" line={line} />
        <div className="flex flex-wrap gap-x-10 gap-y-10" style={{ padding: `${opts.padding.columns}px clamp(24px, 4vw, 56px)` }}>
          <FooterColumns tokens={tokens} />
        </div>
        <div style={{ borderTop: `1px solid ${line}` }}>
          <div className="flex flex-col items-center justify-between gap-3 text-[13px] md:flex-row" style={{ padding: '20px clamp(24px, 4vw, 56px)', color: muted }}>
            <p className="m-0">{copyright && copyrightBlock?._id && editing ? <EditableText value={copyright} settingKey="text" blockId={copyrightBlock._id} /> : copyright ? expandCopyright(copyright) : tsNodes('pg.year_store_all_rights_reserved', '© {{year}} {{store}}. All rights reserved.', { store: <bdi>{store.name}</bdi> }, { year: new Date().getFullYear() })}</p>
            {bottomSocials.length > 0 && <div className="[&>div]:mt-0"><SocialRow socials={bottomSocials} k={{ fg, muted }} look={opts.socialStyle} center color={opts.socialColor} customColor={opts.socialCustomColor} filled={opts.socialFilled} size={opts.socialSize} /></div>}
            {paymentIcons.length > 0 && <PaymentBadges icons={[...new Set(paymentIcons)]} tokens={{ fontFamily: t.fonts.body, color: fg, muted, fontSize: '12px' }} border={line} />}
            <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1" aria-label={ts('pg.legal', 'Legal')}>
              {legal.map(p => <Link key={p._id} to={`/${handleOf(p)}`} className="no-underline hover:underline" style={{ color: muted }}>{p.title}</Link>)}
              {opts.showCurrency && <FashionLocaleControls />}
              {opts.showBackToTop && <BackToTop color={muted} fontFamily={t.fonts.body} />}
            </nav>
          </div>
        </div>
      </div>
    </footer>
    </>
  );
}
