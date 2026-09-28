/* Shopify Email-style block design for campaigns: a campaign's email is an
 * ordered list of sections (blocks) plus global styles. The editor edits this
 * JSON (saved on the campaign as `design`), and `renderEmailDesign` turns it
 * into email-client-safe HTML (tables + inline styles — Gmail/Outlook strip
 * <style> and flexbox) that's saved as the campaign's `message`. Merge tags
 * ({{customerName}}, {{storeName}}) stay in the HTML and are filled per
 * recipient server-side. */

export type BlockAlign = 'left' | 'center' | 'right';

export type EmailBlock =
  | { id: string; type: 'header'; logoUrl: string | null; logoWidth: number; showStoreName: boolean; align: BlockAlign; background: string }
  | { id: string; type: 'heading'; text: string; size: number; align: BlockAlign; color: string }
  | { id: string; type: 'text'; html: string; align: BlockAlign }
  | { id: string; type: 'image'; url: string | null; alt: string; link: string; width: number }
  | { id: string; type: 'button'; label: string; link: string; align: BlockAlign; background: string; color: string; fullWidth: boolean }
  | { id: string; type: 'products'; items: EmailProductItem[]; columns: 1 | 2 | 3; buttonLabel: string; showPrice: boolean }
  | { id: string; type: 'imageText'; url: string | null; html: string; imagePosition: 'left' | 'right'; buttonLabel: string; link: string }
  | { id: string; type: 'discount'; code: string; title: string; description: string }
  | { id: string; type: 'divider'; color: string; thickness: number }
  | { id: string; type: 'spacer'; height: number }
  | { id: string; type: 'social'; links: { network: SocialNetwork; url: string }[]; align: BlockAlign }
  // Automations only: filled at send time with the product the email is
  // about (back in stock / price drop) — see MarketingAutomationsService.
  | { id: string; type: 'dynamicProduct'; buttonLabel: string; showPrice: boolean; align: BlockAlign };

export type EmailBlockType = EmailBlock['type'];
export type SocialNetwork = 'instagram' | 'facebook' | 'x' | 'tiktok' | 'youtube' | 'pinterest' | 'linkedin';

export interface EmailProductItem {
  productId: string;
  name: string;
  imageUrl: string | null;
  price: number | null;
  currency: string | null;
}

export interface EmailDesignStyles {
  background: string;       // around the email
  contentBackground: string;
  textColor: string;
  accentColor: string;      // buttons, links, discount border
  fontFamily: string;
  borderRadius: number;     // buttons + images
}

export interface EmailDesign {
  version: 1;
  previewText: string;
  styles: EmailDesignStyles;
  blocks: EmailBlock[];
}

export interface RenderContext {
  storeName: string;
  storeUrl: string | null;
}

export const FONT_OPTIONS: { label: string; value: string }[] = [
  { label: 'Helvetica / Arial', value: "Helvetica, Arial, sans-serif" },
  { label: 'Georgia (serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Trebuchet', value: "'Trebuchet MS', Helvetica, sans-serif" },
  { label: 'Verdana', value: "Verdana, Geneva, sans-serif" },
  { label: 'Courier (mono)', value: "'Courier New', Courier, monospace" },
];

export const BLOCK_LIBRARY: { type: EmailBlockType; label: string; description: string }[] = [
  { type: 'header',    label: 'Header',           description: 'Logo or store name' },
  { type: 'heading',   label: 'Heading',          description: 'Large title text' },
  { type: 'text',      label: 'Text',             description: 'Paragraphs, links, lists' },
  { type: 'image',     label: 'Image',            description: 'Full-width picture' },
  { type: 'button',    label: 'Button',           description: 'Call to action' },
  { type: 'products',  label: 'Products',         description: 'Show 1–6 of your products' },
  { type: 'imageText', label: 'Image with text',  description: 'Picture beside text' },
  { type: 'discount',  label: 'Discount',         description: 'Highlight a coupon code' },
  { type: 'divider',   label: 'Divider',          description: 'Horizontal line' },
  { type: 'spacer',    label: 'Spacer',           description: 'Empty space' },
  { type: 'social',    label: 'Social links',     description: 'Instagram, Facebook…' },
  { type: 'dynamicProduct', label: 'Dynamic product', description: 'The product this email is about' },
];

/** Blocks that only make sense in a given kind of email. */
export const AUTOMATION_ONLY_BLOCKS: EmailBlockType[] = ['dynamicProduct'];

export function newBlockId(): string {
  return `b_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
}

export function createBlock(type: EmailBlockType, styles: EmailDesignStyles): EmailBlock {
  const id = newBlockId();
  switch (type) {
    case 'header':    return { id, type, logoUrl: null, logoWidth: 140, showStoreName: true, align: 'center', background: styles.contentBackground };
    case 'heading':   return { id, type, text: 'Your headline here', size: 28, align: 'center', color: styles.textColor };
    case 'text':      return { id, type, html: '<p>Hi {{customerName}},</p><p>Write your message here.</p>', align: 'left' };
    case 'image':     return { id, type, url: null, alt: '', link: '', width: 100 };
    case 'button':    return { id, type, label: 'Shop now', link: '', align: 'center', background: styles.accentColor, color: '#ffffff', fullWidth: false };
    case 'products':  return { id, type, items: [], columns: 2, buttonLabel: 'Shop now', showPrice: true };
    case 'imageText': return { id, type, url: null, html: '<p><strong>Tell the story</strong></p><p>Describe a product or collection.</p>', imagePosition: 'left', buttonLabel: 'Learn more', link: '' };
    case 'discount':  return { id, type, code: 'SAVE10', title: 'A little something for you', description: 'Use this code at checkout.' };
    case 'divider':   return { id, type, color: '#e5e2da', thickness: 1 };
    case 'spacer':    return { id, type, height: 24 };
    case 'social':    return { id, type, links: [{ network: 'instagram', url: '' }, { network: 'facebook', url: '' }], align: 'center' };
    case 'dynamicProduct': return { id, type, buttonLabel: 'Shop now', showPrice: true, align: 'center' };
  }
}

export const DEFAULT_STYLES: EmailDesignStyles = {
  background: '#f4f3ef',
  contentBackground: '#ffffff',
  textColor: '#2b2a27',
  accentColor: '#141413',
  fontFamily: FONT_OPTIONS[0].value,
  borderRadius: 6,
};

export function defaultDesign(): EmailDesign {
  const styles = { ...DEFAULT_STYLES };
  return {
    version: 1,
    previewText: '',
    styles,
    blocks: [
      createBlock('header', styles),
      createBlock('heading', styles),
      createBlock('text', styles),
      createBlock('button', styles),
    ],
  };
}

/** Ready-made starting points, like Shopify Email's template gallery. */
export function templateDesign(id: string, storeName: string): { subject: string; design: EmailDesign } {
  const styles = { ...DEFAULT_STYLES };
  const b = (type: EmailBlockType, patch: Partial<EmailBlock> = {}) => ({ ...createBlock(type, styles), ...patch }) as EmailBlock;
  const wrap = (subject: string, previewText: string, blocks: EmailBlock[], stylePatch: Partial<EmailDesignStyles> = {}) =>
    ({ subject, design: { version: 1 as const, previewText, styles: { ...styles, ...stylePatch }, blocks } });

  switch (id) {
    case 'sale':
      return wrap(`${storeName} sale: up to 30% off`, 'Our biggest sale of the season starts now.', [
        b('header'),
        b('image'),
        b('heading', { text: 'Up to 30% off everything' } as Partial<EmailBlock>),
        b('text', { html: '<p>Hi {{customerName}},</p><p>For the next 3 days, save on your favourites across {{storeName}}. Once they\'re gone, they\'re gone.</p>', align: 'center' } as Partial<EmailBlock>),
        b('discount', { code: 'SAVE30', title: 'Save 30%', description: 'Enter this code at checkout.' } as Partial<EmailBlock>),
        b('button', { label: 'Shop the sale' } as Partial<EmailBlock>),
        b('products'),
      ], { accentColor: '#c2410c' });
    case 'new-arrivals':
      return wrap('Just landed', 'Be the first to see what\'s new.', [
        b('header'),
        b('heading', { text: 'New arrivals are here' } as Partial<EmailBlock>),
        b('text', { html: '<p>Hi {{customerName}},</p><p>Fresh pieces just dropped at {{storeName}} — take a look before they sell out.</p>', align: 'center' } as Partial<EmailBlock>),
        b('products', { columns: 2 } as Partial<EmailBlock>),
        b('button', { label: 'See everything new' } as Partial<EmailBlock>),
      ]);
    case 'newsletter':
      return wrap(`What's new at ${storeName}`, 'Your monthly round-up.', [
        b('header'),
        b('heading', { text: 'This month at {{storeName}}', align: 'left' } as Partial<EmailBlock>),
        b('text', { html: '<p>Hi {{customerName}},</p><p>Here\'s a quick round-up of what we\'ve been up to:</p><ul><li>New products in the store</li><li>Faster shipping on most orders</li><li>A sneak peek at what\'s next</li></ul>' } as Partial<EmailBlock>),
        b('imageText'),
        b('divider'),
        b('social'),
      ], { fontFamily: FONT_OPTIONS[1].value });
    case 'restock':
      return wrap('Back in stock', 'Your favourites are available again.', [
        b('header'),
        b('heading', { text: "They're back!" } as Partial<EmailBlock>),
        b('text', { html: '<p>Some of our most-loved items just came back in stock at {{storeName}}. Last time they sold out in days.</p>', align: 'center' } as Partial<EmailBlock>),
        b('products', { columns: 3 } as Partial<EmailBlock>),
      ]);
    case 'thank-you':
      return wrap(`Thank you from ${storeName}`, 'A small thank-you for being with us.', [
        b('header'),
        b('heading', { text: 'Thank you, {{customerName}}' } as Partial<EmailBlock>),
        b('text', { html: '<p>We just wanted to say thanks for shopping with {{storeName}}. Customers like you make what we do possible.</p>', align: 'center' } as Partial<EmailBlock>),
        b('discount', { code: 'THANKYOU10', title: '10% off your next order', description: 'Our thank-you to you.' } as Partial<EmailBlock>),
        b('button', { label: 'Shop again' } as Partial<EmailBlock>),
      ]);
    default:
      return { subject: '', design: defaultDesign() };
  }
}

export const TEMPLATE_OPTIONS = [
  { id: 'blank',        label: 'Blank',              description: 'Start from scratch' },
  { id: 'sale',         label: 'Sale / Promotion',   description: 'Discount code + products' },
  { id: 'new-arrivals', label: 'New arrivals',       description: 'Showcase new products' },
  { id: 'newsletter',   label: 'Newsletter',         description: 'Store update round-up' },
  { id: 'restock',      label: 'Restock',            description: 'Back-in-stock products' },
  { id: 'thank-you',    label: 'Thank you',          description: 'Loyalty + discount' },
];

// ── Rendering ────────────────────────────────────────────────────────────────

function esc(v: string): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Only http(s)/mailto links survive — no javascript: URLs in an email. */
export function safeUrl(url: string | null | undefined): string {
  const u = (url ?? '').trim();
  if (!u) return '';
  // Automation merge tags that the server swaps for a real URL at send time.
  if (/^{{(productUrl|shopUrl)}}$/.test(u)) return u;
  if (/^(https?:|mailto:)/i.test(u)) return u;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(u)) return `https://${u}`;
  return '';
}

/** Rich-text HTML from the editor → keep a small, email-safe tag set with
 *  inline styles; drop everything else (scripts, event handlers, classes). */
export function sanitizeRichText(html: string, styles: EmailDesignStyles): string {
  if (typeof DOMParser === 'undefined') return esc(html);
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const allowed = new Set(['P', 'BR', 'STRONG', 'B', 'EM', 'I', 'U', 'A', 'UL', 'OL', 'LI', 'SPAN', 'DIV']);
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return esc(node.textContent ?? '');
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const el = node as HTMLElement;
    const inner = Array.from(el.childNodes).map(walk).join('');
    if (!allowed.has(el.tagName)) return inner;
    switch (el.tagName) {
      case 'P': case 'DIV': return `<p style="margin:0 0 12px">${inner || '&nbsp;'}</p>`;
      case 'BR': return '<br />';
      case 'STRONG': case 'B': return `<strong>${inner}</strong>`;
      case 'EM': case 'I': return `<em>${inner}</em>`;
      case 'U': return `<u>${inner}</u>`;
      case 'A': {
        const href = safeUrl(el.getAttribute('href'));
        return href ? `<a href="${esc(href)}" style="color:${styles.accentColor};text-decoration:underline">${inner}</a>` : inner;
      }
      case 'UL': return `<ul style="margin:0 0 12px;padding-left:22px">${inner}</ul>`;
      case 'OL': return `<ol style="margin:0 0 12px;padding-left:22px">${inner}</ol>`;
      case 'LI': return `<li style="margin:0 0 4px">${inner}</li>`;
      default: return inner;
    }
  };
  return Array.from(doc.body.firstChild?.childNodes ?? []).map(walk).join('');
}

function money(amount: number | null, currency: string | null): string {
  if (amount === null || amount === undefined) return '';
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: (currency || 'USD').toUpperCase() }).format(amount);
  } catch {
    return `${currency ?? ''} ${amount.toFixed(2)}`.trim();
  }
}

const SOCIAL_LABEL: Record<SocialNetwork, string> = {
  instagram: 'Instagram', facebook: 'Facebook', x: 'X', tiktok: 'TikTok', youtube: 'YouTube', pinterest: 'Pinterest', linkedin: 'LinkedIn',
};

function row(inner: string, pad = '12px 32px', bg?: string) {
  return `<tr><td style="padding:${pad};${bg ? `background:${bg};` : ''}">${inner}</td></tr>`;
}

function buttonHtml(label: string, href: string, bg: string, color: string, radius: number, full = false) {
  const link = safeUrl(href) || '#';
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" ${full ? 'width="100%"' : ''} style="border-collapse:separate${full ? '' : ';display:inline-table'}">
<tr><td align="center" style="background:${bg};border-radius:${radius}px">
<a href="${esc(link)}" style="display:block;padding:12px 26px;color:${color};text-decoration:none;font-weight:bold;font-size:15px">${esc(label)}</a>
</td></tr></table>`;
}

export function productUrl(ctx: RenderContext, productId: string): string {
  return ctx.storeUrl ? `${ctx.storeUrl}/product/${productId}` : '';
}

function renderBlock(b: EmailBlock, s: EmailDesignStyles, ctx: RenderContext): string {
  switch (b.type) {
    case 'header': {
      const logo = safeUrl(b.logoUrl);
      const name = b.showStoreName || !logo
        ? `<div style="font-size:20px;font-weight:bold;color:${s.textColor};${logo ? 'margin-top:8px' : ''}">${esc(ctx.storeName)}</div>` : '';
      const img = logo ? `<img src="${esc(logo)}" alt="${esc(ctx.storeName)}" width="${b.logoWidth}" style="display:inline-block;max-width:100%;height:auto;border:0" />` : '';
      const inner = `<div style="text-align:${b.align}">${ctx.storeUrl ? `<a href="${esc(ctx.storeUrl)}" style="text-decoration:none">${img}${name}</a>` : img + name}</div>`;
      return row(inner, '24px 32px', b.background);
    }
    case 'heading':
      return row(`<h1 style="margin:0;font-size:${b.size}px;line-height:1.25;color:${b.color};text-align:${b.align};font-weight:bold">${esc(b.text)}</h1>`);
    case 'text':
      return row(`<div style="font-size:15px;line-height:1.6;color:${s.textColor};text-align:${b.align}">${sanitizeRichText(b.html, s)}</div>`);
    case 'image': {
      const src = safeUrl(b.url);
      if (!src) return '';
      const img = `<img src="${esc(src)}" alt="${esc(b.alt)}" width="${Math.round(536 * b.width / 100)}" style="display:block;width:${b.width}%;max-width:100%;height:auto;border:0;border-radius:${s.borderRadius}px;margin:0 auto" />`;
      const link = safeUrl(b.link);
      return row(link ? `<a href="${esc(link)}">${img}</a>` : img);
    }
    case 'button':
      return row(`<div style="text-align:${b.align}">${buttonHtml(b.label, b.link || ctx.storeUrl || '', b.background, b.color, s.borderRadius, b.fullWidth)}</div>`, '16px 32px');
    case 'products': {
      if (b.items.length === 0) return '';
      const cols = b.columns;
      const width = Math.floor(100 / cols);
      const cells = b.items.map(p => {
        const href = productUrl(ctx, p.productId);
        const img = safeUrl(p.imageUrl);
        return `<td valign="top" width="${width}%" style="padding:8px;text-align:center">
${img ? `<a href="${esc(href)}"><img src="${esc(img)}" alt="${esc(p.name)}" width="100%" style="display:block;width:100%;height:auto;border:0;border-radius:${s.borderRadius}px" /></a>` : ''}
<p style="margin:10px 0 4px;font-size:14px;font-weight:bold;color:${s.textColor}">${esc(p.name)}</p>
${b.showPrice && p.price !== null ? `<p style="margin:0 0 10px;font-size:14px;color:${s.textColor}">${esc(money(p.price, p.currency))}</p>` : ''}
${b.buttonLabel && href ? buttonHtml(b.buttonLabel, href, s.accentColor, '#ffffff', s.borderRadius) : ''}
</td>`;
      });
      const rows: string[] = [];
      for (let i = 0; i < cells.length; i += cols) {
        const slice = cells.slice(i, i + cols);
        while (slice.length < cols) slice.push(`<td width="${width}%"></td>`);
        rows.push(`<tr>${slice.join('')}</tr>`);
      }
      return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.join('')}</table>`, '8px 24px');
    }
    case 'imageText': {
      const src = safeUrl(b.url);
      const imgCell = `<td valign="middle" width="50%" style="padding:8px">${src ? `<img src="${esc(src)}" alt="" width="100%" style="display:block;width:100%;height:auto;border:0;border-radius:${s.borderRadius}px" />` : ''}</td>`;
      const textCell = `<td valign="middle" width="50%" style="padding:8px;font-size:15px;line-height:1.6;color:${s.textColor}">
${sanitizeRichText(b.html, s)}
${b.buttonLabel ? buttonHtml(b.buttonLabel, b.link || ctx.storeUrl || '', s.accentColor, '#ffffff', s.borderRadius) : ''}
</td>`;
      return row(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${b.imagePosition === 'left' ? imgCell + textCell : textCell + imgCell}</tr></table>`, '8px 24px');
    }
    case 'discount':
      return row(`<div style="border:2px dashed ${s.accentColor};border-radius:${s.borderRadius}px;padding:20px;text-align:center">
${b.title ? `<p style="margin:0 0 6px;font-size:17px;font-weight:bold;color:${s.textColor}">${esc(b.title)}</p>` : ''}
<p style="margin:0;font-size:26px;font-weight:bold;letter-spacing:3px;color:${s.accentColor}">${esc(b.code)}</p>
${b.description ? `<p style="margin:8px 0 0;font-size:13px;color:${s.textColor};opacity:.8">${esc(b.description)}</p>` : ''}
</div>`, '16px 32px');
    case 'divider':
      return row(`<div style="border-top:${b.thickness}px solid ${b.color};line-height:0;font-size:0">&nbsp;</div>`, '8px 32px');
    case 'spacer':
      return `<tr><td style="height:${b.height}px;line-height:${b.height}px;font-size:0">&nbsp;</td></tr>`;
    case 'dynamicProduct':
      // {{productImage}} / {{priceLine}} are HTML fragments and the rest are
      // escaped values — all filled server-side per recipient.
      return row(`<div style="text-align:${b.align}">
{{productImage}}
<p style="margin:0 0 4px;font-size:17px;font-weight:bold;color:${s.textColor}">{{productName}}</p>
${b.showPrice ? `<p style="margin:0 0 14px;font-size:15px;color:${s.textColor}">{{priceLine}}</p>` : ''}
${b.buttonLabel ? buttonHtml(b.buttonLabel, '{{productUrl}}', s.accentColor, '#ffffff', s.borderRadius) : ''}
</div>`, '16px 32px');
    case 'social': {
      const links = b.links.filter(l => safeUrl(l.url));
      if (links.length === 0) return '';
      return row(`<div style="text-align:${b.align};font-size:14px">${links.map(l =>
        `<a href="${esc(safeUrl(l.url))}" style="color:${s.accentColor};text-decoration:none;font-weight:bold;margin:0 8px">${SOCIAL_LABEL[l.network]}</a>`).join('')}</div>`);
    }
  }
}

/** The design → the HTML body stored as the campaign `message`. The server
 *  appends the unsubscribe footer and open pixel at send time. */
export function renderEmailDesign(design: EmailDesign, ctx: RenderContext): string {
  const s = design.styles;
  const preheader = design.previewText
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;font-size:1px;line-height:1px;color:${s.background}">${esc(design.previewText)}</div>` : '';
  return `${preheader}<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${s.background};font-family:${s.fontFamily}">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background:${s.contentBackground};border-radius:8px;overflow:hidden;font-family:${s.fontFamily};color:${s.textColor}">
${design.blocks.map(b => renderBlock(b, s, ctx)).join('\n')}
<tr><td style="height:16px;font-size:0">&nbsp;</td></tr>
</table>
</td></tr></table>`;
}

/** One block as its own 600px-wide table — the editor canvas stacks these so
 *  each section can be clicked/selected, while looking like the real email. */
export function renderBlockStandalone(block: EmailBlock, design: EmailDesign, ctx: RenderContext): string {
  const s = design.styles;
  const html = renderBlock(block, s, ctx);
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${s.contentBackground};font-family:${s.fontFamily};color:${s.textColor}">${html || ''}</table>`;
}

export function storeUrlFor(store: { slug?: string; customDomain?: string | null; customDomainStatus?: string } | null | undefined): string | null {
  if (!store) return null;
  if (store.customDomain && store.customDomainStatus === 'verified') return `https://${store.customDomain}`;
  return store.slug ? `https://${store.slug}.solvexo.store` : null;
}

export function isEmailDesign(v: unknown): v is EmailDesign {
  return !!v && typeof v === 'object' && (v as EmailDesign).version === 1 && Array.isArray((v as EmailDesign).blocks);
}
