/** Repairs text that an older rich-text editor escaped AGAIN on every keystroke:
 *  "Hi&amp;nbsp;" -> "Hi&nbsp;", "a&amp;amp;amp;nbsp;" -> "a&nbsp;", "&amp;amp;amp;" -> "&amp;".
 *  Healthy HTML (a single "&amp;", "&nbsp;", real tags) is left exactly as it is. */
export function healEntities(s: string): string {
  if (!s || !s.includes('&amp;')) return s;
  return s
    .replace(/&(?:amp;)+(?=(?:nbsp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi, '&')
    .replace(/&(?:amp;){2,}/g, '&amp;');
}

const HTML_TAG = /<\/?[a-z][\s\S]*>/i;
const HTML_ENTITY = /&(?:[a-z]+|#\d+|#x[0-9a-f]+);/i;
/** True when seller text is HTML written by the rich editor: it has tags, or only entities such as &nbsp; (a typed space). Older plain text is neither. */
export function looksLikeHtml(s: string): boolean {
  return HTML_TAG.test(s) || HTML_ENTITY.test(s);
}
