import { useState } from 'react';
import { PreviewBlock } from '../../../previewInspector';
import { fashionTheme as t, type FashionColors } from '../../theme.config';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

function Member({ name, role, bio, imageUrl, colors, center }: { name: string; role: string; bio?: string; imageUrl?: string; colors: FashionColors; center: boolean }) {
  const [errored, setErrored] = useState(false);
  return (
    <div className={`flex h-full flex-col gap-4 p-5 ${center ? 'items-center text-center' : 'items-start'}`} style={{ background: colors.bgAlt, borderRadius: 24 }}>
      {imageUrl && !errored ? (
        <img src={imageUrl} alt={name} loading="lazy" onError={() => setErrored(true)} className="w-full object-cover" style={{ aspectRatio: '1 / 1', borderRadius: Math.max(parseInt(t.imageRadiusPx) - 4, 0) }} />
      ) : (
        <span aria-hidden className="grid size-20 place-items-center rounded-full text-2xl font-semibold" style={{ background: colors.accent, color: colors.accentInk, fontFamily: t.fonts.display }}>{initials(name)}</span>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="m-0 text-lg font-semibold tracking-tight" style={{ fontFamily: t.fonts.display, color: colors.ink }}>{name}</h3>
        <p className="m-0 text-sm font-medium" style={{ fontFamily: t.fonts.body, color: colors.inkMuted }}>{role}</p>
        {bio && <p className="m-0 mt-2 text-[15px] leading-[1.7]" style={{ fontFamily: t.fonts.body, color: colors.inkMuted }}>{bio}</p>}
      </div>
    </div>
  );
}

/** "Team grid": photo (or initials), name, role and a short bio per person. */
export function TeamGridSection({ section, blocks, colors }: SharedSectionProps) {
  const people = blocks.filter(b => b.settings.name);
  if (people.length === 0) return null;
  const cols = [2, 3, 4].includes(Number(section.settings.columns)) ? Number(section.settings.columns) : Math.min(Math.max(people.length, 2), 4);
  const center = section.settings.textAlign !== 'left';
  return (
    <SectionShell colors={colors} heading={section.settings.heading} align={center ? 'center' : 'left'}>
      <div className="grid gap-5" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(960 / cols)}px), 1fr))` }}>
        {people.map((b, i) => (
          <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
            <Member name={b.settings.name} role={b.settings.role ?? ''} bio={b.settings.bio} imageUrl={b.settings.imageUrl} colors={colors} center={center} />
          </PreviewBlock>
        ))}
      </div>
    </SectionShell>
  );
}
