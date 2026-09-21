import type { Section, Block } from '@/api/services/storefrontTypes';
import { NovaContentBlocks } from '../components/NovaContentBlocks';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

registerNovaSection('rich_text', (section: Section, blocks: Block[], colors: NovaSectionColors, dynamicSourceValues: Record<string, string>) => {
  const alignCls = { left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' }[section.settings.alignment as string] ?? 'items-start text-left';
  // Dynamic Sources (Phase 9) — see AtelierRichTextSection's identical comment.
  const headingNs = section.settings.dynamicSourceNamespace || 'custom';
  const headingKey = section.settings.dynamicSourceKey;
  const boundHeading = headingKey ? dynamicSourceValues?.[`${headingNs}:${headingKey}`] : undefined;
  const heading = boundHeading !== undefined ? boundHeading : section.settings.heading;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className={`mx-auto flex flex-col gap-5 ${alignCls}`} style={{ maxWidth: '720px' }}>
        {heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: colors.ink }}>
            {heading}
          </h2>
        )}
        <NovaContentBlocks blocks={blocks.map(b => ({ type: b.type, settings: b.settings }))} dynamicSourceValues={dynamicSourceValues} />
      </div>
    </div>
  );
});
