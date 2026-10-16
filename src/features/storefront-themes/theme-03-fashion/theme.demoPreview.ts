import { registerThemeDemoPreview } from '../themeDemoPreview';
import { FASHION_DEMO_STORE, FASHION_DEMO_SECTIONS } from './demo/fashionDemoData';
import { FashionDemoChrome, FashionDemoRenderer } from './demo/FashionDemoStore';
import { fashionTheme } from './theme.config';
import './fashion.css';

registerThemeDemoPreview({
  id: 'theme-03-fashion',
  name: 'Maison',
  demoStore: FASHION_DEMO_STORE,
  demoSections: FASHION_DEMO_SECTIONS,
  SectionRenderer: FashionDemoRenderer,
  Chrome: FashionDemoChrome,
  theme: fashionTheme,
});