import { registerThemeDemoPreview } from '../themeDemoPreview';
import { NovaSectionRenderer } from './sections';
import { NOVA_DEMO_STORE, NOVA_DEMO_SECTIONS } from './demo/novaDemoData';
import { novaTheme } from './theme.config';

registerThemeDemoPreview({
  id: 'theme-02-nova',
  name: 'Nova',
  demoStore: NOVA_DEMO_STORE,
  demoSections: NOVA_DEMO_SECTIONS,
  SectionRenderer: NovaSectionRenderer,
  theme: novaTheme,
});
