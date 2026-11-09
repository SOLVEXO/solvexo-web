import { useEffect, useRef } from 'react';
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Pilcrow, Plus, Trash2, Unlink } from 'lucide-react';

export interface ProductTabInput { title: string; content: string }

const TOOLS = [
  { label: 'Paragraph', Icon: Pilcrow, command: 'formatBlock', arg: '<p>' },
  { label: 'Heading', Icon: Heading2, command: 'formatBlock', arg: '<h2>' },
  { label: 'Subheading', Icon: Heading3, command: 'formatBlock', arg: '<h3>' },
  { label: 'Bold', Icon: Bold, command: 'bold' },
  { label: 'Italic', Icon: Italic, command: 'italic' },
  { label: 'Bulleted list', Icon: List, command: 'insertUnorderedList' },
  { label: 'Numbered list', Icon: ListOrdered, command: 'insertOrderedList' },
  { label: 'Add link', Icon: Link2, command: 'createLink' },
  { label: 'Remove link', Icon: Unlink, command: 'unlink' },
];

const HAS_HTML = /<\/?[a-z][\s\S]*>/i;
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/** Older descriptions are plain text: keep their line breaks when they open in the editor. */
export function toEditorHtml(value: string): string {
  return HAS_HTML.test(value) ? value : escapeHtml(value).replace(/\r?\n/g, '<br>');
}

const PASTE_KEEP: Record<string, string> = { P: 'p', H1: 'h2', H2: 'h2', H3: 'h3', H4: 'h3', H5: 'h3', H6: 'h3', UL: 'ul', OL: 'ol', LI: 'li', STRONG: 'strong', B: 'strong', EM: 'em', I: 'em', BR: 'br', A: 'a' };
const BLOCK_TAGS = new Set(['DIV', 'SECTION', 'ARTICLE', 'BLOCKQUOTE', 'TABLE', 'TR']);

/** Pasted content keeps only paragraphs, headings, bold/italic, lists, links and line breaks (no colours, fonts or sizes copied from another site). */
export function cleanPastedHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    if (['SCRIPT', 'STYLE', 'META', 'LINK', 'TITLE'].includes(el.tagName)) return '';
    const inner = Array.from(el.childNodes).map(walk).join('');
    const tag = PASTE_KEEP[el.tagName];
    if (tag === 'br') return '<br>';
    if (tag === 'a') {
      const href = el.getAttribute('href') ?? '';
      return /^https?:\/\//i.test(href) ? `<a href="${href.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">${inner}</a>` : inner;
    }
    if (tag) return inner.trim() || tag === 'li' ? `<${tag}>${inner}</${tag}>` : '';
    return BLOCK_TAGS.has(el.tagName) && inner.trim() ? `<p>${inner}</p>` : inner;
  };
  return walk(doc.body).replace(/<p>\s*<\/p>/g, '');
}

const BOX = 'border border-bone rounded-lg bg-white focus-within:border-brand-orange/50 focus-within:ring-2 focus-within:ring-brand-orange/20';
const CONTENT = 'overflow-y-auto px-3 py-2 text-[13px] text-charcoal outline-none [&_h2]:text-base [&_h2]:font-semibold [&_h2]:my-2 [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:my-2 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand-orange [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-slate';

/** Rich text field (headings, bold, italic, lists, links). The storefront sanitises the HTML again when it draws it. */
export function ProductRichEditor({ value, onChange, placeholder, minHeight = 160, label }: { value: string; onChange: (html: string) => void; placeholder?: string; minHeight?: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    const next = toEditorHtml(value);
    if (el && el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  const run = (command: string, arg?: string) => {
    let a = arg;
    if (command === 'createLink') {
      const url = window.prompt('Link URL (https://…)');
      if (!url) return;
      a = url.trim();
    }
    const el = ref.current;
    el?.focus();
    document.execCommand(command, false, a);
    if (el) onChange(el.innerHTML);
  };
  const read = () => { const el = ref.current; if (!el) return; onChange(el.textContent?.trim() || el.querySelector('img') ? el.innerHTML : ''); };
  // Enter makes a new <p> (not a <div>), like a normal document.
  const onFocus = () => { try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch { /* old browser: keeps <div> */ } };
  const onPaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');
    if (!html && !text) return;
    e.preventDefault();
    const clean = html
      ? cleanPastedHtml(html)
      : text.split(/\r?\n{2,}/).map(p => `<p>${p.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\r?\n/g, '<br>')}</p>`).join('');
    document.execCommand('insertHTML', false, clean);
    read();
  };

  return (
    <div className={BOX}>
      <div className="flex flex-wrap items-center gap-0.5 px-1.5 py-1 border-b border-bone">
        {TOOLS.map(({ label: l, Icon, command, arg }) => (
          <button key={l} type="button" aria-label={l} title={l} onMouseDown={e => e.preventDefault()} onClick={() => run(command, arg)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-charcoal hover:bg-mist">
            <Icon size={14} />
          </button>
        ))}
      </div>
      <div ref={ref} role="textbox" aria-multiline="true" aria-label={label} tabIndex={0} contentEditable suppressContentEditableWarning
        data-placeholder={placeholder} onInput={read} onBlur={read} onFocus={onFocus} onPaste={onPaste} className={CONTENT} style={{ minHeight }} />
    </div>
  );
}

const MAX_TABS = 6;

/** Extra tabs shown next to Description on the product page (title + rich content). */
export function ProductTabsEditor({ tabs, onChange }: { tabs: ProductTabInput[]; onChange: (tabs: ProductTabInput[]) => void }) {
  const patch = (i: number, p: Partial<ProductTabInput>) => onChange(tabs.map((t, j) => (j === i ? { ...t, ...p } : t)));
  return (
    <div className="flex flex-col gap-3">
      {tabs.map((tab, i) => (
        <div key={i} className="border border-bone rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <input value={tab.title} maxLength={40} onChange={e => patch(i, { title: e.target.value })} placeholder="Tab title, e.g. Size guide" aria-label={`Tab ${i + 1} title`}
              className="flex-1 min-w-0 border border-bone rounded-lg px-3 py-2 text-[13px] outline-none focus:border-brand-orange/50" />
            <button type="button" aria-label={`Remove tab ${i + 1}`} onClick={() => onChange(tabs.filter((_, j) => j !== i))}
              className="w-8 h-8 flex items-center justify-center rounded-md border-none bg-transparent cursor-pointer text-slate hover:bg-mist"><Trash2 size={15} /></button>
          </div>
          <ProductRichEditor value={tab.content} onChange={html => patch(i, { content: html })} label={`Tab ${i + 1} content`} minHeight={90} placeholder="What should this tab say?" />
        </div>
      ))}
      {tabs.length < MAX_TABS && (
        <button type="button" onClick={() => onChange([...tabs, { title: '', content: '' }])}
          className="self-start inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bone bg-white text-[13px] font-medium cursor-pointer hover:bg-mist">
          <Plus size={14} /> Add tab
        </button>
      )}
      <p className="m-0 text-[12px] text-slate">Tabs for every product (Delivery, Shipping &amp; Return) are set once in Customize → Product page → Add block → Collapsible tab → "Show as a tab".</p>
    </div>
  );
}
