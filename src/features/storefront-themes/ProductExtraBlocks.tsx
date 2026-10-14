import { useId, useState } from 'react';
import { ChevronDown, Ruler } from 'lucide-react';
import { Modal } from '@/components/comman/ui';
import type { PartTokens } from './ProductPageParts';

type Settings = Record<string, unknown>;
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Product page "Collapsible tab" block (Shopify Dawn): a title that opens to plain text. */
export function ProductCollapsibleTab({ settings, tokens }: { settings: Settings; tokens: PartTokens }) {
  const [open, setOpen] = useState(settings.openByDefault === true);
  const panelId = useId();
  const title = str(settings.title) || 'More information';
  const content = str(settings.content);
  if (!content) return null;
  return (
    <div style={{ borderTop: `1px solid ${tokens.colors.border}`, borderBottom: `1px solid ${tokens.colors.border}` }}>
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} aria-controls={panelId}
        className="w-full flex items-center justify-between gap-3 text-left bg-transparent border-0 cursor-pointer"
        style={{ padding: '14px 0', fontFamily: tokens.fonts.body, fontSize: '13.5px', fontWeight: 600, color: tokens.colors.ink }}>
        <span>{title}</span>
        <ChevronDown size={15} aria-hidden style={{ color: tokens.colors.inkMuted, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }} />
      </button>
      {open && (
        <div id={panelId} role="region" style={{ paddingBottom: '14px', fontFamily: tokens.fonts.body, fontSize: '13.5px', lineHeight: 1.7, color: tokens.colors.inkMuted, whiteSpace: 'pre-line' }}>
          {content}
        </div>
      )}
    </div>
  );
}

/** Product page "Size chart" block: a link that opens a popup with the seller's text and/or image. */
export function ProductSizeChart({ settings, tokens }: { settings: Settings; tokens: PartTokens }) {
  const [open, setOpen] = useState(false);
  const label = str(settings.label) || 'Size chart';
  const title = str(settings.title) || label;
  const content = str(settings.content);
  const imageUrl = /^https:\/\//i.test(str(settings.imageUrl)) ? str(settings.imageUrl) : '';
  if (!content && !imageUrl) return null;
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="self-start inline-flex items-center gap-2 bg-transparent border-0 cursor-pointer p-0"
        style={{ fontFamily: tokens.fonts.body, fontSize: '12.5px', fontWeight: 600, color: tokens.colors.ink, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
        <Ruler size={14} aria-hidden /> {label}
      </button>
      {open && (
        <Modal title={title} onClose={() => setOpen(false)} width={640}>
          {imageUrl && <img src={imageUrl} alt={title} style={{ width: '100%', height: 'auto', marginBottom: content ? '14px' : 0 }} />}
          {content && <p style={{ fontSize: '13.5px', lineHeight: 1.7, whiteSpace: 'pre-line', margin: 0 }}>{content}</p>}
        </Modal>
      )}
    </>
  );
}

/** Product page "Buy it now" button: adds this variant and goes straight to checkout. */
export function ProductBuyNowButton({ settings, tokens, disabled, loading, onBuy }: {
  settings: Settings; tokens: PartTokens; disabled: boolean; loading: boolean; onBuy: () => void;
}) {
  return (
    <button type="button" onClick={onBuy} disabled={disabled || loading}
      className="w-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        fontFamily: tokens.fonts.body, fontSize: '13px', fontWeight: 600, padding: '13px 18px',
        border: `1px solid ${tokens.colors.ink}`, borderRadius: tokens.buttonRadius,
        background: 'transparent', color: tokens.colors.ink,
      }}>
      {loading ? 'Please wait…' : str(settings.label) || 'Buy it now'}
    </button>
  );
}
