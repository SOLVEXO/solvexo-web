import { useEffect, useId, useRef, useState } from 'react';

/**
 * The small "?" next to a plan feature. The card shows only the short line; the explanation opens in a dark bubble on
 * hover, keyboard focus or tap (touch has no hover), and closes with Esc, a second tap, or a tap elsewhere.
 */
export function FeatureHelp({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const box = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const onDown = (e: MouseEvent | TouchEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [open]);

  return (
    <span ref={box} className="relative ml-auto shrink-0 self-start" onPointerEnter={e => { if (e.pointerType === 'mouse') setOpen(true); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setOpen(false); }}>
      <button
        type="button"
        aria-label={`About: ${label}`}
        aria-describedby={open ? id : undefined}
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onBlur={() => setOpen(false)}
        className="grid size-[18px] place-items-center rounded-full border text-[11px] font-semibold leading-none"
        style={{ borderColor: '#b9b7b0', color: '#6f6e69', background: 'transparent' }}
      >
        ?
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="absolute bottom-full right-[-6px] z-30 mb-2 w-[236px] rounded-lg px-3 py-2.5 text-left text-[12.5px] font-normal leading-[1.45] text-white"
          style={{ background: '#1c1d1b', boxShadow: '0 6px 20px rgba(0,0,0,.22)' }}
        >
          {text}
          <span aria-hidden className="absolute right-[12px] top-full size-0" style={{ borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid #1c1d1b' }} />
        </span>
      )}
    </span>
  );
}
