import { Truck, ShieldCheck, RefreshCw, Headset, Lock } from 'lucide-react';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

const ICONS: Record<string, typeof Truck> = { truck: Truck, shield: ShieldCheck, refresh: RefreshCw, headset: Headset, lock: Lock };

registerNovaSection('trust_badges', (_section: Section, blocks: Block[], colors: NovaSectionColors) => {
  if (blocks.length === 0) return null;
  return (
    <div style={{ background: colors.bgAlt }}>
      <div
        className="mx-auto grid gap-8 text-center"
        style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}`, gridTemplateColumns: `repeat(${Math.min(blocks.length, 5)}, minmax(0, 1fr))` }}
      >
        {blocks.map((b, i) => {
          const Icon = ICONS[b.settings.icon] ?? ShieldCheck;
          return (
            <div key={b._id ?? i} className="flex flex-col items-center gap-2">
              <div className="flex items-center justify-center" style={{ width: '38px', height: '38px', borderRadius: '9999px', background: colors.bg }}>
                <Icon size={17} style={{ color: colors.accent }} />
              </div>
              <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: colors.inkMuted, fontWeight: 600 }}>{b.settings.text}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});
