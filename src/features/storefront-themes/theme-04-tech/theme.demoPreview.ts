import { registerThemeDemoPreview } from '../themeDemoPreview';
import { TECH_DEMO_STORE, TECH_DEMO_SECTIONS } from './demo/techDemoData';
import { TechDemoChrome, TechDemoRenderer } from './demo/TechDemoStore';
import { techTheme } from './theme.config';
import './tech.css';

registerThemeDemoPreview({
  id: 'theme-04-tech',
  name: 'Tech Store',
  demoStore: TECH_DEMO_STORE,
  demoSections: TECH_DEMO_SECTIONS,
  SectionRenderer: TechDemoRenderer,
  Chrome: TechDemoChrome,
  theme: techTheme,
});
