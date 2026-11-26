import type { CSSProperties } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import {
  CONTENT_ANCHOR_AREA, CONTENT_SIZE_CLASS, CONTENT_WIDTH_CLASS, contentItemKey,
  type ContentItem,
} from './contentItems';

type ResolvedLink = { to?: string; href?: string; newTab?: boolean } | null;
type ResolveLink = (link: unknown) => ResolvedLink;

interface Props {
  items?: ContentItem[] | null;
  /** Section colour for text (already resolved for the section's colour scheme). */
  ink: string;
  displayFont?: string;
  bodyFont?: string;
  /** Editor only: draw a dashed outline so the seller can see what is selected. */
  selectable?: boolean;
}

const isEmpty = (item: ContentItem): boolean => {
  if (item.kind === 'image') return !item.imageUrl;
  return !String(item.text ?? '').trim();
};

/**
 * Draws `section.settings.contentItems` over ANY section.
 *
 * Desktop: a 3x3 grid — an item's `anchor` decides which cell it lands in, and
 * several items in the same cell stack in the order the seller chose.
 * Phone: three columns would be squeezed into 360px, so the same items are
 * drawn as one column in the same order instead.
 */
export function SectionContentLayer({ items, ink, displayFont, bodyFont, selectable }: Props) {
  const { resolveLink } = useStorefront();
  const resolve = resolveLink as unknown as ResolveLink;
  const list = (items ?? []).filter(item => item && !isEmpty(item));
  if (!list.length) return null;

  const itemStyle = (item: ContentItem): CSSProperties => ({
    color: item.color || ink,
    textAlign: item.align ?? 'left',
    fontFamily: item.kind === 'heading' || item.kind === 'subheading' ? displayFont : bodyFont,
  });

  const cell = (item: ContentItem, index: number) => {
    const area = CONTENT_ANCHOR_AREA[item.anchor ?? 'middle-center'] ?? CONTENT_ANCHOR_AREA['middle-center'];
    const align = item.align ?? 'left';
    const justify = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
    // Free nudge on top of the anchor. Desktop only (`md:`), so a phone's
    // single column can never be pushed off screen.
    const offset = {
      '--sx-ox': `${item.offsetX ?? 0}px`,
      '--sx-oy': `${item.offsetY ?? 0}px`,
    } as CSSProperties;
    return (
      <div
        key={`c-${contentItemKey(item, index)}`}
        className={`flex md:translate-x-[var(--sx-ox)] md:translate-y-[var(--sx-oy)] ${CONTENT_WIDTH_CLASS[item.width ?? 'normal'] ?? CONTENT_WIDTH_CLASS.normal}`}
        style={{ gridRow: area.row, gridColumn: area.column, justifyContent: justify, ...offset }}
      >
        <div className="w-full" style={{ maxWidth: '100%' }}>{draw(item, itemStyle(item), resolve, selectable)}</div>
      </div>
    );
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] p-4 md:p-8" data-sx-content-layer>
      {/* Desktop / tablet: the nine anchors */}
      <div
        className="hidden h-full w-full gap-3 md:grid"
        style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gridTemplateRows: 'repeat(3, minmax(0, 1fr))' }}
      >
        {list.map(cell)}
      </div>
      {/* Phone: one column, same order */}
      <div className="flex h-full w-full flex-col gap-3 md:hidden">
        {list.map((item, i) => (
          <div
            key={`m-${contentItemKey(item, i)}`}
            className="flex"
            style={{ justifyContent: item.align === 'center' ? 'center' : item.align === 'right' ? 'flex-end' : 'flex-start' }}
          >
            <div className={CONTENT_WIDTH_CLASS[item.width ?? 'normal'] ?? CONTENT_WIDTH_CLASS.normal}>
              {draw(item, itemStyle(item), resolve, selectable)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function draw(item: ContentItem, style: CSSProperties, resolveLink: ResolveLink, selectable?: boolean) {
  const outline = selectable ? 'outline-dashed outline-1 outline-offset-4 outline-brand-orange/60' : '';
  const cls = `${CONTENT_SIZE_CLASS[item.size ?? 'md'] ?? CONTENT_SIZE_CLASS.md} ${outline}`;
  const text = String(item.text ?? '');
  switch (item.kind) {
    case 'heading':
      return <h2 className={cls} style={style}>{text}</h2>;
    case 'subheading':
      return <h3 className={cls} style={{ ...style, fontWeight: 500 }}>{text}</h3>;
    case 'button': {
      const link = resolveLink(item.link);
      const base = `pointer-events-auto inline-block rounded-full px-6 py-3 text-[15px] font-medium no-underline ${outline}`;
      if (link?.to) return <a className={base} href={link.to} style={style}>{text}</a>;
      if (link?.href) {
        return (
          <a
            className={base}
            href={link.href}
            target={link.newTab ? '_blank' : undefined}
            rel={link.newTab ? 'noopener noreferrer' : undefined}
            style={style}
          >
            {text}
          </a>
        );
      }
      return <span className={base} style={style}>{text}</span>;
    }
    case 'image':
      return item.imageUrl ? (
        <img src={item.imageUrl} alt={text} className="block h-auto w-full" style={{ maxHeight: 420, objectFit: 'contain' }} />
      ) : null;
    default:
      return <p className={cls} style={style}>{text}</p>;
  }
}