import { useStorefront } from '../StorefrontContext';

interface SpecRowBlock {
  label: string;
  value: string;
}

// A plain label/value table — technical specifications (electronics),
// dimensions/materials (furniture), or any other "at-a-glance facts" content
// a seller wants to present without dressing it up as a feature grid.
export function SpecTableSection({ settings, blocks }: { settings: { heading?: string; subheading?: string }; blocks: SpecRowBlock[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div className="mx-auto" style={{ maxWidth: Math.round(720 * cfg.containerWidthScale) }}>
        {settings.heading && (
          <h2 className="font-bold text-center" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>
            {settings.heading}
          </h2>
        )}
        {settings.subheading && <p className="text-[13px] text-center opacity-70 mt-1 mb-5" style={{ color: cfg.textColor }}>{settings.subheading}</p>}
        <div className={settings.heading ? 'mt-5' : ''} style={{ border: `1px solid ${cfg.textColor}14`, borderRadius: cfg.productCardRadiusPx, overflow: 'hidden' }}>
          {blocks.map((row, i) => (
            <div
              key={i}
              className="flex items-baseline justify-between gap-4 px-4 py-3"
              style={{ borderTop: i === 0 ? 'none' : `1px solid ${cfg.textColor}0F` }}
            >
              <span className="text-[13px] font-semibold shrink-0" style={{ color: cfg.textColor, opacity: 0.65 }}>{row.label}</span>
              <span className="text-[13px] text-right" style={{ color: cfg.textColor }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
