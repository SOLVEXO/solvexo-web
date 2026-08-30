import type { Section, Block } from '@/api/services/storefrontTypes';
import { NovaContentBlocks } from '../components/NovaContentBlocks';
import { novaTheme as t } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

registerNovaSection('rich_text', (section: Section, blocks: Block[]) => {
  const alignCls = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' }[section.settings.alignment as string] ?? 'items-start text-left';
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className={`mx-auto flex flex-col gap-5 ${alignCls}`} style={{ maxWidth: '720px' }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: t.colors.ink }}>
            {section.settings.heading}
          </h2>
        )}
        <NovaContentBlocks blocks={blocks.map(b => ({ type: b.type, settings: b.settings }))} />
      </div>
    </div>
  );
});
