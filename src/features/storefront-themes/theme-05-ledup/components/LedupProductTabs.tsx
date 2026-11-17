import { ChevronDown } from 'lucide-react';
import { renderRichText } from '@/utils/richText';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { healEntities, looksLikeHtml } from '@/utils/healEntities';

/** The seller's own tabs of this product (Product form → Tabs), drawn as LedUp-style accordions under the buy box. */
export function LedupProductTabs({ tabs }: { tabs?: { title: string; content: string }[] }) {
  const rows = (tabs ?? []).filter(x => x.title?.trim() && x.content?.trim());
  if (rows.length === 0) return null;
  return (
    <div className="mt-8 border-t border-stone-200/80">
      {rows.map((tab, i) => {
        const content = healEntities(tab.content);
        return (
          <details key={`${i}-${tab.title}`} className="group border-b border-stone-200/80 py-1" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 text-[17px] font-semibold text-[#4b423b] [&::-webkit-details-marker]:hidden">
              <span>{tab.title}</span>
              <ChevronDown size={18} aria-hidden className="shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <div className="pb-4 text-[15px] leading-relaxed text-[#6b625b] [&_a]:underline [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:text-base [&_h3]:font-semibold [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mb-3 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:ps-6">
              {looksLikeHtml(content)
                ? <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(content) }} />
                : <div>{renderRichText(content)}</div>}
            </div>
          </details>
        );
      })}
    </div>
  );
}
