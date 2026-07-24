import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Banner } from '@/api/services/banner';

/** Promotional banner carousel — full-bleed background layer, admin-managed via
 *  the platform-wide Banner list (no per-page scoping exists, so the same
 *  banners a buyer sees on the Homepage/Marketplace also show here). Fills its
 *  nearest `relative`-positioned, sized parent (`absolute inset-0`). */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length < 2) return;
    const id = setInterval(() => setIndex(i => (i + 1) % banners.length), 5000);
    return () => clearInterval(id);
  }, [banners.length]);

  const sorted = [...banners].sort((a, b) => a.order - b.order);
  const active = sorted[index];

  const go = (dir: 1 | -1) => setIndex(i => (i + dir + sorted.length) % sorted.length);

  const content = <img loading="lazy" decoding="async" src={active.bannerImage} alt="" className="absolute inset-0 w-full h-full object-cover" />;

  return (
    <div className="absolute inset-0 group">
      {active.urlOnTap ? (
        <a href={active.urlOnTap} target="_blank" rel="noreferrer" className="absolute inset-0">{content}</a>
      ) : content}

      {sorted.length > 1 && (
        <>
          <button
            onClick={() => go(-1)}
            aria-label="Previous banner"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border-none cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronLeft size={16} className="text-charcoal" />
          </button>
          <button
            onClick={() => go(1)}
            aria-label="Next banner"
            className="absolute right-3 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/80 hover:bg-white flex items-center justify-center border-none cursor-pointer opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10"
          >
            <ChevronRight size={16} className="text-charcoal" />
          </button>
          <div className="absolute bottom-4 right-4 sm:right-6 lg:right-10 flex gap-[6px] z-10">
            {sorted.map((b, i) => (
              <button
                key={b._id}
                onClick={() => setIndex(i)}
                aria-label={`Go to banner ${i + 1}`}
                className="p-2 -m-2 flex items-center cursor-pointer"
              >
                <span
                  className="block h-[6px] rounded-full transition-all"
                  style={{ width: i === index ? 18 : 6, background: i === index ? '#D97757' : 'rgba(255,255,255,0.7)' }}
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
