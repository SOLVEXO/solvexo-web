import { cloneElement, isValidElement } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { getSectionRender } from './sectionRenderRegistry';

// Importing every section module once is what makes their self-registration
// (see the bottom of each file in `sections/`) actually run — same
// requirement any registration-based plugin architecture has. Adding a new
// section type means creating its file (which registers itself) and adding
// ONE import line here — never touching branching logic, unlike the old
// hardcoded `switch (section.type)` this file used to be.
import './sections/HeroSection';
import './sections/RichTextSection';
import './sections/FeaturedProductsSection';
import './sections/ProductCatalogSection';
import './sections/ImageWithTextSection';
import './sections/TestimonialsSection';
import './sections/FaqSection';
import './sections/VideoSection';
import './sections/FeaturedCategoryGridSection';
import './sections/TrustBadgesSection';
import './sections/NewsletterSection';
import './sections/CollectionProductGridSection';

/**
 * type → renderer dispatch, driven entirely by `sectionRenderRegistry`'s
 * open registry (see that file's comment) — the single source of truth for
 * how a section renders. Used identically by the real public storefront AND
 * the builder's live preview pane, which is what makes the preview
 * genuinely WYSIWYG instead of a disconnected mock.
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
        const render = getSectionRender(section.type);
        if (!render) return null;
        const node = render(section, blocks);
        return isValidElement(node) ? cloneElement(node, { key }) : null;
      })}
    </>
  );
}
