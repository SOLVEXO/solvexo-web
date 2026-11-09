import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { handleOf } from '@/utils/activeStoreText';
import { ts, tsNodes } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiListPublicStorePages, type PublicPageSummary } from '@/api/services/storePages';
import { expandCopyright, readFooterOptions, visibleFooterBlocks } from '../../navigation/headerOptions';
import { BackToTop } from '../../navigation/HeaderExtras';
import { hasSocialTarget } from '../../navigation/socialLinks';
import { FooterColumns, FooterNewsletterStrip, SocialRow, type FooterColumnTokens } from './nav/FooterColumns';
import { PaymentBadges } from './nav/FooterParts';
import { ledupTheme as t } from '../theme.config';
import { LedupSectionRenderer } from '../sections/LedupSectionRenderer';

/** Curved espresso footer. Everything in it is the seller's: footer blocks (columns, contact, newsletter, social, payment icons), legal pages and copyright. */
export function LedupFooter() {
  const { store, theme } = useStorefront();
  const [pages, setPages] = useState<PublicPageSummary[]>([]);
  useEffect(() => {
    let off = false;
    apiListPublicStorePages(store.storeId).then(r => { if (!off) setPages(r.data ?? []); }).catch(() => {});
    return () => { off = true; };
  }, [store.storeId]);

  const opts = readFooterOptions(theme?.footer, ts('blog.label', 'Blog'));
  const fg = opts.textColor ?? t.colors.footerInk;
  const muted = `color-mix(in srgb, ${fg} 70%, transparent)`;
  const line = `color-mix(in srgb, ${fg} 16%, transparent)`;
  const blocks = visibleFooterBlocks(theme?.footer);
  const copyright = blocks.find(b => b.type === 'copyright_text')?.settings.text as string | undefined;
  const bottomSocials = blocks.some(b => b.type === 'footer_brand') ? [] : blocks.filter(b => b.type === 'social_link' && hasSocialTarget(b));
  const paymentIcons = blocks.filter(b => b.type === 'footer_payment_icons').flatMap(b => (Array.isArray(b.settings?.icons) ? b.settings.icons as string[] : []));
  const legal = [...pages.filter(p => p.showInFooter && !p.policyType), ...(opts.showPolicyLinks ? pages.filter(p => p.policyType) : [])];

  const tokens: FooterColumnTokens = {
    fontBody: t.fonts.body, fontDisplay: t.fonts.display, fg, muted,
    heading: { fontFamily: t.fonts.body, fontSize: '14px', fontWeight: 600, color: fg, marginBottom: 14 },
    linkSize: '14px', brandWeight: 600,
    input: { fontFamily: t.fonts.body, fontSize: 14, color: fg, border: `1px solid ${line}`, padding: '12px 18px', borderRadius: 9999, background: 'transparent' },
    button: { fontFamily: t.fonts.body, fontSize: 14, fontWeight: 500, background: t.colors.accent, color: t.colors.accentInk, padding: '12px 24px', borderRadius: 9999 },
    doneColor: '#86EFAC', errorColor: '#FCA5A5', idPrefix: 'ld',
    newsletterHeading: ts('pg.sign_up_to_our_newsletter', 'Sign up to our newsletter.'), blogLabel: opts.blogLabel,
  };

  return (
    <>
      {(theme?.footer?.sections?.length ?? 0) > 0 && <LedupSectionRenderer sections={theme?.footer?.sections ?? []} />}
      <footer className="w-full pt-16" style={{ fontFamily: t.fonts.body }}>
        <div className="ld-footer-wrapper" style={{ color: fg, ...(opts.bgColor ? { background: opts.bgColor } : {}) }}>
          <div className="mx-auto max-w-7xl px-6 pb-6 pt-16 sm:px-10 lg:px-16 lg:pt-24">
            <h2 className="ld-footer-title m-0 mb-12 text-[clamp(28px,4.5vw,58px)] font-light leading-tight"><bdi>{store.name}</bdi></h2>
            <FooterNewsletterStrip tokens={tokens} maxWidth="100%" padX="0px" line={line} />
            <div className="flex flex-wrap gap-x-12 gap-y-10 pb-14 pt-8">
              <FooterColumns tokens={tokens} />
            </div>
            <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs md:flex-row" style={{ borderTop: `1px solid ${line}`, color: muted }}>
              {bottomSocials.length > 0 && <div className="[&>div]:mt-0"><SocialRow socials={bottomSocials} k={{ fg, muted }} look={opts.socialStyle} color={opts.socialColor} customColor={opts.socialCustomColor} filled={opts.socialFilled} size={opts.socialSize} /></div>}
              {paymentIcons.length > 0 && <PaymentBadges icons={[...new Set(paymentIcons)]} tokens={{ fontFamily: t.fonts.body, color: fg, muted, fontSize: '12px' }} border={line} />}
              <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1" aria-label={ts('pg.legal', 'Legal')}>
                {legal.map(p => <Link key={p._id} to={`/${handleOf(p)}`} className="no-underline hover:underline" style={{ color: muted }}>{p.title}</Link>)}
                {opts.showBackToTop && <BackToTop color={muted} fontFamily={t.fonts.body} />}
              </nav>
              <p className="m-0">{copyright ? expandCopyright(copyright) : tsNodes('pg.year_store_all_rights_reserved', '© {{year}} {{store}}. All rights reserved.', { store: <bdi>{store.name}</bdi> }, { year: new Date().getFullYear() })}</p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
