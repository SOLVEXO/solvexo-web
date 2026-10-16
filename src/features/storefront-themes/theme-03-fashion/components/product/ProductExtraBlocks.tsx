import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, Ruler } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { Dialog } from '../../ui/Dialog';

type Settings = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** "Collapsible tab" block: a title that opens to plain text. */
export function ProductCollapsibleTab({ settings }: { settings: Settings }) {
  const { t: tr } = useTranslation('storefront');
  const [open, setOpen] = useState(settings.openByDefault === true);
  const panelId = useId();
  const title = str(settings.title) || tr('product.moreInfo', "More information");
  const content = str(settings.content);
  if (!content) return null;
  return (
    <div style={{ background: t.colors.bgAlt, borderRadius: 18, fontFamily: t.fonts.body }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={panelId}
        className="flex w-full cursor-pointer items-center justify-between gap-3 border-0 bg-transparent px-5 py-4 text-left text-sm font-semibold" style={{ color: t.colors.ink }}>
        <span>{title}</span>
        <ChevronDown size={16} aria-hidden style={{ color: t.colors.inkMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />
      </button>
      {open && <div id={panelId} role="region" className="whitespace-pre-line px-5 pb-5 text-sm leading-[1.75]" style={{ color: t.colors.inkMuted }}>{content}</div>}
    </div>
  );
}

/** "Size chart" block: a pill link that opens a dialog with the seller's text and/or image. */
export function ProductSizeChart({ settings }: { settings: Settings }) {
  const { t: tr } = useTranslation('storefront');
  const [open, setOpen] = useState(false);
  const label = str(settings.label) || tr('product.sizeChart', "Size chart");
  const title = str(settings.title) || label;
  const content = str(settings.content);
  const imageUrl = /^https:\/\//i.test(str(settings.imageUrl)) ? str(settings.imageUrl) : '';
  if (!content && !imageUrl) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-flex cursor-pointer items-center gap-2 self-start border-0 px-4 py-2.5 text-[13px] font-medium"
        style={{ fontFamily: t.fonts.body, color: t.colors.ink, background: t.colors.bgAlt, borderRadius: t.buttonRadiusPx }}>
        <Ruler size={15} aria-hidden /> {label}
      </button>
      {open && (
        <Dialog title={title} onClose={() => setOpen(false)} size="lg">
          {imageUrl && <img src={imageUrl} alt={title} className="h-auto w-full" style={{ borderRadius: 16, marginBottom: content ? 16 : 0 }} />}
          {content && <p className="m-0 whitespace-pre-line text-sm leading-[1.75]" style={{ color: t.colors.inkMuted }}>{content}</p>}
        </Dialog>
      )}
    </>
  );
}

/** "Buy it now": adds this variant and goes straight to checkout. */
export function ProductBuyNowButton({ settings, disabled, loading, onBuy }: { settings: Settings; disabled: boolean; loading: boolean; onBuy: () => void }) {
  const { t: tr } = useTranslation('storefront');
  return (
    <button type="button" onClick={onBuy} disabled={disabled || loading} aria-busy={loading || undefined} className="fx-pill w-full"
      style={{ background: 'transparent', color: t.colors.ink, border: `1.5px solid ${t.colors.ink}`, borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body }}>
      {loading ? tr('common.pleaseWait', "Please wait…") : str(settings.label) || tr('product.buyNow', "Buy it now")}
    </button>
  );
}
