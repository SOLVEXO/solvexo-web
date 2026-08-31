import { registerThemeDemoPreview } from '../themeDemoPreview';
import { AtelierSectionRenderer } from './sections';
import { ATELIER_DEMO_STORE, ATELIER_DEMO_SECTIONS } from './demo/atelierDemoData';
import { atelierTheme } from './theme.config';

registerThemeDemoPreview({
  id: 'theme-01-atelier',
  name: 'Atelier',
  demoStore: ATELIER_DEMO_STORE,
  demoSections: ATELIER_DEMO_SECTIONS,
  SectionRenderer: AtelierSectionRenderer,
  theme: atelierTheme,
});
