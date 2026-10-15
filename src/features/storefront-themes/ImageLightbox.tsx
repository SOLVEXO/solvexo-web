import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cloudinaryUrl } from '@/utils/cloudinaryImage';

/** Full-screen image viewer for product photos: arrows / swipe-free buttons, Esc to close, scroll locked, focus returned. */
export function ImageLightbox({ images, index, alt, onIndexChange, onClose }: {
  images: string[]; index: number; alt: string; onIndexChange: (i: number) => void; onClose: () => void;
}) {
  const { t: tr } = useTranslation('storefront');
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; opener?.focus?.(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft' && count > 1) onIndexChange((index - 1 + count) % count);
      else if (e.key === 'ArrowRight' && count > 1) onIndexChange((index + 1) % count);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, count, onClose, onIndexChange]);

  const control = { background: 'rgba(255,255,255,0.14)', color: '#fff', border: 'none', borderRadius: '9999px', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as const;

  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={tr('product.enlarged', '{{alt}} — enlarged', { alt })} className="fixed inset-0 z-[80] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)' }} onClick={onClose}>
      <button ref={closeRef} type="button" onClick={onClose} aria-label={tr('common.close', "Close")} style={{ ...control, position: 'absolute', top: 16, right: 16 }}><X size={22} /></button>
      {count > 1 && (
        <button type="button" onClick={e => { e.stopPropagation(); onIndexChange((index - 1 + count) % count); }} aria-label={tr('product.prevPhoto', "Previous photo")} style={{ ...control, position: 'absolute', left: 16 }}><ChevronLeft size={24} /></button>
      )}
      <img src={cloudinaryUrl(images[index], 1800)} alt={alt} onClick={e => e.stopPropagation()} style={{ maxWidth: '92vw', maxHeight: '90vh', objectFit: 'contain' }} />
      {count > 1 && (
        <button type="button" onClick={e => { e.stopPropagation(); onIndexChange((index + 1) % count); }} aria-label={tr('product.nextPhoto', "Next photo")} style={{ ...control, position: 'absolute', right: 16 }}><ChevronRight size={24} /></button>
      )}
      {count > 1 && <span aria-live="polite" style={{ position: 'absolute', bottom: 18, color: '#fff', fontSize: 13 }}>{index + 1} / {count}</span>}
    </div>,
    document.body,
  );
}
