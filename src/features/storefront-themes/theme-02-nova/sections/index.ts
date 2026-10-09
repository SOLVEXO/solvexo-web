// Importing every section module once triggers each one's own
// `registerNovaSection(...)` call at the bottom of the file — same
// self-registration convention as `theme-01-atelier/sections/index.ts`.
import './HeroSection';
import './RichTextSection';
import './FeaturedProductsSection';
import './ProductCatalogSection';
import './ImageWithTextSection';
import './TestimonialsSection';
import './FaqSection';
import './VideoSection';
import './TrustBadgesSection';
import './FeaturedCategoryGridSection';
import './NewsletterSection';
import './BlogPostsSection';
import './DropCountdownSection';
import './MetaobjectListSection';
import './LibrarySections';
import './CoreSections';

export { NovaSectionRenderer, getRegisteredNovaSectionTypes } from './novaSectionRenderer';
