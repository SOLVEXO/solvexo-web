import { Star } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';

interface TestimonialBlock {
  quote:       string;
  authorName:  string;
  authorRole?: string;
  avatarUrl?:  string;
  rating?:     number;
}

export function TestimonialsSection({ settings, blocks }: { settings: { heading?: string }; blocks: TestimonialBlock[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8">
      {settings.heading && <h2 className="text-[20px] font-bold mb-5 text-center" style={{ color: cfg.textColor }}>{settings.heading}</h2>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-[1100px] mx-auto">
        {blocks.map((t, i) => (
          <div key={i} className="bg-white border border-bone rounded-xl p-5 flex flex-col gap-3">
            {t.rating != null && (
              <div className="flex gap-[2px]">
                {[1, 2, 3, 4, 5].map(n => <Star key={n} size={13} style={n <= t.rating! ? { color: cfg.primaryColor, fill: cfg.primaryColor } : { color: '#D9D6CC' }} />)}
              </div>
            )}
            <p className="text-[13.5px] leading-relaxed" style={{ color: cfg.textColor }}>“{t.quote}”</p>
            <div className="flex items-center gap-2 mt-auto">
              {t.avatarUrl
                ? <img src={t.avatarUrl} alt={t.authorName} className="w-8 h-8 rounded-full object-cover" />
                : <div className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white" style={{ background: cfg.primaryColor }}>{t.authorName[0]}</div>}
              <div>
                <p className="text-[12.5px] font-semibold" style={{ color: cfg.textColor }}>{t.authorName}</p>
                {t.authorRole && <p className="text-[11px] opacity-60" style={{ color: cfg.textColor }}>{t.authorRole}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
