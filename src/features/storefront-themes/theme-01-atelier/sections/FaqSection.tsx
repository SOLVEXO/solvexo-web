import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';
import { PreviewBlock } from '../../previewInspector';
import { copyText, showEyebrow } from '../../sectionCopy';
import { useStoreFaqBlocks } from '../../useStoreFaqBlocks';

function FaqRow({ block, colors }: { block: Block; colors: AtelierSectionColors }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${colors.border}` }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer bg-transparent border-0"
        style={{ padding: '20px 0' }}
      >
        <span style={{ fontFamily: t.fonts.display, fontSize: '15.5px', fontWeight: 600, color: colors.ink }}>{block.settings.question}</span>
        <ChevronDown size={16} style={{ color: colors.inkMuted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {open && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.inkMuted, lineHeight: 1.7, paddingBottom: '20px' }}>
          {block.settings.answer}
        </p>
      )}
    </div>
  );
}

/** Questions come from the section's own blocks, or (source "store") from
 *  Online Store → FAQs — the same list the /faqs page shows. */
function FaqSection({ section, blocks: sectionBlocks, colors }: { section: Section; blocks: Block[]; colors: AtelierSectionColors }) {
  const fromStore = section.settings.source === 'store';
  const storeBlocks = useStoreFaqBlocks(fromStore);
  const blocks = fromStore ? storeBlocks : sectionBlocks;
  if (blocks.length === 0) return null;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto grid grid-cols-1 lg:grid-cols-[0.8fr_1.2fr] gap-8 lg:gap-16" style={{ maxWidth: '1100px' }}>
        <div>
          {showEyebrow(section.settings) && (<p style={{ fontFamily: t.fonts.body, fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: colors.accent, marginBottom: '12px' }}>{copyText(section.settings, 'eyebrow', 'Good to know')}</p>)}
          {section.settings.heading && (
            <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(30px, 4vw, 46px)', fontWeight: 500, color: colors.ink, lineHeight: 1.08 }}>
              {section.settings.heading}
            </h2>
          )}
        </div>
        <div style={{ borderTop: `1px solid ${colors.border}` }}>
          {blocks.map((b, i) => fromStore
            ? <FaqRow key={b._id ?? i} block={b} colors={colors} />
            : <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}><FaqRow block={b} colors={colors} /></PreviewBlock>)}
        </div>
      </div>
    </div>
  );
}

registerAtelierSection('faq', (section: Section, blocks: Block[], colors: AtelierSectionColors) => <FaqSection section={section} blocks={blocks} colors={colors} />);
