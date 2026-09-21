import type { Section, Block } from '@/api/services/storefrontTypes';
import { AtelierContentBlocks } from '../components/AtelierContentBlocks';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

registerAtelierSection('rich_text', (section: Section, blocks: Block[], colors: AtelierSectionColors, dynamicSourceValues: Record<string, string>) => {
  const alignCls = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' }[section.settings.alignment as string] ?? 'items-start text-left';
  // Dynamic Sources (Phase 9) — this SECTION's own `heading` (not a block)
  // can bind to a real metafield too; same resolution as any content block.
  const headingNs = section.settings.dynamicSourceNamespace || 'custom';
  const headingKey = section.settings.dynamicSourceKey;
  const boundHeading = headingKey ? dynamicSourceValues?.[`${headingNs}:${headingKey}`] : undefined;
  const heading = boundHeading !== undefined ? boundHeading : section.settings.heading;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className={`mx-auto flex flex-col gap-5 ${alignCls}`} style={{ maxWidth: '720px' }}>
        {heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(22px, 3vw, 30px)', fontWeight: 600, color: colors.ink }}>
            {heading}
          </h2>
        )}
        <AtelierContentBlocks blocks={blocks.map(b => ({ type: b.type, settings: b.settings }))} dynamicSourceValues={dynamicSourceValues} />
      </div>
    </div>
  );
});
