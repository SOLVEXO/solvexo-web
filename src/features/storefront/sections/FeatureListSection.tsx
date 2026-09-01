import { Leaf, Shield, Heart, Star, Check, Sparkles, Award, Droplet, type LucideIcon } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';

interface FeatureItemBlock {
  icon:        'leaf' | 'shield' | 'heart' | 'star' | 'check' | 'sparkles' | 'award' | 'droplet';
  title:       string;
  description?: string;
}

const ICON_MAP: Record<FeatureItemBlock['icon'], LucideIcon> = {
  leaf: Leaf, shield: Shield, heart: Heart, star: Star,
  check: Check, sparkles: Sparkles, award: Award, droplet: Droplet,
};

// Generic icon+title+description grid — covers ingredients (beauty),
// benefits, craftsmanship (jewelry/furniture), materials, and feature/
// license highlights (digital products) without a bespoke section per
// category (see the theme ecosystem plan's Phase 3 note).
export function FeatureListSection({ settings, blocks }: { settings: { heading?: string }; blocks: FeatureItemBlock[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      {settings.heading && (
        <h2 className="font-bold mb-5 text-center" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>
          {settings.heading}
        </h2>
      )}
      <div className="mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale) }}>
        {blocks.map((item, i) => {
          const Icon = ICON_MAP[item.icon] ?? Star;
          return (
            <div key={i} className="flex flex-col items-center text-center gap-2.5">
              <span
                className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
                style={{ background: `${cfg.primaryColor}15`, color: cfg.primaryColor }}
              >
                <Icon size={19} />
              </span>
              <p className="text-[13.5px] font-bold" style={{ color: cfg.textColor }}>{item.title}</p>
              {item.description && <p className="text-[12px] leading-relaxed opacity-70" style={{ color: cfg.textColor }}>{item.description}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
