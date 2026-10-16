/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { renderRichText } from '@/utils/richText';
import { PreviewBlock } from '../../previewInspector';
import { copyText, showEyebrow } from '../../sectionCopy';
import { useStoreFaqBlocks } from '../../useStoreFaqBlocks';
import { fashionTheme as t } from '../theme.config';
import { registerFashionSection } from './sectionRegistry';
import { SectionShell } from './SectionShell';
import { MulticolumnSection } from './shared/MulticolumnSection';
import { LogoListSection } from './shared/LogoListSection';
import { MarqueeSection } from './shared/MarqueeSection';
import { CustomHtmlSection } from './shared/CustomHtmlSection';
import { ImageBannerSection } from './shared/ImageBannerSection';
import { CollectionListSection } from './shared/CollectionListSection';
import { GalleryGridSection } from './shared/GalleryGridSection';
import { StoreLocationsSection } from './shared/StoreLocationsSection';
import { ContactFormSection } from './shared/ContactFormSection';
import { RelatedProductsSection } from './shared/RelatedProductsSection';

registerFashionSection('multicolumn', (section, blocks, colors) => <MulticolumnSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('logo_list', (section, blocks, colors) => <LogoListSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('marquee', (section, blocks, colors) => <MarqueeSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('custom_html', (section, blocks, colors) => <CustomHtmlSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('image_banner', (section, blocks, colors) => <ImageBannerSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('collection_list', (section, blocks, colors) => <CollectionListSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('gallery_grid', (section, blocks, colors) => <GalleryGridSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('store_locations', (section, blocks, colors) => <StoreLocationsSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('contact_form', (section, blocks, colors) => <ContactFormSection section={section} blocks={blocks} colors={colors} />);
registerFashionSection('related_products', (section, blocks, colors) => <RelatedProductsSection section={section} blocks={blocks} colors={colors} />);
// ── Divider ───────────────────────────────────────────────────────────────────
registerFashionSection('divider', (section, _b, colors) => {
  const h = Math.min(160, Math.max(0, Number(section.settings.height) || 32));
  return (
    <div style={{ padding: `0 ${t.layout.containerPadX}`, height: h, display: 'flex', alignItems: 'center' }}>
      {section.settings.style !== 'space' && <hr className="mx-auto w-full border-0 border-t" style={{ maxWidth: t.layout.maxWidth, borderColor: colors.border }} />}
    </div>
  );
});

// ── Video ─────────────────────────────────────────────────────────────────────
function embedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return vm ? `https://player.vimeo.com/video/${vm[1]}` : null;
}
registerFashionSection('video', (section, _b, colors) => {
  const s = section.settings;
  const ratio = s.aspectRatio === '4:3' ? '4 / 3' : s.aspectRatio === '1:1' ? '1 / 1' : '16 / 9';
  const embed = s.videoUrl ? embedUrl(String(s.videoUrl)) : null;
  const src = s.videoFileUrl || (!embed && /^https:\/\//i.test(String(s.videoUrl ?? '')) ? s.videoUrl : null);
  if (!embed && !src) return null;
  return (
    <SectionShell colors={colors} heading={s.heading}>
      <div className="mx-auto max-w-[960px] overflow-hidden" style={{ aspectRatio: ratio, borderRadius: 24, background: colors.bgAlt }}>
        {embed ? <iframe src={embed} title={s.heading || 'Video'} className="size-full border-0" allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen loading="lazy" />
          : <video src={src} controls playsInline preload="metadata" className="size-full object-cover"><track kind="captions" /></video>}
      </div>
    </SectionShell>
  );
});

// ── FAQ ───────────────────────────────────────────────────────────────────────
registerFashionSection('faq', (section, blocks, colors) => <Faq settings={section.settings} blocks={blocks} colors={colors} />);

function Faq({ settings: s, blocks, colors }: { settings: Record<string, any>; blocks: { _id?: string; type: string; settings: Record<string, any> }[]; colors: typeof t.colors }) {
  const fromStore = useStoreFaqBlocks(s.source === 'store');
  const items = (s.source === 'store' ? fromStore : blocks).filter(b => b.type === 'faq_item');
  const [open, setOpen] = useState<string | null>(null);
  if (items.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={s.heading} eyebrow={showEyebrow(s) ? copyText(s, 'eyebrow', 'Good to know') : undefined} align="center">
      <ul className="mx-auto m-0 flex max-w-[780px] list-none flex-col gap-3 p-0">
        {items.map((b, i) => {
          const id = b._id ?? String(i);
          const isOpen = open === id;
          return (
            <li key={id}><PreviewBlock blockId={id}>
              <div style={{ border: `1px solid ${colors.border}`, borderRadius: 16, background: colors.bg }}>
                <button type="button" aria-expanded={isOpen} aria-controls={`fx-faq-${id}`} onClick={() => setOpen(isOpen ? null : id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 border-0 bg-transparent px-6 py-5 text-left text-base font-medium" style={{ color: colors.ink, fontFamily: t.fonts.body }}>
                  {b.settings.question}<ChevronDown size={18} style={{ transform: isOpen ? 'rotate(180deg)' : undefined, transition: 'transform .2s', flexShrink: 0 }} />
                </button>
                {isOpen && <div id={`fx-faq-${id}`} role="region" className="px-6 pb-5 text-[15px] leading-[1.75]" style={{ color: colors.inkMuted }}>{renderRichText(b.settings.answer)}</div>}
              </div>
            </PreviewBlock></li>
          );
        })}
      </ul>
    </SectionShell>
  );
}
