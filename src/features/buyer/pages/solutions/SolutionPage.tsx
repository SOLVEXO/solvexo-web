import type { ReactElement } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Check, Store } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button, Footer } from '@/components/comman/ui';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { stockPhotoAlt, unsplashUrl } from '@/assets/stockPhotos';
import { getSolution } from '@/features/buyer/data/solutions';
import { getPlatformProduct } from '@/features/buyer/data/platformProducts';
import { localizeProduct, localizeSolution } from '@/features/buyer/data/localizedData';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { SOLUTION_PAGE_TEXT } from './SolutionPage.text';
import {
  StorefrontPreview, POSPreview, SellerDashboardPreview, AnalyticsPreview, InventoryPreview, OrdersTimelinePreview, PRODUCT_ICONS,
} from '@/components/comman/mockups/ProductMockups';

const SERIF = "'Lora', Georgia, serif";

// Each solution gets a different real product preview matched to what its
// own highlights actually emphasize — not the same dashboard mockup shown
// six times across six industry pages.
const SOLUTION_PREVIEW: Record<string, () => ReactElement> = {
  retail:          () => <OrdersTimelinePreview />,
  fashion:         () => <InventoryPreview />,
  restaurants:     () => <POSPreview />,
  beauty:          () => <StorefrontPreview />,
  creators:        () => <SellerDashboardPreview />,
  'small-business': () => <AnalyticsPreview />,
};

// Which real platform products this industry actually leans on most —
// genuine cross-links into /products/:slug, not invented per-industry copy.
const RELATED_PRODUCTS: Record<string, string[]> = {
  retail:           ['store-builder', 'pos', 'inventory'],
  fashion:          ['store-builder', 'inventory', 'analytics'],
  restaurants:      ['pos', 'inventory', 'orders-customers'],
  beauty:           ['store-builder', 'loyalty', 'analytics'],
  creators:         ['store-builder', 'analytics', 'domains'],
  'small-business': ['store-builder', 'pos', 'analytics'],
};

export function SolutionPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const t = useSiteText(SOLUTION_PAGE_TEXT);
  const { pageLang } = useSiteLang();
  const found = getSolution(slug);
  const solution = found && localizeSolution(found, pageLang);
  usePageTitle(solution?.name ?? t.fallbackTitle);

  if (!solution) return <Navigate to="/solutions" replace />;

  return (
    <div className="bg-white min-h-full">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={unsplashUrl(solution.image, 1200)} alt={t.imageAlt(solution.name, stockPhotoAlt(solution.image))} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r rtl:bg-gradient-to-l from-carbon/90 via-carbon/70 to-carbon/40" />
        </div>
        <div className="relative z-[1] px-4 md:px-8 lg:px-12 pt-20 md:pt-28 pb-16 md:pb-20 max-w-[640px]">
          <Reveal delay={0}>
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.12em] mb-3">{t.builtFor(solution.name)}</p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="text-[26px] sm:text-[36px] lg:text-[42px] font-bold text-white leading-[1.15] mb-4" style={{ fontFamily: SERIF }}>
              {solution.headline}
            </h1>
          </Reveal>
          <Reveal delay={0.16}>
            <p className="text-[14px] sm:text-[15.5px] text-[#d8d6d0] leading-[1.7] mb-7">
              {solution.subtext}
            </p>
          </Reveal>
          <Reveal delay={0.24}>
            <MagneticButton>
              <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
                {t.startSelling} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
              </Button>
            </MagneticButton>
          </Reveal>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-12 py-14 md:py-16 max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <Reveal>
          <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-3">{t.whatYouGet}</p>
          <div className="flex flex-col gap-3">
            {solution.highlights.map(h => (
              <div key={h} className="flex items-start gap-2.5">
                <Check size={15} className="text-success shrink-0 mt-[2px]" />
                <span className="text-[14px] text-charcoal leading-[1.65]">{h}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/products')}>
            {t.seeEveryProduct} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
          </Button>
        </Reveal>
        <Reveal delay={0.1}>
          <div dir="ltr">{(SOLUTION_PREVIEW[solution.slug] ?? SOLUTION_PREVIEW.retail)()}</div>
        </Reveal>
      </div>

      {/* ── The real products this industry leans on most — genuine
         cross-links, not repeated marketing copy. ── */}
      <div className="bg-cream px-4 md:px-8 lg:px-12 py-14 md:py-16">
        <div className="max-w-[1100px] mx-auto">
          <SectionHeading kicker={t.builtOn} title={t.poweredTitle(solution.name)} align="center" className="mb-10" />
          <RevealStagger className="grid grid-cols-1 sm:grid-cols-3 gap-5" step={0.08} y={16}>
            {(RELATED_PRODUCTS[solution.slug] ?? []).map(slug => {
              const enProduct = getPlatformProduct(slug);
              if (!enProduct) return null;
              const product = localizeProduct(enProduct, pageLang);
              const Icon = PRODUCT_ICONS[slug] ?? Store;
              return (
                <PremiumCard key={slug} to={`/products/${slug}`} className="p-6">
                  <span className="w-10 h-10 rounded-lg bg-brand-pale-orange flex items-center justify-center mb-3.5">
                    <Icon size={18} className="text-brand-orange" />
                  </span>
                  <p className="text-[14.5px] font-bold text-carbon mb-1">{product.name}</p>
                  <p className="text-[12.5px] text-slate leading-[1.6] mb-3">{product.tagline}</p>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-orange">
                    {t.learnMore} <ArrowRight size={12} className="rtl:-scale-x-100" />
                  </span>
                </PremiumCard>
              );
            })}
          </RevealStagger>
        </div>
      </div>

      <div className="bg-carbon px-4 md:px-8 lg:px-12 py-14 text-center">
        <SectionHeading title={t.ctaTitle(solution.name)} tone="dark" align="center" size="lg" className="mb-8" />
        <Reveal>
          <MagneticButton>
            <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
              {t.startSelling} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
            </Button>
          </MagneticButton>
        </Reveal>
      </div>

      <Footer />
    </div>
  );
}
