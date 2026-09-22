import { useState, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { Smile } from 'lucide-react';
import { EMOJI_GROUPS } from './emojiData';

interface EmojiPickerProps {
  onSelect:   (emoji: string) => void;
  className?: string;
}

// A lightweight, self-contained emoji picker — no external dependency,
// just a button that pops a grid above it (Instagram/WhatsApp composer style).
export function EmojiPicker({ onSelect, className }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    // Escape to close (was missing — every other popover/menu in this app
    // closes on Escape, this one silently didn't) and close on scroll of the
    // message thread behind it, so a stale-positioned panel never lingers
    // visually once the composer/button it's anchored to has moved.
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onScroll = () => setOpen(false);
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEsc);
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    return () => {
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEsc);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    // `isolate` gives this popover its own stacking context — this app's
    // message rows use `content-visibility: auto` as a lightweight
    // virtualization substitute (see MessageThread.tsx), and an absolutely-
    // positioned overlay that crosses a `content-visibility` row's own
    // layout/paint containment boundary can otherwise show duplicated/
    // stale-looking paint artifacts; isolating this popover's own stacking
    // context keeps its paint fully self-contained regardless of what's
    // behind it.
    <div ref={rootRef} className={clsx('relative isolate', className)}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={clsx(
          'w-9 h-9 flex items-center justify-center rounded-full cursor-pointer border-none bg-transparent transition-colors',
          open ? 'text-brand-orange bg-brand-pale-orange' : 'text-slate hover:bg-cream',
        )}
      >
        <Smile size={19} />
      </button>

      {open && (
        <div className="absolute bottom-[46px] left-0 z-50 w-[260px] max-h-[280px] overflow-y-auto bg-white border border-bone rounded-[14px] p-[10px]">
          {EMOJI_GROUPS.map(group => (
            <div key={group.label} className="mb-[8px]">
              <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.05em] mb-[4px] px-[2px]">{group.label}</p>
              <div className="grid grid-cols-7 gap-[2px]">
                {group.emojis.map(e => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => { onSelect(e); setOpen(false); }}
                    className="text-[19px] leading-none w-8 h-8 flex items-center justify-center rounded-[8px] hover:bg-cream cursor-pointer bg-transparent border-none"
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
