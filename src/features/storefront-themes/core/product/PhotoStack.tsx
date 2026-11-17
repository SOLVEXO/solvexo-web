import type { ImgHTMLAttributes } from 'react';
import { ZoomIn } from 'lucide-react';

/** Every product photo shown big, in one column (stacked) or two (grid). Clicking a photo opens the zoom viewer when `onZoom` is given. */
export function PhotoStack({ images, columns, aspect, radius, background, alt, imgAttrs, onZoom }: {
  images: string[];
  columns: 1 | 2;
  aspect: string;
  radius: number | string;
  background: string;
  alt: string;
  /** The theme's own responsive image attributes for one photo (src, srcSet, sizes). */
  imgAttrs: (src: string, index: number) => ImgHTMLAttributes<HTMLImageElement>;
  onZoom?: (index: number) => void;
}) {
  return (
    <div data-photo-stack={columns === 2 ? 'grid' : 'stacked'} className="grid gap-3" style={{ gridTemplateColumns: columns === 2 ? 'repeat(2, minmax(0, 1fr))' : 'minmax(0, 1fr)' }}>
      {images.map((src, i) => {
        const frame = { aspectRatio: aspect === 'auto' ? undefined : aspect, background, borderRadius: radius } as const;
        const img = <img {...imgAttrs(src, i)} alt={i === 0 ? alt : ''} loading={i === 0 ? 'eager' : 'lazy'} className="size-full object-cover" style={aspect === 'auto' ? { height: 'auto' } : undefined} />;
        return onZoom
          ? (
            <button key={src + i} type="button" onClick={() => onZoom(i)} aria-label={`Zoom image ${i + 1}`} className="group relative block w-full cursor-zoom-in overflow-hidden border-0 p-0" style={frame}>
              {img}
              <span className="absolute bottom-3 right-3 grid size-9 place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100" style={{ background }}><ZoomIn size={16} /></span>
            </button>
          )
          : <div key={src + i} className="relative w-full overflow-hidden" style={frame}>{img}</div>;
      })}
    </div>
  );
}
