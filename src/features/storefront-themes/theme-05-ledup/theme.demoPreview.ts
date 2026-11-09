import { registerThemeDemoPreview } from '../themeDemoPreview';
import { LEDUP_DEMO_STORE, LEDUP_DEMO_SECTIONS } from './demo/ledupDemoData';
import { LedupDemoChrome, LedupDemoRenderer } from './demo/LedupDemoStore';
import { ledupTheme } from './theme.config';
import './ledup.css';

registerThemeDemoPreview({
  id: 'theme-05-ledup',
  name: 'Ledup',
  demoStore: LEDUP_DEMO_STORE,
  demoSections: LEDUP_DEMO_SECTIONS,
  SectionRenderer: LedupDemoRenderer,
  Chrome: LedupDemoChrome,
  theme: ledupTheme,
});
