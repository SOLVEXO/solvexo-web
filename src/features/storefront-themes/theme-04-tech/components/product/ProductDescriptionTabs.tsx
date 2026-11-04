import { useId, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { renderRichText } from '@/utils/richText';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { baseTheme as t } from '../../theme.base';

export interface DescriptionTab { key: string; title: string; content: string; html: boolean }

const HAS_HTML = /<\/?[a-z][\s\S]*>/i;

const RICH_CSS = `
.tx-rich{font-size:14px;line-height:1.75}
.tx-rich h1,.tx-rich h2,.tx-rich h3{margin:18px 0 6px;font-weight:600;line-height:1.3;color:inherit}
.tx-rich h2{font-size:20px}.tx-rich h3{font-size:17px}
.tx-rich p{margin:0 0 10px}
.tx-rich ul,.tx-rich ol{margin:0 0 10px;padding-inline-start:22px}
.tx-rich ul{list-style:disc}.tx-rich ol{list-style:decimal}
.tx-rich a{text-decoration:underline}.tx-rich img{max-width:100%;height:auto}
`;

/** Seller-written text: HTML from the rich editor is cleaned first; older plain text keeps its line breaks. */
function Body({ content, html }: { content: string; html: boolean }): ReactNode {
  if (html && HAS_HTML.test(content)) return <div className="tx-rich" dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />;
  if (html) return <div className="tx-rich">{renderRichText(content)}</div>;
  return <div className="tx-rich" style={{ whiteSpace: 'pre-line' }}>{content}</div>;
}

/** Description, the product's own tabs and the store-wide tabs, as one tab bar (Shopify's product tabs). */
export function ProductDescriptionTabs({ tabs, heading }: { tabs: DescriptionTab[]; heading?: string }) {
  const { t: tr } = useTranslation('storefront');
  const [active, setActive] = useState(tabs[0]?.key ?? '');
  const base = useId();
  if (tabs.length === 0) return null;
  const current = tabs.find(x => x.key === active) ?? tabs[0];
  const color = { color: t.colors.inkMuted };

  if (tabs.length === 1) {
    return (
      <div style={{ fontFamily: t.fonts.body, ...color }}>
        <style>{RICH_CSS}</style>
        {heading?.trim() && <h2 className="m-0 mb-3 text-lg font-semibold" style={{ color: t.colors.ink }}>{heading}</h2>}
        <Body content={current.content} html={current.html} />
      </div>
    );
  }

  const move = (e: KeyboardEvent, i: number) => {
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (!dir) return;
    const isRtl = document.documentElement.dir === 'rtl';
    const next = tabs[(i + (isRtl ? -dir : dir) + tabs.length) % tabs.length];
    setActive(next.key);
    document.getElementById(`${base}-${next.key}`)?.focus();
  };

  return (
    <div style={{ fontFamily: t.fonts.body }}>
      <style>{RICH_CSS}</style>
      <div role="tablist" aria-label={tr('product.details', 'Product details')} className="mb-4 flex flex-wrap gap-x-6 gap-y-1" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
        {tabs.map((tab, i) => {
          const on = tab.key === current.key;
          return (
            <button key={tab.key} id={`${base}-${tab.key}`} role="tab" type="button" aria-selected={on} aria-controls={`${base}-panel`} tabIndex={on ? 0 : -1}
              onClick={() => setActive(tab.key)} onKeyDown={e => move(e, i)}
              className="cursor-pointer border-0 bg-transparent px-0 py-2 text-base font-semibold"
              style={{ fontFamily: t.fonts.display, color: on ? t.colors.accent : t.colors.ink, borderBottom: `2px solid ${on ? t.colors.accent : 'transparent'}`, marginBottom: -1 }}>
              {tab.title}
            </button>
          );
        })}
      </div>
      <div id={`${base}-panel`} role="tabpanel" aria-labelledby={`${base}-${current.key}`} style={color}>
        <Body content={current.content} html={current.html} />
      </div>
    </div>
  );
}
