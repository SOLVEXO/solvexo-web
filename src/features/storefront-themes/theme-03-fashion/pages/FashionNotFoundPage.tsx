import { Link } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { FashionSectionRenderer } from '../sections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { useTemplateSections } from '../../core/pageHooks';

export function FashionNotFoundPage() {
  const { store } = useStorefront();
  const extra = useTemplateSections(store.storeId, 'page', 'not-found');
  useStorefrontSeo({ title: ts('notFound.title', 'Page not found'), noindex: true });
  return (
    <>
      <section className="grid place-items-center text-center" style={{ padding: `clamp(72px, 12vw, 160px) ${t.layout.containerPadX}` }}>
        <p className="fx-serif m-0 text-[clamp(72px,14vw,160px)] leading-none" style={{ color: t.colors.inkMuted }}>404</p>
        <h1 className="m-0 mt-4 text-[clamp(26px,3.4vw,40px)] font-semibold tracking-tight">{ts('pg.this_page_has_gone_missing', 'This page has gone missing')}</h1>
        <p className="m-0 mb-8 mt-3 max-w-[460px] text-base" style={{ color: t.colors.inkMuted }}>{ts('pg.the_link_may_be_broken_or_the_page_may', "The link may be broken, or the page may have been moved. Let's get you back to shopping.")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link to="/" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('pg.back_to_home', 'Back to home')}</Link>
          <Link to="/search" className="fx-pill" style={{ border: `1px solid ${t.colors.border}`, color: t.colors.ink, borderRadius: t.buttonRadiusPx }}>{ts('pg.browse_products', 'Browse products')}</Link>
        </div>
      </section>
      {extra.length > 0 && <FashionSectionRenderer sections={extra} />}
    </>
  );
}
