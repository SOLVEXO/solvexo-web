// Importing every section module once triggers each one's own
// `registerNovaSection(...)` call at the bottom of the file — same
// self-registration convention as `theme-01-atelier/sections/index.ts`.
//
// DISCLOSED SCOPE: this theme implements a real subset of the shared
// section-type vocabulary — the types actually exercised by the 7 routes
// Nova has built so far (see `theme.config.ts`'s README). An unregistered
// type is skipped silently by `NovaSectionRenderer` (the platform's
// existing, established convention — see that file's doc comment), not a
// crash — so a merchant who adds a section type Nova hasn't implemented yet
// simply doesn't see it rendered, exactly like a disabled section.
import './HeroSection';
import './RichTextSection';
import './FeaturedProductsSection';
import './ProductCatalogSection';
import './ImageWithTextSection';
import './TestimonialsSection';
import './FaqSection';
import './TrustBadgesSection';

export { NovaSectionRenderer } from './novaSectionRenderer';
