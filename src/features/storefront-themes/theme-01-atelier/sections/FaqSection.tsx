import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

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

registerAtelierSection('faq', (section: Section, blocks: Block[], colors: AtelierSectionColors) => {
  if (blocks.length === 0) return null;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: '720px' }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink, marginBottom: '20px' }}>
            {section.settings.heading}
          </h2>
        )}
        {blocks.map((b, i) => <FaqRow key={b._id ?? i} block={b} colors={colors} />)}
      </div>
    </div>
  );
});
