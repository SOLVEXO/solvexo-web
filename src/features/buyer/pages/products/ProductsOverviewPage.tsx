import { useNavigate } from 'react-router-dom';
import { ArrowRight, Store } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button, Footer } from '@/components/comman/ui';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { mockupForProductSlug, PRODUCT_ICONS } from '@/components/comman/mockups/ProductMockups';
import { PLATFORM_PRODUCTS } from '@/features/buyer/data/platformProducts';

export function ProductsOverviewPage() {
  usePageTitle('Products');
  const navigate = useNavigate();
  const sellEntry = useSellEntry();

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 md:px-8 lg:px-12 pt-14 md:pt-18 pb-10 max-w-[760px] mx-auto">
        <SectionHeading
          kicker="One platform"
          title="Every product you need to run a business."
          subtitle="Store, POS, AI tools and analytics — under one login, sharing the same real data."
          align="center"
          size="lg"
        />
      </div>

      {/* First product gets a wider, taller spotlight tile (col-span-2, a
         bigger mockup) instead of every card sharing one identical size —
         a real hierarchy choice (it's the platform's anchor product), not
         a uniformly repeated tile. */}
      <RevealStagger className="px-4 md:px-8 lg:px-12 pb-16 max-w-[1200px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" step={0.08} y={20}>
        {PLATFORM_PRODUCTS.map((p, i) => {
          const Icon = PRODUCT_ICONS[p.slug] ?? Store;
          const spotlight = i === 0;
          return (
            <PremiumCard
              key={p.slug}
              onClick={() => navigate(`/products/${p.slug}`)}
              className={spotlight ? 'overflow-hidden p-0 sm:col-span-2 lg:col-span-2' : 'overflow-hidden p-0'}
            >
              {/* Real product UI, not a decorative icon panel — cropped to a
                 peek so the card teases the actual interface. */}
              <div className={spotlight
                ? 'h-[220px] overflow-hidden bg-cream p-5 pointer-events-none flex items-start justify-center'
                : 'h-[168px] overflow-hidden bg-cream p-4 pointer-events-none flex items-start justify-center'}
              >
                <div className="w-full" style={{ transform: spotlight ? 'scale(1)' : 'scale(0.86)', transformOrigin: 'top center' }}>
                  {mockupForProductSlug(p.slug)}
                </div>
              </div>
              <div className={spotlight ? 'p-8' : 'p-7'}>
                <span className="w-11 h-11 rounded-xl bg-brand-pale-orange flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-orange" />
                </span>
                <p className={spotlight ? 'text-[20px] font-bold text-carbon mb-1.5' : 'text-[17px] font-bold text-carbon mb-1.5'}>{p.name}</p>
                <p className="text-[13px] text-slate leading-[1.65] mb-4 max-w-[420px]">{p.heroSubtext}</p>
                <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-brand-orange">
                  Explore {p.name} <ArrowRight size={13} />
                </span>
              </div>
            </PremiumCard>
          );
        })}
      </RevealStagger>

      <div className="relative bg-carbon px-4 md:px-8 lg:px-12 py-14 text-center overflow-hidden">
        <div className="auth-float absolute rounded-full w-[360px] h-[360px] bg-brand-orange opacity-[0.08] -top-[100px] right-[8%]" aria-hidden />
        <div className="relative z-[1]">
          <SectionHeading title="Start with the free plan, add what you need." tone="dark" align="center" size="lg" className="mb-8" />
          <Reveal>
            <MagneticButton>
              <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
                Start Selling Free <ArrowRight size={14} className="inline align-middle ml-1" />
              </Button>
            </MagneticButton>
          </Reveal>
        </div>
      </div>

      <Footer />
    </div>
  );
}
