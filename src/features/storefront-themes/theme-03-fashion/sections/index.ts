// Importing each section module registers its renderer (see `fashionSectionRenderer.tsx`).
import './HeroSection';
import './ProductSections';
import './ContentSections';
import './MoreSections';
import './CoreSections';
import './ExtraSections';

export { FashionSectionRenderer } from './fashionSectionRenderer';
export { getRegisteredFashionSectionTypes } from './sectionRegistry';
