import { useStorefront } from '../StorefrontContext';

interface MenuItemBlock {
  name:         string;
  description?: string;
  price?:       number;
  imageUrl?:    string;
  /** Free-text grouping label (e.g. "Starters", "Module 1") — purely
   *  presentational, not a real taxonomy reference like category/collection. */
  category?:    string;
}

// A restaurant menu, a course's module list, or a digital bundle's line
// items — grouped by each block's own free-text `category` label (in the
// order those labels first appear), rendered without prices for anything
// that omits one (a course module has no "price").
export function MenuListSection({ settings, blocks }: { settings: { heading?: string; subheading?: string }; blocks: MenuItemBlock[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  const groups: { category: string | null; items: MenuItemBlock[] }[] = [];
  for (const item of blocks) {
    const category = item.category?.trim() || null;
    let group = groups.find(g => g.category === category);
    if (!group) { group = { category, items: [] }; groups.push(group); }
    group.items.push(item);
  }

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div className="mx-auto" style={{ maxWidth: Math.round(760 * cfg.containerWidthScale) }}>
        {settings.heading && (
          <h2 className="font-bold text-center" style={{ color: cfg.textColor, fontSize: Math.round(22 * cfg.typeScaleFactor) }}>
            {settings.heading}
          </h2>
        )}
        {settings.subheading && <p className="text-[13px] text-center opacity-70 mt-1 mb-6" style={{ color: cfg.textColor }}>{settings.subheading}</p>}

        <div className="flex flex-col gap-8 mt-5">
          {groups.map((group, gi) => (
            <div key={gi}>
              {group.category && (
                <p className="text-[12px] font-bold uppercase tracking-wide mb-3" style={{ color: cfg.primaryColor }}>{group.category}</p>
              )}
              <div className="flex flex-col divide-y" style={{ borderColor: `${cfg.textColor}0F` }}>
                {group.items.map((item, i) => (
                  <div key={i} className="flex items-start gap-3 py-3.5 first:pt-0">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl} alt={item.name} loading="lazy" decoding="async"
                        className="w-14 h-14 rounded-lg object-cover shrink-0"
                        style={{ borderRadius: cfg.imageRadiusPx }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-[14px] font-bold" style={{ color: cfg.textColor }}>{item.name}</p>
                        {item.price != null && <p className="text-[14px] font-bold shrink-0" style={{ color: cfg.primaryColor }}>${item.price.toFixed(2)}</p>}
                      </div>
                      {item.description && <p className="text-[12.5px] leading-relaxed opacity-70 mt-0.5" style={{ color: cfg.textColor }}>{item.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
