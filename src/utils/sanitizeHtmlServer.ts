/**
 * Server-side HTML sanitizer (no DOM available). Used by `sanitizeHtml` when there is no `DOMParser`, i.e. while a storefront
 * page is rendered on the server and the result is cached for every visitor.
 *
 * Design: an ALLOW-LIST that REBUILDS the markup. The input is tokenized, and only a fixed set of tags with a fixed set of
 * attributes is written out, always from scratch (attribute values re-quoted and re-escaped, URLs validated after decoding
 * entities). Everything else - scripts, styles, event handlers, unknown tags, comments - is dropped or shown as plain text.
 * Because nothing from the input is copied through verbatim, malformed or obfuscated HTML cannot smuggle anything in.
 */
const VOID_TAGS = new Set(['br', 'hr', 'img']);
/** tag -> attributes that may be kept. */
const ALLOWED: Record<string, string[]> = {
  p: [], br: [], hr: [], strong: [], b: [], em: [], i: [], u: [], s: [], small: [], sub: [], sup: [], code: [], pre: [], blockquote: [],
  h1: [], h2: [], h3: [], h4: [], h5: [], h6: [], ul: [], ol: [], li: [], span: [], div: [],
  table: [], thead: [], tbody: [], tfoot: [], tr: [], th: ['colspan', 'rowspan'], td: ['colspan', 'rowspan'],
  a: ['href', 'title', 'target'], img: ['src', 'alt', 'title', 'width', 'height'],
};
/** Content of these elements is dropped completely, not shown as text. */
const DROP_WITH_CONTENT = /<(script|style|iframe|object|embed|noscript|template|svg|math|textarea|title|head)\b[\s\S]*?(?:<\/\1\s*>|$)/gi;
const NAMED_ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', tab: '\t', newline: '\n', nbsp: ' ', lpar: '(', rpar: ')' };
/** Control, space and invisible characters a browser ignores while reading a URL scheme (built from char codes on purpose). */
const INVISIBLE = new RegExp('[' + [[0,32],[127,159],[8203,8207],[8232,8233],[65279,65279]].map(([a, b]) => String.fromCharCode(a) + '-' + String.fromCharCode(b)).join('') + ']+', 'g');

function decodeEntities(value: string): string {
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z][a-z0-9]*);?/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1]?.toLowerCase() === 'x' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? whole;
  });
}

/** Text between tags: `<` `>` always escaped, `&` kept only when it already starts a valid entity. */
function escapeText(text: string): string {
  return text.replace(/&(?!(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)/gi, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** A URL a page may link to or show: http(s), mailto, tel, or a relative / fragment link. Judged AFTER decoding entities. */
function safeUrl(raw: string, allowMailTel: boolean): string | null {
  const decoded = decodeEntities(raw).replace(INVISIBLE, '');
  if (!decoded) return null;
  if (/^(?:https?:)?\/\//i.test(decoded) || /^https?:/i.test(decoded)) return decoded;
  if (allowMailTel && /^(?:mailto|tel):/i.test(decoded)) return decoded;
  // No scheme at all (relative, absolute path, fragment, query): the first ":" must not appear before a "/", "?" or "#".
  if (/^[^:/?#]*(?:[/?#]|$)/.test(decoded)) return decoded;
  return null;
}

function safeNumber(raw: string): string | null {
  const v = decodeEntities(raw).trim();
  return /^\d{1,5}%?$/.test(v) ? v : null;
}

/** Reads `name=value` pairs from the inside of a start tag. */
function parseAttrs(source: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  const re = /([^\s"'<>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(source)) !== null && out.length < 24) out.push([m[1].toLowerCase(), m[2] ?? m[3] ?? m[4] ?? '']);
  return out;
}

/** The attribute text to write for this tag, or null when the tag itself must be dropped (an image with no usable source). */
function cleanAttrs(tag: string, attrs: Array<[string, string]>): string | null {
  const allowed = ALLOWED[tag];
  const kept = new Map<string, string>();
  for (const [name, raw] of attrs) {
    if (!allowed.includes(name) || kept.has(name)) continue;
    let value: string | null;
    if (name === 'href') value = safeUrl(raw, true);
    else if (name === 'src') value = safeUrl(raw, false);
    else if (name === 'target') value = decodeEntities(raw).trim().toLowerCase() === '_blank' ? '_blank' : null;
    else if (name === 'width' || name === 'height' || name === 'colspan' || name === 'rowspan') value = safeNumber(raw);
    else value = decodeEntities(raw).slice(0, 300);
    if (value !== null) kept.set(name, value);
  }
  if (tag === 'img' && !kept.has('src')) return null;
  if (tag === 'a' && kept.get('target') === '_blank') kept.set('rel', 'noopener noreferrer');
  return [...kept].map(([k, v]) => ` ${k}="${escapeAttr(v)}"`).join('');
}

export function sanitizeHtmlServer(input: string): string {
  if (!input) return '';
  const source = input
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?(?:\]\]>|$)/g, '')
    .replace(/<![^>]*>?/g, '')
    .replace(/<\?[\s\S]*?(?:\?>|$)/g, '')
    .replace(DROP_WITH_CONTENT, '');

  const out: string[] = [];
  const open: string[] = [];
  const tagRe = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(source)) !== null) {
    out.push(escapeText(source.slice(last, m.index)));
    last = m.index + m[0].length;
    const closing = m[1] === '/';
    const tag = m[2].toLowerCase();
    if (!(tag in ALLOWED)) continue; // unknown / dangerous tag: dropped, its text stays as plain text
    if (closing) {
      const at = open.lastIndexOf(tag);
      if (at < 0) continue; // a closer with no opener
      while (open.length > at) out.push(`</${open.pop()}>`);
      continue;
    }
    const attrs = cleanAttrs(tag, parseAttrs(m[3]));
    if (attrs === null) continue;
    out.push(`<${tag}${attrs}>`);
    if (!VOID_TAGS.has(tag)) open.push(tag);
  }
  out.push(escapeText(source.slice(last)));
  while (open.length) out.push(`</${open.pop()}>`);
  return out.join('');
}
