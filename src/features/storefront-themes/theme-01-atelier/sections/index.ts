// Importing every section module once triggers each one's own
// `registerAtelierSection(...)` call at the bottom of the file — this is the
// one place all of Atelier's sections need to be required so the registry in
// `atelierSectionRenderer.tsx` is actually populated. Adding a new section
// type means creating its file (which registers itself) and adding one
// import line here — never editing a big switch statement.
import './HeroSection';
import './RichTextSection';
import './FeaturedProductsSection';
import './ProductCatalogSection';
import './ImageWithTextSection';
import './TestimonialsSection';
import './FaqSection';
import './VideoSection';
import './FeaturedCategoryGridSection';
import './TrustBadgesSection';
import './NewsletterSection';
import './DropCountdownSection';
import './MetaobjectListSection';

export { AtelierSectionRenderer, getRegisteredAtelierSectionTypes } from './atelierSectionRenderer';
