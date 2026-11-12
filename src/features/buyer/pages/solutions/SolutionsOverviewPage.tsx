import { ArrowRight } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { Button, Footer } from '@/components/comman/ui';
import { Reveal, RevealStagger } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { Check } from 'lucide-react';
import { stockPhotoAlt, unsplashUrl } from '@/assets/stockPhotos';
import { SOLUTIONS } from '@/features/buyer/data/solutions';
import { localizeSolution } from '@/features/buyer/data/localizedData';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { SOLUTIONS_OVERVIEW_TEXT } from './SolutionsOverviewPage.text';

export function SolutionsOverviewPage() {
  const t = useSiteText(SOLUTIONS_OVERVIEW_TEXT);
  const { pageLang } = useSiteLang();
  usePageTitle(t.pageTitle);
  const sellEntry = useSellEntry();

  return (
    <div className="bg-white min-h-full">
      <div className="px-4 md:px-8 lg:px-12 pt-14 md:pt-18 pb-10 max-w-[760px] mx-auto">
        <SectionHeading
          kicker={t.kicker}
          as="h1"
          title={t.title}
          subtitle={t.subtitle}
          align="center"
          size="lg"
        />
      </div>

      {/* First solution gets a wide spotlight tile (landscape image,
         col-span-2, full highlight list) instead of every tile sharing the
         identical square-photo-plus-2-bullets shape. */}
      <RevealStagger className="px-4 md:px-8 lg:px-12 pb-16 max-w-[1100px] mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" step={0.06} y={18}>
        {SOLUTIONS.map(en => localizeSolution(en, pageLang)).map((s, i) => {
          const spotlight = i === 0;
          return (
            <PremiumCard
              key={s.slug}
              to={`/solutions/${s.slug}`}
              className={spotlight ? 'group overflow-hidden p-0 sm:col-span-2 lg:col-span-2' : 'group overflow-hidden p-0'}
            >
              <div className={spotlight ? 'grid sm:grid-cols-2 items-stretch' : ''}>
                <div className={spotlight ? 'aspect-[4/3] sm:aspect-auto overflow-hidden' : 'aspect-[4/3] overflow-hidden'}>
                  <img src={unsplashUrl(s.image, spotlight ? 700 : 400)} alt={t.imageAlt(s.name, stockPhotoAlt(s.image))} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                </div>
                <div className={spotlight ? 'p-6 sm:p-7 flex flex-col justify-center' : 'p-5'}>
                  <p className={spotlight ? 'text-[19px] font-bold text-carbon mb-1.5' : 'text-[14.5px] font-bold text-carbon mb-1'}>{s.name}</p>
                  <p className={spotlight ? 'text-[13.5px] text-slate leading-[1.6] mb-4' : 'text-[12.5px] text-slate leading-[1.6] mb-3'}>{s.headline}</p>
                  <div className="flex flex-col gap-1.5 mb-4">
                    {s.highlights.slice(0, spotlight ? 4 : 2).map(h => (
                      <div key={h} className="flex items-start gap-1.5">
                        <Check size={12} className="text-success shrink-0 mt-[2px]" />
                        <span className={spotlight ? 'text-[12.5px] text-charcoal leading-snug' : 'text-[11.5px] text-charcoal leading-snug'}>{h}</span>
                      </div>
                    ))}
                  </div>
                  <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-orange">
                    {t.explore} <ArrowRight size={12} className="rtl:-scale-x-100" />
                  </span>
                </div>
              </div>
            </PremiumCard>
          );
        })}
      </RevealStagger>

      <div className="relative bg-carbon px-4 md:px-8 lg:px-12 py-14 text-center overflow-hidden">
        <div className="auth-float-slow absolute rounded-full w-[320px] h-[320px] bg-brand-deep-orange opacity-[0.08] -bottom-[90px] left-[10%]" aria-hidden />
        <div className="relative z-[1]">
          <SectionHeading title={t.ctaTitle} tone="dark" align="center" size="lg" className="mb-8" />
          <Reveal>
            <MagneticButton>
              <Button size="lg" onClick={sellEntry.go} loading={sellEntry.loading}>
                {t.startSelling} <ArrowRight size={14} className="inline align-middle ms-1 rtl:-scale-x-100" />
              </Button>
            </MagneticButton>
          </Reveal>
        </div>
      </div>

      <Footer />
    </div>
  );
}
