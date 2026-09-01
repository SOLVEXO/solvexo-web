import { useStorefront } from '../StorefrontContext';

interface TeamMemberBlock {
  name:      string;
  role?:     string;
  photoUrl?: string;
  bio?:      string;
}

// Team/chef/instructor profile grid — reused across categories (a
// restaurant's chefs, a services business's team, an education store's
// instructors) rather than a bespoke section per one.
export function TeamGridSection({ settings, blocks }: { settings: { heading?: string }; blocks: TeamMemberBlock[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      {settings.heading && (
        <h2 className="font-bold mb-6 text-center" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>
          {settings.heading}
        </h2>
      )}
      <div className="mx-auto grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6" style={{ maxWidth: Math.round(1100 * cfg.containerWidthScale) }}>
        {blocks.map((member, i) => (
          <div key={i} className="flex flex-col items-center text-center gap-2">
            {member.photoUrl ? (
              <img
                src={member.photoUrl} alt={member.name} loading="lazy" decoding="async"
                className="w-20 h-20 object-cover"
                style={{ borderRadius: cfg.productCardRadiusPx === '9999px' ? '9999px' : cfg.imageRadiusPx }}
              />
            ) : (
              <div
                className="w-20 h-20 flex items-center justify-center text-[20px] font-bold text-white"
                style={{ background: cfg.primaryColor, borderRadius: cfg.imageRadiusPx }}
              >
                {member.name.charAt(0)}
              </div>
            )}
            <p className="text-[13.5px] font-bold mt-1" style={{ color: cfg.textColor }}>{member.name}</p>
            {member.role && <p className="text-[11.5px] opacity-70" style={{ color: cfg.textColor }}>{member.role}</p>}
            {member.bio && <p className="text-[11.5px] leading-relaxed opacity-60 mt-1" style={{ color: cfg.textColor }}>{member.bio}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
