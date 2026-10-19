import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fashionTheme as t } from '../../theme.config';
import { FashionButton } from '../FashionButton';

interface Props {
  /** id of the in-page buy buttons; the bar shows once they have scrolled out of view. */
  targetId: string;
  name: string;
  price: string;
  disabled: boolean;
  loading: boolean;
  label: string;
  onAdd: () => void;
}

/** Phone-only bar pinned to the bottom with the price and Add to cart, so the buy action is always one tap away. */
export function StickyBuyBar({ targetId, name, price, disabled, loading, label, onAdd }: Props) {
  const { t: tr } = useTranslation('storefront');
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setShow(!entry.isIntersecting && entry.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, [targetId]);

  if (!show) return null;
  return (
    <div role="region" aria-label={tr('product.quickBuy', 'Quick buy')} className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 px-4 pt-3 lg:hidden"
      style={{ background: t.colors.bg, borderTop: `1px solid ${t.colors.border}`, paddingBottom: 'max(12px, env(safe-area-inset-bottom))', boxShadow: '0 -8px 24px rgba(0,0,0,.08)', fontFamily: t.fonts.body }}>
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-sm font-medium" style={{ color: t.colors.ink }}>{name}</p>
        <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>{price}</p>
      </div>
      <div className="shrink-0">
        <FashionButton disabled={disabled} loading={loading} onClick={onAdd}>{label}</FashionButton>
      </div>
    </div>
  );
}
