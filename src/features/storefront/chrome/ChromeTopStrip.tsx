import { useCallback, useRef, useState, type RefObject } from 'react';
import { ChevronDown, Mail, Phone } from 'lucide-react';
import { ChromeIcon } from './ChromeIcon';
import { ChromePopup, type ChromeTheme } from './ChromePopup';
import type { ChromeItem, ChromeZone } from './chromeTypes';

export interface TopStripData {
  text: string | null; phone: string | null; email: string | null; bg: string | null; color: string | null; items: ChromeItem[];
  size: 'sm' | 'md' | 'lg'; fontSize?: number | null; padY?: number | null;
}

const FONT_PX = { sm: 11, md: 12, lg: 14 } as const;
const PAD_Y = { sm: 5, md: 7, lg: 10 } as const;
// `hidden` and `inline-flex` both set `display`; which one wins depends on CSS order, so the display class is chosen per device instead of stacked.
const DEVICE_CLASS = { all: 'inline-flex', desktop: 'hidden md:inline-flex', mobile: 'inline-flex md:hidden' } as const;

function StripItem({ item, color, theme, stripRef }: { item: ChromeItem; color: string; theme: ChromeTheme; stripRef: RefObject<HTMLDivElement | null> }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const style = {
    color: item.fg || color, background: item.bg || undefined, borderRadius: item.bg ? 999 : undefined, padding: item.bg ? '2px 10px' : undefined,
    ...(item.fontSize > 0 ? { fontSize: item.fontSize } : {}), ...(item.bold ? { fontWeight: 700 } : {}),
  };
  const cls = `items-center gap-1.5 whitespace-nowrap ${DEVICE_CLASS[item.device] ?? 'inline-flex'}`;
  const inner = (
    <>
      {(item.icon || item.iconUrl) && <ChromeIcon icon={item.icon} iconUrl={item.iconUrl} size={item.fontSize > 0 ? Math.round(item.fontSize * 1.15) : 14} />}
      {item.label && <span>{item.label}</span>}
    </>
  );
  // The popup opens right under the strip, starting where its trigger starts.
  const getAnchor = useCallback(() => {
    const t = triggerRef.current?.getBoundingClientRect();
    const s = stripRef.current?.getBoundingClientRect();
    return t && s ? { left: t.left, top: s.bottom } : null;
  }, [stripRef]);
  if (item.kind === 'text') return <span className={cls} style={style}>{inner}</span>;
  if (item.kind === 'popup' && item.popup) {
    return (
      <>
        <button ref={triggerRef} type="button" onClick={() => setOpen(v => !v)} aria-haspopup="dialog" aria-expanded={open}
          className={`${cls} cursor-pointer border-0 bg-transparent p-0`} style={{ ...style, font: 'inherit', ...(item.fontSize > 0 ? { fontSize: item.fontSize } : {}), ...(item.bold ? { fontWeight: 700 } : {}) }}>
          {inner}{item.label && <ChevronDown size={12} aria-hidden style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />}
        </button>
        {open && <ChromePopup popup={item.popup} theme={theme} onClose={() => setOpen(false)} getAnchor={getAnchor} />}
      </>
    );
  }
  if (!item.url) return <span className={cls} style={style}>{inner}</span>;
  const external = /^https?:/i.test(item.url);
  return (
    <a href={item.url} className={`${cls} no-underline hover:underline`} style={style} aria-label={item.label || item.icon}
      {...(external || item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
      {inner}
    </a>
  );
}

/**
 * The thin strip above the header: the classic text / phone / email plus the seller's own items placed in a left, centre
 * and right zone. Colours, fonts and the popup look come from the active theme; the seller can override them.
 */
export function ChromeTopStrip({ bar, fallbackBg, fallbackColor, fontFamily, maxWidth, padX, radius = '12px', displayFont, borderColor, buttonRadius }: {
  bar: TopStripData; fallbackBg: string; fallbackColor: string; fontFamily: string; maxWidth: string; padX: string; radius?: string;
  displayFont?: string; borderColor?: string; buttonRadius?: string;
}) {
  const stripRef = useRef<HTMLDivElement>(null);
  const bg = bar.bg ?? fallbackBg;
  const color = bar.color ?? fallbackColor;
  const theme: ChromeTheme = { bg: fallbackColor, fg: fallbackBg, accent: fallbackBg, accentText: fallbackColor, font: fontFamily, radius, fontDisplay: displayFont, border: borderColor, buttonRadius };
  const by = (z: ChromeZone) => bar.items.filter(i => i.zone === z);
  const left = by('left'), center = by('center'), right = by('right');
  const zone = (items: ChromeItem[]) => items.map(i => <StripItem key={i.id} item={i} color={color} theme={theme} stripRef={stripRef} />);
  const fontPx = bar.fontSize && bar.fontSize > 0 ? bar.fontSize : FONT_PX[bar.size] ?? 12;
  const padY = bar.padY != null && bar.padY >= 0 ? bar.padY : PAD_Y[bar.size] ?? 7;

  return (
    <div ref={stripRef} style={{ background: bg, color, fontFamily, fontSize: fontPx }}>
      <div className="mx-auto flex items-center gap-x-5 gap-y-1" style={{ maxWidth, padding: `${padY}px ${padX}`, flexWrap: 'wrap' }}>
        <div className="flex min-w-0 flex-1 items-center gap-x-4 gap-y-1" style={{ flexWrap: 'wrap', justifyContent: 'flex-start' }}>
          {bar.text && <span className="min-w-0 truncate">{bar.text}</span>}
          {zone(left)}
        </div>
        {center.length > 0 && <div className="flex items-center justify-center gap-x-4 gap-y-1" style={{ flexWrap: 'wrap' }}>{zone(center)}</div>}
        <div className="flex min-w-0 flex-1 items-center justify-end gap-x-4 gap-y-1" style={{ flexWrap: 'wrap' }}>
          {zone(right)}
          {(bar.phone || bar.email) && (
            <span className="hidden shrink-0 items-center gap-4 sm:flex">
              {bar.phone && <a href={`tel:${bar.phone.replace(/[^\d+]/g, '')}`} className="flex items-center gap-1.5 no-underline hover:underline" style={{ color }}><Phone size={12} />{bar.phone}</a>}
              {bar.email && <a href={`mailto:${bar.email}`} className="flex items-center gap-1.5 no-underline hover:underline" style={{ color }}><Mail size={12} />{bar.email}</a>}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
