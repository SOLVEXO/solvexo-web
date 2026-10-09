// Allow-list-free sanitizer for seller-authored "Custom HTML" sections. Parses
// with the browser's inert DOMParser (nothing executes while parsing), strips
// every element/attribute that can run code or leave the page, and returns
// the cleaned markup. The backend rejects the obvious cases on save; this is
// the render-time guarantee.
const BLOCKED_TAGS = ['script', 'iframe', 'object', 'embed', 'link', 'meta', 'base', 'form', 'frame', 'frameset', 'applet', 'noscript', 'template', 'svg', 'math'];
const URL_ATTRS = ['href', 'src', 'srcset', 'action', 'formaction', 'xlink:href', 'poster', 'background', 'data'];

function isSafeUrl(value: string): boolean {
  const v = value.replace(/[\u0000- \u007f]+/g, '').toLowerCase();
  if (v.startsWith('javascript:') || v.startsWith('vbscript:') || v.startsWith('data:')) return false;
  return true;
}

export function sanitizeHtml(input: string): string {
  if (!input || typeof DOMParser === 'undefined') return '';
  const doc = new DOMParser().parseFromString(`<body>${input}</body>`, 'text/html');
  doc.body.querySelectorAll(BLOCKED_TAGS.join(',')).forEach(el => el.remove());
  doc.body.querySelectorAll('*').forEach(el => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on')) { el.removeAttribute(attr.name); continue; }
      if (URL_ATTRS.includes(name) && !isSafeUrl(attr.value)) { el.removeAttribute(attr.name); continue; }
      if (name === 'style' && /expression\s*\(|url\s*\(|@import|behavior\s*:/i.test(attr.value)) el.removeAttribute(attr.name);
    }
    if (el.tagName === 'A' && el.getAttribute('target') === '_blank') el.setAttribute('rel', 'noopener noreferrer');
  });
  return doc.body.innerHTML;
}
