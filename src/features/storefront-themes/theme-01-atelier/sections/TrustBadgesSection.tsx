import { Truck, ShieldCheck, RefreshCw, Headset, Lock } from 'lucide-react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { atelierTheme as t } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

const ICONS: Record<string, typeof Truck> = { truck: Truck, shield: ShieldCheck, refresh: RefreshCw, headset: Headset, lock: Lock };

registerAtelierSection('trust_badges', (_section: Section, blocks: Block[]) => {
  if (blocks.length === 0) return null;
  return (
    <div style={{ borderTop: `1px solid ${t.colors.border}`, borderBottom: `1px solid ${t.colors.border}` }}>
      <div
        className="mx-auto grid gap-8 text-center"
        style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}`, gridTemplateColumns: `repeat(${Math.min(blocks.length, 5)}, minmax(0, 1fr))` }}
      >
        {blocks.map((b, i) => {
          const Icon = ICONS[b.settings.icon] ?? ShieldCheck;
          return (
            <div key={b._id ?? i} className="flex flex-col items-center gap-2">
              <Icon size={20} style={{ color: t.colors.accent }} />
              <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>{b.settings.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});
