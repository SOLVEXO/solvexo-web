import { useStorefront } from '../StorefrontContext';

interface StatItemBlock {
  value: string;
  label: string;
}

// A row of trust/scale statistics ("10,000+ students", "50 years of
// craftsmanship") — deliberately static text, not an animated count-up, to
// keep this section dependency-free and simple to author.
export function StatsCounterSection({ blocks }: { settings: Record<string, any>; blocks: StatItemBlock[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div
        className="mx-auto grid gap-6 text-center"
        style={{ maxWidth: Math.round(1000 * cfg.containerWidthScale), gridTemplateColumns: `repeat(${Math.min(blocks.length, 4)}, minmax(0, 1fr))` }}
      >
        {blocks.map((stat, i) => (
          <div key={i}>
            <p className="font-bold" style={{ color: cfg.primaryColor, fontSize: Math.round(30 * cfg.typeScaleFactor) }}>{stat.value}</p>
            <p className="text-[12.5px] mt-1 opacity-70" style={{ color: cfg.textColor }}>{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
