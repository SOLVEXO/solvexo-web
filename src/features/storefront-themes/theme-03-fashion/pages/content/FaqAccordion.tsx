import { useId, useState } from 'react';
import { Plus } from 'lucide-react';
import type { PublicStoreFaq } from '@/api/services/storeFaq';
import { renderRichText } from '@/utils/richText';
import { fashionTheme as t } from '../../theme.config';

/** Accessible accordion: every question is a button controlling its answer panel; several can be open at once. */
export function FaqAccordion({ faqs }: { faqs: PublicStoreFaq[] }) {
  const uid = useId();
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const toggle = (id: string) => setOpen(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });

  return (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {faqs.map(f => {
        const isOpen = open.has(f._id);
        const panel = `${uid}-${f._id}`;
        return (
          <li key={f._id} style={{ borderRadius: 20, background: isOpen ? t.colors.bgAlt : t.colors.bg, border: `1px solid ${isOpen ? 'transparent' : t.colors.border}`, transition: 'background-color .2s' }}>
            <h2 className="m-0">
              <button type="button" onClick={() => toggle(f._id)} aria-expanded={isOpen} aria-controls={panel}
                className="flex w-full items-center justify-between gap-4 border-0 bg-transparent text-left" style={{ padding: '18px 22px', fontFamily: t.fonts.display, fontSize: 17, fontWeight: 500, color: t.colors.ink, cursor: 'pointer', borderRadius: 20 }}>
                <span>{f.question}</span>
                <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full" style={{ background: isOpen ? t.colors.ink : t.colors.bgAlt, color: isOpen ? t.colors.bg : t.colors.ink, transition: 'transform .25s, background-color .2s', transform: isOpen ? 'rotate(45deg)' : 'none' }}><Plus size={16} /></span>
              </button>
            </h2>
            <div id={panel} role="region" aria-label={f.question} hidden={!isOpen} className="whitespace-pre-line text-[15px] leading-[1.75]" style={{ padding: '0 22px 20px', color: t.colors.inkMuted }}>
              {renderRichText(f.answer)}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
