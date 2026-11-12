import { Download, FileText, Languages } from 'lucide-react';
import { Footer } from '@/components/comman/ui/Footer';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { MANUALS, formatFileSize, localizeManual } from '@/features/buyer/data/manuals';
import { SALES_EMAIL } from '@/utils/contact';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { useSiteText } from '@/i18n/site/useSiteText';
import { MANUALS_TEXT } from './ManualsPage.text';

/** www.solvexo.store/manuals — downloadable user manuals (PDF). Title and description come from src/seo/publicPages. */
export function ManualsPage() {
  const t = useSiteText(MANUALS_TEXT);
  const { pageLang } = useSiteLang();
  return (
    <div className="bg-[#faf9f5] min-h-full">
      <section className="px-4 md:px-8 lg:px-12 pt-14 md:pt-20 pb-8 max-w-[1100px] mx-auto">
        <SectionHeading
          as="h1"
          kicker={t.kicker}
          title={t.title}
          subtitle={t.subtitle}
          size="lg"
        />
        {t.englishNote && (
          <p className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#fdf0ea] px-3 py-2 text-[13.5px] text-[#7a3f2a]">
            <Languages size={15} aria-hidden /> {t.englishNote}
          </p>
        )}
      </section>

      <section className="px-4 md:px-8 lg:px-12 pb-16 max-w-[1100px] mx-auto grid md:grid-cols-2 gap-6 items-start">
        {MANUALS.map(manual => localizeManual(manual, pageLang)).map(m => (
          <article key={m.key} className="bg-white border border-[#e5e5dd] rounded-2xl p-6 md:p-7 flex flex-col gap-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a66c53]">{m.kicker}</p>
              <h2 className="mt-2 text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-[#1c1d1b]">{m.title}</h2>
              <p className="mt-2 text-[14px] leading-[1.7] text-[#777974]">{m.summary}</p>
              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-[#8b8985]">
                <span>{t.forAudience(m.audience)}</span>
                <span className="inline-flex items-center gap-1"><Languages size={13} aria-hidden /> {t.languages}</span>
                <span>{t.parts(m.chapters.length)}</span>
              </p>
            </div>

            <a href={m.complete.file} download className="inline-flex items-center justify-between gap-3 rounded-xl bg-brand-orange text-white px-5 py-3.5 font-semibold hover:opacity-90">
              <span className="inline-flex items-center gap-2"><Download size={17} aria-hidden /> {t.downloadComplete}</span>
              <span dir="ltr" className="text-[12px] font-medium opacity-85">PDF · {formatFileSize(m.complete.sizeBytes)}</span>
            </a>

            <div>
              <h3 className="text-[13px] font-semibold text-[#1c1d1b]">{t.orOnePart}</h3>
              <ul className="mt-2 divide-y divide-[#eeece4]">
                {m.chapters.map(c => (
                  <li key={c.file}>
                    <a href={c.file} download className="flex items-center gap-3 py-2.5 text-[14px] text-[#3d3c39] hover:text-brand-orange">
                      <FileText size={16} className="shrink-0 text-[#a66c53]" aria-hidden />
                      <span className="flex-1 min-w-0">{c.label}</span>
                      <span dir="ltr" className="text-[12px] text-[#8b8985] tabular-nums">{formatFileSize(c.sizeBytes)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>

      <section className="px-4 md:px-8 lg:px-12 pb-20 max-w-[1100px] mx-auto">
        <p className="text-[14px] text-[#777974]">
          {t.helpPre}<a href={`mailto:${SALES_EMAIL}`} className="font-semibold text-brand-orange">{SALES_EMAIL}</a>{t.helpPost}
        </p>
      </section>
      <Footer />
    </div>
  );
}
