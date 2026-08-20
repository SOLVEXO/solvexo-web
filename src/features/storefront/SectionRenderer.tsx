import type { Section } from '@/api/services/storefrontTypes';
import { HeroSection } from './sections/HeroSection';
import { RichTextSection } from './sections/RichTextSection';
import { FeaturedProductsSection, type FeaturedProductsSectionSettings } from './sections/FeaturedProductsSection';
import { ProductCatalogSection, type ProductCatalogSectionSettings } from './sections/ProductCatalogSection';
import { ImageWithTextSection } from './sections/ImageWithTextSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { FaqSection } from './sections/FaqSection';
import { VideoSection, type VideoSectionSettings } from './sections/VideoSection';
import { FeaturedCategoryGridSection, type FeaturedCategoryGridSectionSettings } from './sections/FeaturedCategoryGridSection';
import { TrustBadgesSection } from './sections/TrustBadgesSection';
import { NewsletterSection, type NewsletterSectionSettings } from './sections/NewsletterSection';

/**
 * type → component map — the single source of truth for how a section
 * renders. Used identically by the real public storefront AND the builder's
 * live preview pane (Phase 3), which is what makes the preview genuinely
 * WYSIWYG instead of the old disconnected mock (`StoreBuilder`'s
 * `StorePreview`, which used hardcoded sample data and rendered features —
 * custom hero text, a custom footer — the real page never displayed).
 */
export function SectionRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map((section, i) => {
        // A missing `enabled` behaves like `true` (pre-migration sections
        // never had the field) — only an explicit `false` hides it. This is
        // what makes "hide" (toggle enabled, part of the normal draft-save
        // flow) genuinely different from "delete" (removed from the array,
        // already real/immediate elsewhere in the builder).
        if (section.enabled === false) return null;
        const key = section._id ?? i;
        const blocks = section.blocks.filter(b => b.enabled !== false);
        switch (section.type) {
          case 'hero':
            return <HeroSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
          case 'rich_text':
            return <RichTextSection key={key} settings={section.settings} blocks={blocks.map(b => ({ type: b.type, settings: b.settings })) as any} />;
          case 'featured_products':
            return <FeaturedProductsSection key={key} settings={section.settings as FeaturedProductsSectionSettings} />;
          case 'product_catalog':
            return <ProductCatalogSection key={key} settings={section.settings as ProductCatalogSectionSettings} />;
          case 'image_with_text':
            return <ImageWithTextSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
          case 'testimonials':
            return <TestimonialsSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
          case 'faq':
            return <FaqSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
          case 'video':
            return <VideoSection key={key} settings={section.settings as VideoSectionSettings} />;
          case 'featured_category_grid':
            return <FeaturedCategoryGridSection key={key} settings={section.settings as FeaturedCategoryGridSectionSettings} />;
          case 'trust_badges':
            return <TrustBadgesSection key={key} settings={section.settings} blocks={blocks.map(b => b.settings) as any} />;
          case 'newsletter':
            return <NewsletterSection key={key} settings={section.settings as NewsletterSectionSettings} />;
          default:
            return null;
        }
      })}
    </>
  );
}
