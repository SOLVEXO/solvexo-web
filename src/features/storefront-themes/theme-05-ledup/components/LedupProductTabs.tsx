import { ChevronDown } from 'lucide-react';
import { renderRichText } from '@/utils/richText';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { healEntities, looksLikeHtml } from '@/utils/healEntities';

/** A tab the seller set once for the whole store (Customize → Product page → Collapsible tab): plain text, shown on every product. */
export interface StoreWideTab { key: string; title: string; content: string; open?: boolean }

const BODY = 'pb-4 text-[15px] leading-relaxed text-[#6b625b] [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-6';

function Item({ title, open, children }: { title: string; open: boolean; children: React.ReactNode }) {
  return (
    <details className="group border-b border-stone-200/80 py-1" open={open}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[17px] font-semibold text-[#4b423b] [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <ChevronDown size={18} aria-hidden className="shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className={BODY}>{children}</div>
    </details>
  );
}

/** The product's own tabs (Product form → Tabs) first, then the store-wide tabs, as LedUp-style accordions under the buy box. */
export function LedupProductTabs({ tabs, shared }: { tabs?: { title: string; content: string }[]; shared?: StoreWideTab[] }) {
  const own = (tabs ?? []).filter(x => x.title?.trim() && x.content?.trim());
  const store = (shared ?? []).filter(x => x.title?.trim() && x.content?.trim());
  if (own.length === 0 && store.length === 0) return null;
  return (
    <div className="mt-8 border-t border-stone-200/80">
      {own.map((tab, i) => {
        const content = healEntities(tab.content);
        return (
          <Item key={`own-${i}-${tab.title}`} title={tab.title} open={i === 0}>
            {looksLikeHtml(content)
              ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
              : <div>{renderRichText(content)}</div>}
          </Item>
        );
      })}
      {store.map((tab, i) => (
        <Item key={`store-${tab.key}`} title={tab.title} open={own.length === 0 ? (tab.open ?? i === 0) : tab.open === true}>
          <div style={{ whiteSpace: 'pre-line' }}>{tab.content}</div>
        </Item>
      ))}
    </div>
  );
}
