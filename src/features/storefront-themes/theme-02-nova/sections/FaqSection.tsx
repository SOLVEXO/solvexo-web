import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';
import { PreviewBlock } from '../../previewInspector';

function FaqRow({ block, colors }: { block: Block; colors: NovaSectionColors }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1.5px solid ${colors.border}` }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer bg-transparent border-0"
        style={{ padding: '20px 0' }}
      >
        <span style={{ fontFamily: t.fonts.display, fontSize: '15.5px', fontWeight: 700, color: colors.ink }}>{block.settings.question}</span>
        <ChevronDown size={16} style={{ color: colors.accent, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {open && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: colors.inkMuted, lineHeight: 1.7, paddingBottom: '20px' }}>
          {block.settings.answer}
        </p>
      )}
    </div>
  );
}

registerNovaSection('faq', (section: Section, blocks: Block[], colors: NovaSectionColors) => {
  if (blocks.length === 0) return null;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}`, background: colors.bgAlt }}>
      <div className="mx-auto" style={{ maxWidth: '900px' }}>
        <div className="text-center mb-8">
          <span style={{ display: 'inline-block', fontFamily: t.fonts.body, fontSize: '10px', fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.colors.accent, background: colors.bg, borderRadius: '9999px', padding: '7px 13px', marginBottom: '14px' }}>Quick answers</span>
          {section.settings.heading && (
            <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(30px, 4vw, 44px)', fontWeight: 700, color: colors.ink, lineHeight: 1.05 }}>
              {section.settings.heading}
            </h2>
          )}
        </div>
        <div style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: t.radius.md, padding: '8px clamp(18px, 4vw, 36px)' }}>
          {blocks.map((b, i) => <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}><FaqRow block={b} colors={colors} /></PreviewBlock>)}
        </div>
      </div>
    </div>
  );
});
