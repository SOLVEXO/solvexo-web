import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cloudinaryUrl } from '@/utils/cloudinaryImage';
import { isDocumentRtl, keyStep, swipeStep } from '../../carouselDirection';
import { fashionTheme as t } from '../../theme.config';

const roundBtn = () => ({ background: t.colors.bg, color: t.colors.ink, border: 'none', borderRadius: 9999, width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }) as const;

/** Full-screen product photo viewer: arrows / swipe, Esc to close, scroll locked, focus returned. */
export function FashionImageLightbox({ images, index, alt, onIndexChange, onClose }: {
  images: string[]; index: number; alt: string; onIndexChange: (i: number) => void; onClose: () => void;
}) {
  const { t: tr } = useTranslation('storefront');
  const closeRef = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const count = images.length;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = prev; opener?.focus?.(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (count > 1) { const d = keyStep(e.key, isDocumentRtl()); if (d) onIndexChange((index + d + count) % count); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onClose, onIndexChange]);

  const step = (d: number) => onIndexChange((index + d + count) % count);
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchX.current;
    touchX.current = null;
    if (start == null || count < 2) return;
    const dx = e.changedTouches[0].clientX - start;
    const s = swipeStep(dx, isDocumentRtl());
    if (s) step(s);
  };

  /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- Esc/arrow keys are handled on document; clicks only dismiss */
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={tr('product.enlarged', '{{alt}} — enlarged', { alt })} className="fixed inset-0 z-[90] flex items-center justify-center"
      style={{ background: 'rgba(9,9,11,0.92)', backdropFilter: 'blur(4px)' }} onClick={onClose}
      onTouchStart={e => { touchX.current = e.touches[0].clientX; }} onTouchEnd={onTouchEnd}>
      <button ref={closeRef} type="button" onClick={onClose} aria-label={tr('common.close', "Close")} style={{ ...roundBtn(), position: 'absolute', top: 16, insetInlineEnd: 16 }}><X size={20} aria-hidden /></button>
      {count > 1 && <button type="button" onClick={e => { e.stopPropagation(); step(-1); }} aria-label={tr('product.prevPhoto', "Previous photo")} style={{ ...roundBtn(), position: 'absolute', insetInlineStart: 16 }}><ChevronLeft size={22} className="fx-flip-rtl" aria-hidden /></button>}
      <img src={cloudinaryUrl(images[index], 1800)} alt={alt} draggable={false} onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 20 }} />
      {count > 1 && <button type="button" onClick={e => { e.stopPropagation(); step(1); }} aria-label={tr('product.nextPhoto', "Next photo")} style={{ ...roundBtn(), position: 'absolute', insetInlineEnd: 16 }}><ChevronRight size={22} className="fx-flip-rtl" aria-hidden /></button>}
      {count > 1 && <span aria-live="polite" className="absolute bottom-5 rounded-full px-3.5 py-1.5 text-[13px] font-medium" style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>{index + 1} / {count}</span>}
    </div>,
    document.body,
  );
}
