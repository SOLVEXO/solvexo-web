import { renderRichText } from '@/utils/richText';
import { PreviewBlock } from '../../../previewInspector';
import { featureIcon } from '../../../featureIcons';
import { fashionTheme as t } from '../../theme.config';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

/** "Feature list": icon + title + short text per item (why shop here, benefits, services). */
export function FeatureListSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : Math.min(Math.max(blocks.length, 2), 3);
  const center = section.settings.textAlign === 'center';
  return (
    <SectionShell colors={colors} heading={section.settings.heading} align={center ? 'center' : 'left'}>
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
        {blocks.map((b, i) => {
          const Icon = featureIcon(b.settings.icon);
          return (
            <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
              <div className={`flex h-full flex-col gap-4 p-6 ${center ? 'items-center text-center' : 'items-start'}`} style={{ background: colors.bgAlt, borderRadius: 24 }}>
                <span className="grid size-12 place-items-center rounded-full" style={{ background: colors.accent, color: colors.accentInk }}><Icon size={22} aria-hidden /></span>
                <div className="flex flex-col gap-2">
                  {b.settings.title && <h3 className="m-0 text-xl font-semibold tracking-tight" style={{ fontFamily: t.fonts.display, color: colors.ink }}>{b.settings.title}</h3>}
                  {b.settings.description && <p className="m-0 text-[15px] leading-[1.7]" style={{ fontFamily: t.fonts.body, color: colors.inkMuted }}>{renderRichText(b.settings.description)}</p>}
                </div>
              </div>
            </PreviewBlock>
          );
        })}
      </div>
    </SectionShell>
  );
}
