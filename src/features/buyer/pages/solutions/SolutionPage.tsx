import type { ReactElement } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { ArrowRight, Check } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button, Footer } from '@/components/comman/ui';
import { Reveal } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { unsplashUrl } from '@/assets/stockPhotos';
import { getSolution } from '@/features/buyer/data/solutions';
import {
  StorefrontPreview, POSPreview, AICommercePreview, AnalyticsPreview, InventoryPreview, OrdersTimelinePreview,
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
  creators:        () => <AICommercePreview />,
  'small-business': () => <AnalyticsPreview />,
};

export function SolutionPage() {
  const { slug = '' } = useParams();
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const solution = getSolution(slug);
  usePageTitle(solution?.name ?? 'Solutions');

  if (!solution) return <Navigate to="/solutions" replace />;

  return (
    <div className="bg-white min-h-full">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={unsplashUrl(solution.image, 1200)} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-carbon/90 via-carbon/70 to-carbon/40" />
        </div>
        <div className="relative z-[1] px-4 md:px-8 lg:px-12 pt-20 md:pt-28 pb-16 md:pb-20 max-w-[640px]">
          <Reveal delay={0}>
            <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.12em] mb-3">Built for {solution.name}</p>
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
                Start Selling Free <ArrowRight size={14} className="inline align-middle ml-1" />
              </Button>
            </MagneticButton>
          </Reveal>
        </div>
      </div>

      <div className="px-4 md:px-8 lg:px-12 py-14 md:py-16 max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        <Reveal>
          <p className="text-[11px] font-semibold text-brand-orange uppercase tracking-[0.1em] mb-3">What you get</p>
          <div className="flex flex-col gap-3">
            {solution.highlights.map(h => (
              <div key={h} className="flex items-start gap-2.5">
                <Check size={15} className="text-success shrink-0 mt-[2px]" />
                <span className="text-[14px] text-charcoal leading-[1.65]">{h}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-6" onClick={() => navigate('/products')}>
            See every product <ArrowRight size={14} className="inline align-middle ml-1" />
          </Button>
        </Reveal>
        <Reveal delay={0.1}>
          {(SOLUTION_PREVIEW[solution.slug] ?? SOLUTION_PREVIEW.retail)()}
        </Reveal>
      </div>

      <div className="bg-carbon px-4 md:px-8 lg:px-12 py-14 text-center">
        <SectionHeading title={`Start selling in ${solution.name.toLowerCase()} today.`} tone="dark" align="center" size="lg" className="mb-8" />
        <Reveal>
          <MagneticButton>
            <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
              Start Selling Free <ArrowRight size={14} className="inline align-middle ml-1" />
            </Button>
          </MagneticButton>
        </Reveal>
      </div>

      <Footer />
    </div>
  );
}
