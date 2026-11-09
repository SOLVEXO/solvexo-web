import { Fragment, type CSSProperties, type ReactNode } from 'react';
import { sanitizeHtml } from './sanitizeHtml';

/**
 * A deliberately-scoped "markdown-lite" renderer — **bold**, *italic*, and
 * [link text](url) only. This is the real formatting capability behind the
 * `rich_text` section's paragraph blocks (previously plain, unformatted
 * text — a real, disclosed gap: the section is literally called "Rich Text"
 * but had none). No toolbar/WYSIWYG editor was built for this pass — a
 * seller types the syntax directly into the existing textarea (same
 * `**bold**` convention as Slack/GitHub/Markdown generally); the field's
 * `hint` text says so. A toolbar that inserts the syntax on click would be a
 * pure editor-UX addition on top of this, not a capability change — left as
 * a fast, mechanical follow-up.
 *
 * Security note — this is the reason it's regex-based rather than an HTML
 * editor: `renderRichText` NEVER touches `dangerouslySetInnerHTML` and never
 * interprets its input as markup. It only ever returns real React elements
 * built from three individually-matched, individually-validated primitives.
 * A value can't smuggle executable HTML through this path no matter what
 * sends it — including a request that bypasses the editor UI entirely and
 * hits the API directly — because HTML syntax in the stored string is never
 * given any special meaning; only `**`/`*`/`[...](...)` are.
 */
const TOKEN_RE = /(\*\*.+?\*\*|\*.+?\*|\[[^\]]+\]\([^)]+\))/g;

function isSafeHttpUrl(url: string): boolean {
  try {
    // Absolute URLs resolve as-is; a relative one is resolved against a
    // placeholder base purely so `URL` can parse it — the base itself is
    // never used or exposed.
    const u = new URL(url, 'https://placeholder.invalid');
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

const HAS_HTML = /<\/?(p|h[1-6]|ul|ol|li|br|strong|b|em|i|a|div|span)\b[^>]*>/i;

/**
 * Seller text for a section (Multirow, Image with text, Columns, Rich text paragraphs). Two kinds of stored value:
 *  - HTML from the rich text editor (paragraphs, headings, lists, bold/italic, links) — sanitised here before it is drawn;
 *  - older plain / markdown-lite text — blank lines become paragraphs and single new lines become line breaks.
 * Always renders a <div>, so it can hold block elements; the caller's colours/fonts are inherited (`headingColor` /
 * `headingFont` style the headings inside).
 */
export function RichContent({ text, className = '', style, headingColor, headingFont }: {
  text: string | undefined | null; className?: string; style?: CSSProperties; headingColor?: string; headingFont?: string;
}) {
  if (!text || !text.trim()) return null;
  const vars = { ...style, ...(headingColor ? { '--rc-heading': headingColor } : {}), ...(headingFont ? { '--rc-heading-font': headingFont } : {}) } as CSSProperties;
  if (HAS_HTML.test(text)) {
    return <div className={`rc-rich ${className}`} style={vars} dangerouslySetInnerHTML={{ __html: sanitizeHtml(text) }} />;
  }
  const paragraphs = text.split(/\r?\n[ \t]*\r?\n/).filter(p => p.trim());
  return (
    <div className={`rc-rich ${className}`} style={vars}>
      {paragraphs.map((p, i) => (
        <p key={i}>{p.split(/\r?\n/).map((line, j) => <Fragment key={j}>{j > 0 && <br />}{renderRichText(line)}</Fragment>)}</p>
      ))}
    </div>
  );
}

export function renderRichText(text: string | undefined | null): ReactNode {
  if (!text) return null;
  return text.split(TOKEN_RE).map((part, i) => {
    if (!part) return null;
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
    if (linkMatch) {
      const [, label, url] = linkMatch;
      // An unsafe scheme (javascript:, data:, etc.) drops the link and
      // falls back to plain text — never rejects the whole render, since a
      // seller's typo shouldn't blank out an entire paragraph.
      return isSafeHttpUrl(url)
        ? <a key={i} href={url} target="_blank" rel="noopener noreferrer">{label}</a>
        : <span key={i}>{label}</span>;
    }
    return part;
  });
}
