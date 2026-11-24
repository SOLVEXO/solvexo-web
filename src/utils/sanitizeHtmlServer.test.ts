import { describe, expect, it } from 'vitest';
import { sanitizeHtmlServer as clean } from './sanitizeHtmlServer';

/** What a browser could ever turn into running code or a leaving link. */
function isDangerous(html: string): boolean {
  return /<\s*(script|style|iframe|object|embed|svg|math|link|meta|base|form|noscript|template)\b/i.test(html)
    || /\son[a-z]+\s*=/i.test(html)
    || /javascript\s*:|vbscript\s*:|data\s*:text|expression\s*\(/i.test(html.replace(/&[#a-z0-9]+;?/gi, ''));
}

describe('sanitizeHtmlServer: keeps normal rich text', () => {
  it('keeps headings, paragraphs, lists, emphasis, tables and safe links/images', () => {
    const html = '<h2>Title</h2><p>Hello <strong>world</strong> &amp; <em>friends</em></p><ul><li>One</li><li>Two</li></ul>'
      + '<a href="https://example.com/a?b=1&amp;c=2" target="_blank">link</a><img src="https://cdn.example.com/x.jpg" alt="pic" width="300">'
      + '<table><tr><td colspan="2">cell</td></tr></table>';
    const out = clean(html);
    expect(out).toContain('<h2>Title</h2>');
    expect(out).toContain('<strong>world</strong>');
    expect(out).toContain('&amp;');
    expect(out).toContain('<ul><li>One</li><li>Two</li></ul>');
    expect(out).toContain('href="https://example.com/a?b=1&amp;c=2"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('<img src="https://cdn.example.com/x.jpg" alt="pic" width="300">');
    expect(out).toContain('<td colspan="2">cell</td>');
  });

  it('keeps relative and fragment links, mailto and tel', () => {
    expect(clean('<a href="/collections/new">x</a>')).toContain('href="/collections/new"');
    expect(clean('<a href="#size">x</a>')).toContain('href="#size"');
    expect(clean('<a href="mailto:a@b.co">x</a>')).toContain('href="mailto:a@b.co"');
    expect(clean('<a href="tel:+9230012345">x</a>')).toContain('href="tel:+9230012345"');
  });

  it('closes tags that were left open and ignores closers with no opener', () => {
    expect(clean('<div><p>open')).toBe('<div><p>open</p></div>');
    expect(clean('text</p></div>')).toBe('text');
    expect(clean('<b>bold<i>both</b>after')).toBe('<b>bold<i>both</i></b>after');
  });

  it('handles empty and plain input', () => {
    expect(clean('')).toBe('');
    expect(clean('just text')).toBe('just text');
    expect(clean('a < b and c > d')).toBe('a &lt; b and c &gt; d');
  });
});

describe('sanitizeHtmlServer: removes everything dangerous', () => {
  const corpus = [
    '<script>alert(1)</script>',
    '<SCRIPT SRC=//evil.example/x.js></SCRIPT>',
    '<scr<script>ipt>alert(1)</scr</script>ipt>',
    '<script>alert(1)',
    '<img src=x onerror=alert(1)>',
    '<img src="x" onerror="alert(1)" onload=alert(2)>',
    '<IMG SRC=javascript:alert(1)>',
    '<img src="data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9YWxlcnQoMSk+">',
    '<a href="javascript:alert(1)">x</a>',
    '<a href=" JaVaScRiPt:alert(1)">x</a>',
    '<a href="jav&#x61;script:alert(1)">x</a>',
    '<a href="jav&#97;script&colon;alert(1)">x</a>',
    '<a href="java&Tab;script:alert(1)">x</a>',
    '<a href="java\tscript:alert(1)">x</a>',
    '<a href="&#106;&#97;&#118;&#97;&#115;&#99;&#114;&#105;&#112;&#116;&#58;alert(1)">x</a>',
    '<a href="vbscript:msgbox(1)">x</a>',
    '<a href="data:text/html,<script>alert(1)</script>">x</a>',
    '<svg onload=alert(1)></svg>',
    '<svg><script>alert(1)</script></svg>',
    '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
    '<iframe src="https://evil.example"></iframe>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<object data="x"></object><embed src="x">',
    '<style>body{background:url(javascript:alert(1))}</style>',
    '<p style="background:url(javascript:alert(1))">x</p>',
    '<link rel="stylesheet" href="https://evil.example/x.css">',
    '<meta http-equiv="refresh" content="0;url=https://evil.example">',
    '<base href="https://evil.example/">',
    '<form action="https://evil.example"><input name=x></form>',
    '<div onmouseover="alert(1)">x</div>',
    '<div/onclick=alert(1)>x</div>',
    '<p onclick = "alert(1)">x</p>',
    '<!--><script>alert(1)</script>-->',
    '<!-- --><img src=x onerror=alert(1)>',
    '<![CDATA[<script>alert(1)</script>]]>',
    '<?php echo 1; ?><script>alert(1)</script>',
    '<noscript><p title="</noscript><img src=x onerror=alert(1)>">',
    '<textarea><script>alert(1)</script></textarea>',
    '<a href="x" title="" onfocus=alert(1) autofocus>x</a>',
    '<b title=\'x"onmouseover="alert(1)\'>x</b>',
    '<a href="https://ok.example" href="javascript:alert(1)">x</a>',
    '<a href=javascript:alert(1)>x</a>',
    '<img src=` onerror=alert(1)>',
    '<\u0000script>alert(1)</script>',
    '<<script>alert(1);//<</script>',
  ];

  for (const input of corpus) {
    it(`is safe for ${JSON.stringify(input).slice(0, 70)}`, () => {
      const out = clean(input);
      expect(isDangerous(out), `output was: ${out}`).toBe(false);
    });
  }

  it('shows the harmless text of an unknown tag but never its markup', () => {
    expect(clean('<custom-tag foo="bar">hi</custom-tag>')).toBe('hi');
    expect(clean('<blink>old</blink>')).toBe('old');
  });

  it('removes the CONTENT of script / style, not just the tags', () => {
    expect(clean('a<script>alert(1)</script>b')).toBe('ab');
    expect(clean('a<style>p{color:red}</style>b')).toBe('ab');
  });

  it('turns an img without a usable source into nothing, and never keeps a javascript: source', () => {
    expect(clean('<img onerror=alert(1)>')).toBe('');
    expect(clean('<img src="javascript:alert(1)" alt="x">')).toBe('');
  });

  it('keeps entity text as text (does not decode it into markup)', () => {
    expect(clean('&lt;script&gt;alert(1)&lt;/script&gt;')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('re-quotes attribute values so a quote cannot end the attribute early', () => {
    // "onerror=alert(1)" stays INSIDE the alt text: still one img tag with two attributes, nothing was added.
    const out = clean('<img src="https://a.example/x.jpg" alt=\'he said "hi" onerror=alert(1)\'>');
    expect(out).toBe('<img src="https://a.example/x.jpg" alt="he said &quot;hi&quot; onerror=alert(1)">');
  });
});
