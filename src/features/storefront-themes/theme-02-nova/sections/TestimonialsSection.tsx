import { Star } from 'lucide-react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

function TestimonialCard({ block, colors }: { block: Block; colors: NovaSectionColors }) {
  const s = block.settings;
  const rating = Math.max(1, Math.min(5, s.rating ?? 5));
  return (
    <div className="flex flex-col gap-4" style={{ background: colors.bgAlt, borderRadius: t.radius.md, padding: '28px' }}>
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} fill={i < rating ? colors.accent : 'none'} color={colors.accent} />
        ))}
      </div>
      <p style={{ fontFamily: t.fonts.display, fontSize: '15.5px', color: colors.ink, lineHeight: 1.6, fontWeight: 600 }}>“{s.quote}”</p>
      <div>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', fontWeight: 700, color: colors.ink }}>{s.authorName}</p>
        {s.authorRole && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.inkMuted }}>{s.authorRole}</p>}
      </div>
    </div>
  );
}

registerNovaSection('testimonials', (section: Section, blocks: Block[], colors: NovaSectionColors) => {
  if (blocks.length === 0) return null;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: colors.ink, marginBottom: '36px', textAlign: 'center' }}>
            {section.settings.heading}
          </h2>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {blocks.map((b, i) => <TestimonialCard key={b._id ?? i} block={b} colors={colors} />)}
        </div>
      </div>
    </div>
  );
});
