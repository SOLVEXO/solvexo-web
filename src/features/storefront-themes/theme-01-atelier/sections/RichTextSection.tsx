import type { Section, Block } from '@/api/services/storefrontTypes';
import { AtelierContentBlocks } from '../components/AtelierContentBlocks';
import { atelierTheme as t } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

registerAtelierSection('rich_text', (section: Section, blocks: Block[]) => {
  const alignCls = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' }[section.settings.alignment as string] ?? 'items-start text-left';
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className={`mx-auto flex flex-col gap-5 ${alignCls}`} style={{ maxWidth: '720px' }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, color: t.colors.ink }}>
            {section.settings.heading}
          </h2>
        )}
        <AtelierContentBlocks blocks={blocks.map(b => ({ type: b.type, settings: b.settings }))} />
      </div>
    </div>
  );
});
