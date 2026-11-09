import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { handleOf } from '@/utils/activeStoreText';
import { ts, tsNodes } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { expandCopyright, readFooterOptions, visibleFooterBlocks } from '../../navigation/headerOptions';
import { FooterColumns, FooterNewsletterStrip, SocialRow, type FooterColumnTokens } from './nav/FooterColumns';
import { PaymentBadges } from './nav/FooterParts';
import { TechLocaleControls } from './TechLocaleControls';
import { BackToTop } from '../../navigation/HeaderExtras';
import { hasSocialTarget } from '../../navigation/socialLinks';
import { techTheme as t } from '../theme.config';
import { TechSectionRenderer } from '../sections';

/** Tech footer: full-width near-black band (newsletter on top, the seller's columns, legal row). The trust strip above it is the seller's own "Feature strip" section in Footer sections. */
export function TechFooter() {
  const { store, theme } = useStorefront();
  const [pages, setPages] = useState<PublicPageSummary[]>([]);
  useEffect(() => {
    let off = false;
    apiListPublicStorePages(store.storeId).then(r => { if (!off) setPages(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId]);

  const opts = readFooterOptions(theme?.footer, ts('blog.label', 'Blog'));
  const light = t.footerTone === 'light';
  const bg = opts.bgColor ?? (light ? t.colors.bgAlt : t.colors.dark);
  const fg = opts.textColor ?? (light ? t.colors.ink : t.colors.darkInk);
  const muted = `color-mix(in srgb, ${fg} 66%, transparent)`;
  const line = `color-mix(in srgb, ${fg} 18%, transparent)`;
  const blocks = visibleFooterBlocks(theme?.footer);
  const copyright = blocks.find(b => b.type === 'copyright_text')?.settings.text as string | undefined;
  const bottomSocials = blocks.some(b => b.type === 'footer_brand') ? [] : blocks.filter(b => b.type === 'social_link' && hasSocialTarget(b));
  const paymentIcons = blocks.filter(b => b.type === 'footer_payment_icons').flatMap(b => (Array.isArray(b.settings?.icons) ? b.settings.icons as string[] : []));
  const legal = [...pages.filter(p => p.showInFooter && !p.policyType), ...(opts.showPolicyLinks ? pages.filter(p => p.policyType) : [])];
  const wordmarkSrc = opts.wordmarkSource === 'store' ? store.logo : opts.wordmarkSource === 'custom' ? opts.wordmarkUrl : null;
  const socialsNode = bottomSocials.length > 0 && <div className="[&>div]:mt-0"><SocialRow socials={bottomSocials} k={{ fg, muted }} look={opts.socialStyle} color={opts.socialColor} customColor={opts.socialCustomColor} filled={opts.socialFilled} size={opts.socialSize} /></div>;
  const paymentNode = paymentIcons.length > 0 && <PaymentBadges icons={[...new Set(paymentIcons)]} tokens={{ fontFamily: t.fonts.body, color: fg, muted, fontSize: '12px' }} border={line} />;
  const legalLinks = legal.map(p => <Link key={p._id} to={`/${handleOf(p)}`} className="no-underline hover:underline" style={{ color: muted }}>{p.title}</Link>);
  const copyrightNode = <p className="m-0">{copyright ? expandCopyright(copyright) : tsNodes('pg.year_store_all_rights_reserved', '© {{year}} {{store}}. All rights reserved.', { store: <bdi>{store.name}</bdi> }, { year: new Date().getFullYear() })}</p>;

  const tokens: FooterColumnTokens = {
    fontBody: t.fonts.body, fontDisplay: t.fonts.display, fg, muted,
    heading: { fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 600, color: muted, marginBottom: 14 },
    linkSize: '13px', brandWeight: 600,
    input: { fontFamily: t.fonts.body, fontSize: 14, color: fg, border: `1px solid ${light ? t.colors.borderStrong : fg}`, padding: '12px 16px', borderRadius: t.fieldRadiusPx, background: 'transparent' },
    button: { fontFamily: t.fonts.body, fontSize: 14, fontWeight: 600, background: t.colors.accent, color: t.colors.accentInk, padding: '12px 24px', borderRadius: 9999 },
    doneColor: light ? t.colors.success : '#86EFAC', errorColor: light ? t.colors.danger : '#FCA5A5', idPrefix: 'tx', newsletterHeading: ts('pg.sign_up_to_our_newsletter', 'Sign up to our newsletter.'), blogLabel: opts.blogLabel,
  };

  return (
    <>
      {(theme?.footer?.sections?.length ?? 0) > 0 && <TechSectionRenderer sections={theme?.footer?.sections ?? []} />}
      <footer style={{ background: bg, color: fg, fontFamily: t.fonts.body }}>
        <FooterNewsletterStrip tokens={tokens} maxWidth={t.layout.maxWidth} padX={t.layout.containerPadX} line={line} />
        <div className={`mx-auto gap-x-12 gap-y-10 ${t.footerColumns ? 'tx-footer-grid' : 'flex flex-wrap'}`} style={{ maxWidth: t.layout.maxWidth, padding: `${opts.padding.columns}px ${t.layout.containerPadX}`, ...(t.footerColumns ? { ['--tx-fcols' as string]: t.footerColumns } : null) }}>
          <FooterColumns tokens={tokens} />
        </div>
        <div style={{ borderTop: `1px solid ${line}` }}>
          {opts.bottomLayout === 'stacked' ? (
            <div className="mx-auto flex flex-col gap-4 text-xs" style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}`, color: muted }}>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
                <nav className="flex flex-wrap items-center gap-x-5 gap-y-2" aria-label={ts('pg.legal', 'Legal')}>
                  {opts.showCurrency && <TechLocaleControls />}
                  {legalLinks}
                  {opts.showBackToTop && <BackToTop color={muted} fontFamily={t.fonts.body} />}
                </nav>
                {paymentNode}
              </div>
              {socialsNode}
              <div className="text-center">{copyrightNode}</div>
            </div>
          ) : (
            <div className="mx-auto flex flex-col items-center justify-between gap-3 text-xs md:flex-row" style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}`, color: muted }}>
              {socialsNode}
              {paymentNode}
              <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1" aria-label={ts('pg.legal', 'Legal')}>
                {legalLinks}
                {opts.showCurrency && <TechLocaleControls />}
                {opts.showBackToTop && <BackToTop color={muted} fontFamily={t.fonts.body} />}
              </nav>
              {copyrightNode}
            </div>
          )}
        </div>
        {wordmarkSrc && (
          <div className="mx-auto flex justify-center" style={{ maxWidth: t.layout.maxWidth, padding: `8px ${t.layout.containerPadX} 28px` }}>
            <img src={wordmarkSrc} alt={store.name} loading="lazy" style={{ width: `${opts.wordmarkWidth}%`, maxWidth: '100%', height: 'auto', display: 'block' }} />
          </div>
        )}
      </footer>
    </>
  );
}
