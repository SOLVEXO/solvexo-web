// Importing every section module once triggers each one's own
// `registerNovaSection(...)` call at the bottom of the file — same
// self-registration convention as `theme-01-atelier/sections/index.ts`.
//
// DISCLOSED SCOPE: this theme implements a real subset of the shared
// section-type vocabulary. `FeaturedCategoryGrid`/`Newsletter` were ported
// from Atelier to close two of the four gaps a side-by-side theme audit
// found (Atelier had 13 registered types to Nova's 8) — `Video` and
// `DropCountdown` are still Atelier-only, tracked as the next parity pass
// rather than silently left unequal. An unregistered type is skipped
// silently by `NovaSectionRenderer` (the platform's existing, established
// convention — see that file's doc comment), not a crash — so a merchant
// who adds one of those two Nova hasn't implemented yet simply doesn't see
// it rendered, exactly like a disabled section.
import './HeroSection';
import './RichTextSection';
import './FeaturedProductsSection';
import './ProductCatalogSection';
import './ImageWithTextSection';
import './TestimonialsSection';
import './FaqSection';
import './TrustBadgesSection';
import './FeaturedCategoryGridSection';
import './NewsletterSection';
import './MetaobjectListSection';

export { NovaSectionRenderer, getRegisteredNovaSectionTypes } from './novaSectionRenderer';
