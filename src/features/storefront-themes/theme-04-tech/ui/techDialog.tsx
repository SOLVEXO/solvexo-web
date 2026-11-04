import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, X } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { techTheme as t } from '../theme.config';
import { PillButton } from './techForm';

const SIZES = { sm: 440, md: 560, lg: 760 } as const;
const FOCUSABLE = 'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Tech modal: a header bar with a blue rule, focus trap, Esc / backdrop close, scroll lock, focus returned to the opener. */
export function TechDialog({ title, onClose, children, footer, size = 'md' }: { title: string; onClose: () => void; children: ReactNode; footer?: ReactNode; size?: keyof typeof SIZES | number }) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    (panel?.querySelector<HTMLElement>(FOCUSABLE) ?? panel)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return; }
      if (e.key !== 'Tab' || !panel) return;
      const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (items.length === 0) { e.preventDefault(); return; }
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === panel)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prevOverflow; opener?.focus?.(); };
  }, []);

  return createPortal(
    <div role="presentation" className="fixed inset-0 z-[90] flex items-end justify-center sm:items-center sm:p-6" style={{ background: 'rgba(2,2,3,0.55)' }} onMouseDown={e => { if (e.target === e.currentTarget) closeRef.current(); }}>
      <div ref={panelRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} className="tx-pop flex max-h-[92vh] w-full flex-col overflow-hidden outline-none"
        style={{ maxWidth: typeof size === 'number' ? size : SIZES[size], background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body, borderRadius: t.cardRadiusPx, borderTop: `4px solid ${t.colors.accent}`, boxShadow: '0 24px 70px rgba(2,2,3,0.35)' }}>
        <div className="flex shrink-0 items-center justify-between gap-3 px-6 py-4" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
          <h2 id={titleId} className="m-0 text-lg font-semibold" style={{ fontFamily: t.fonts.display }}>{title}</h2>
          <button type="button" onClick={onClose} aria-label={ts('pg.close_dialog', 'Close dialog')} className="grid size-9 cursor-pointer place-items-center border-0 bg-transparent" style={{ color: t.colors.ink }}><X size={20} aria-hidden /></button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex shrink-0 flex-wrap gap-3 px-6 py-4" style={{ borderTop: `1px solid ${t.colors.border}` }}>{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function TechConfirmDialog({ title, message, confirmLabel = ts('pg.word_confirm', 'Confirm'), cancelLabel = ts('common.cancel', 'Cancel'), tone = 'default', busy = false, error, onConfirm, onClose }: {
  title: string; message: ReactNode; confirmLabel?: string; cancelLabel?: string; tone?: 'default' | 'destructive'; busy?: boolean; error?: string; onConfirm: () => void; onClose: () => void;
}) {
  return (
    <TechDialog title={title} onClose={busy ? () => {} : onClose} size="sm"
      footer={<>
        <PillButton variant="outline" className="flex-1" disabled={busy} onClick={onClose}>{cancelLabel}</PillButton>
        <button type="button" disabled={busy} aria-busy={busy || undefined} onClick={onConfirm} className="tx-btn flex-1" style={{ background: tone === 'destructive' ? t.colors.danger : t.colors.accent, color: '#FFFFFF', borderColor: tone === 'destructive' ? t.colors.danger : t.colors.accent, borderRadius: t.buttonRadiusPx }}>
          {busy && <Loader2 size={16} className="animate-spin" aria-hidden />}{confirmLabel}
        </button>
      </>}>
      <div className="text-[15px] leading-relaxed">{message}</div>
      {error && <p role="alert" className="m-0 mt-3 text-sm" style={{ color: t.colors.danger }}>{error}</p>}
    </TechDialog>
  );
}
