import type { ReactNode } from 'react';

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
