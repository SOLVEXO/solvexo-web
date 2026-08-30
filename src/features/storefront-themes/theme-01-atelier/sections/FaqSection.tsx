import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { atelierTheme as t } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

function FaqRow({ block }: { block: Block }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: `1px solid ${t.colors.border}` }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 text-left cursor-pointer bg-transparent border-0"
        style={{ padding: '20px 0' }}
      >
        <span style={{ fontFamily: t.fonts.display, fontSize: '15.5px', fontWeight: 600, color: t.colors.ink }}>{block.settings.question}</span>
        <ChevronDown size={16} style={{ color: t.colors.inkMuted, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {open && (
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, lineHeight: 1.7, paddingBottom: '20px' }}>
          {block.settings.answer}
        </p>
      )}
    </div>
  );
}

registerAtelierSection('faq', (section: Section, blocks: Block[]) => {
  if (blocks.length === 0) return null;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: '720px' }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: t.colors.ink, marginBottom: '20px' }}>
            {section.settings.heading}
          </h2>
        )}
        {blocks.map((b, i) => <FaqRow key={b._id ?? i} block={b} />)}
      </div>
    </div>
  );
});
