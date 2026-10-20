import type { SellerOrderDetail } from '@/api/services/product';
import { currencySymbol, getCurrencyDecimals } from '@/utils/currency';

/**
 * Print documents for an order: the packing slip (for the packer) and the invoice (for the customer).
 * One builder, one look: both documents share the header, the watermark and the paper settings the seller
 * chose in Settings → Order documents. Everything printed is escaped; the figures come from the server
 * (`detail.totals`), never recomputed here.
 */

export type DocKind = 'slip' | 'invoice';
export type DocPaper = 'a4' | 'a5' | 'letter' | 'thermal80';
type Size = 'small' | 'medium' | 'large';
type Align = 'left' | 'center' | 'right';

export interface OrderDocumentSettings {
  companyName: string | null; addressText: string | null; phone: string | null; email: string | null;
  taxIdLabel: string | null; taxIdValue: string | null;
  paperSize: DocPaper; accentColor: string | null; showLogo: boolean; logoSize: Size; logoAlign: Align;
  watermarkEnabled: boolean; watermarkType: 'logo' | 'text'; watermarkText: string | null;
  watermarkPosition: 'center' | 'tiled'; watermarkAngle: 0 | -30 | -45; watermarkOpacity: number; watermarkSize: Size;
  slipShowPrices: boolean; slipShowSku: boolean; slipShowImages: boolean; slipShowNote: boolean; slipShowPayment: boolean; slipShowCheckbox: boolean;
  slipMessage: string | null; slipFooter: string | null;
  invoiceTitle: string | null; invoiceShowSku: boolean; invoiceShowImages: boolean; invoiceShowTaxId: boolean;
  invoiceTerms: string | null; invoiceFooter: string | null;
}

export interface OrderDocumentStore { name: string; logo: string | null; contactEmail: string | null; phone: string | null; currency: string | null }

export const DEFAULT_DOCUMENT_SETTINGS: OrderDocumentSettings = {
  companyName: null, addressText: null, phone: null, email: null, taxIdLabel: null, taxIdValue: null,
  paperSize: 'a4', accentColor: null, showLogo: true, logoSize: 'medium', logoAlign: 'left',
  watermarkEnabled: false, watermarkType: 'logo', watermarkText: null, watermarkPosition: 'center', watermarkAngle: -30, watermarkOpacity: 8, watermarkSize: 'medium',
  slipShowPrices: false, slipShowSku: true, slipShowImages: true, slipShowNote: true, slipShowPayment: true, slipShowCheckbox: true, slipMessage: null, slipFooter: null,
  invoiceTitle: null, invoiceShowSku: true, invoiceShowImages: false, invoiceShowTaxId: true, invoiceTerms: null, invoiceFooter: null,
};

export interface DocumentTotals {
  currency: string; subtotal: number; discount: number; shipping: number | null; tax: number; includedTax: number;
  total: number; giftCard: number; storeCredit: number; payable: number; couponCode: string | null;
}

export interface DocumentItem {
  name: string; options: { name: string; value: string }[]; sku: string | null; quantity: number;
  price: number; totalPrice: number; image: string | null; digital: boolean;
}

export interface DocumentOrder {
  orderNumber: string; createdAt: string; currency: string;
  isPaid: boolean; paymentType: string; paymentMethodName: string | null;
  customerName: string; customerEmail: string; customerPhone: string;
  isPickup: boolean; pickupLocation: string | null;
  shippingAddress: { recipientName: string; phoneNumber: string; addressLine1: string; addressLine2: string | null; city: string; state: string; zipCode: string } | null;
  items: DocumentItem[];
  totals: DocumentTotals | null;
  customerNote: string | null;
}

const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/** Maps the seller order detail response to what the documents print; tolerant of missing fields. */
export function toDocumentOrder(detail: SellerOrderDetail | null | undefined, fallbackNumber = ''): DocumentOrder {
  const loose = (detail ?? {}) as unknown as Record<string, unknown>;
  const pickupObj = (loose.pickupLocation ?? loose.pickup) as Record<string, unknown> | string | null | undefined;
  const pickupName = typeof pickupObj === 'string' ? pickupObj
    : pickupObj && typeof pickupObj === 'object' ? str(pickupObj.name) || str(pickupObj.address) : '';
  const items = (detail?.sellerOrder?.items ?? [])
    .filter(i => i.status !== 'cancelled')
    .map(i => ({
      name: i.name ?? '', options: Array.isArray(i.options) ? i.options : [], sku: i.sku ?? null, quantity: i.quantity ?? 0,
      price: i.price ?? 0, totalPrice: i.totalPrice ?? 0, image: i.image ?? null, digital: i.type === 'digital',
    }));
  const note = typeof detail?.customerNote === 'string' ? detail.customerNote.trim() : '';
  return {
    orderNumber: detail?.orderNumber || fallbackNumber,
    createdAt: detail?.createdAt ?? '',
    currency: detail?.currency ?? 'USD',
    isPaid: detail?.isPaid === true,
    paymentType: detail?.paymentType ?? '',
    paymentMethodName: (loose.paymentMethodName as string | null | undefined) ?? null,
    customerName: detail?.buyer?.name ?? '',
    customerEmail: detail?.buyer?.email ?? '',
    customerPhone: detail?.buyer?.phone ?? '',
    isPickup: loose.fulfillmentMethod === 'pickup',
    pickupLocation: pickupName || null,
    shippingAddress: detail?.shippingAddress ?? null,
    items,
    totals: (loose.totals as DocumentTotals | undefined) ?? null,
    customerNote: note || null,
  };
}

/** A made-up order for the live preview in Settings. */
export const SAMPLE_DOCUMENT_ORDER: DocumentOrder = {
  orderNumber: 'ORD-1001', createdAt: new Date().toISOString(), currency: 'USD', isPaid: false, paymentType: 'cash_on_delivery', paymentMethodName: null,
  customerName: 'Ayesha Khan', customerEmail: 'ayesha@example.com', customerPhone: '+92 300 1234567', isPickup: false, pickupLocation: null,
  shippingAddress: { recipientName: 'Ayesha Khan', phoneNumber: '+92 300 1234567', addressLine1: '12 Garden Road', addressLine2: null, city: 'Lahore', state: 'Punjab', zipCode: '54000' },
  items: [
    { name: 'Linen Overshirt', options: [{ name: 'Size', value: 'M' }, { name: 'Color', value: 'Sand' }], sku: 'LIN-OVR-M', quantity: 1, price: 49, totalPrice: 49, image: null, digital: false },
    { name: 'Everyday Tote', options: [], sku: 'TOTE-01', quantity: 2, price: 18, totalPrice: 36, image: null, digital: false },
  ],
  totals: { currency: 'USD', subtotal: 85, discount: 5, shipping: 6, tax: 0, includedTax: 0, total: 86, giftCard: 0, storeCredit: 0, payable: 86, couponCode: 'WELCOME5' },
  customerNote: 'Please gift wrap if possible.',
};

function esc(v: unknown): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
const lines = (v: string | null | undefined): string => esc(v ?? '').replace(/\n/g, '<br>');
const safeUrl = (u: string | null | undefined): string => (u && /^https?:\/\//i.test(u) ? u : '');
const hexOr = (v: string | null | undefined, fallback: string): string => (v && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback);

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function money(amount: number, code: string): string {
  const dec = getCurrencyDecimals(code);
  return `${currencySymbol(code)} ${amount.toLocaleString(undefined, { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
}

const PAPER: Record<DocPaper, { page: string; px: number; font: number }> = {
  a4: { page: 'A4; margin: 14mm', px: 794, font: 13 },
  a5: { page: 'A5; margin: 10mm', px: 560, font: 11.5 },
  letter: { page: 'Letter; margin: 14mm', px: 816, font: 13 },
  thermal80: { page: '80mm auto; margin: 3mm', px: 302, font: 11 },
};
const LOGO_H: Record<Size, number> = { small: 36, medium: 56, large: 84 };
const WM_IMG_PCT: Record<Size, number> = { small: 30, medium: 48, large: 70 };
const WM_TEXT_PX: Record<Size, number> = { small: 44, medium: 76, large: 120 };
const WM_TILE_PX: Record<Size, number> = { small: 110, medium: 170, large: 260 };

function paymentChip(o: DocumentOrder): { label: string; cls: string } {
  if (o.isPaid) return { label: 'Paid', cls: 'ok' };
  if (o.paymentType === 'cash_on_delivery') return { label: 'Cash on delivery', cls: 'due' };
  return { label: 'Payment pending', cls: 'due' };
}

function paymentLine(o: DocumentOrder): string {
  if (o.paymentMethodName) return o.paymentMethodName;
  const names: Record<string, string> = {
    cash_on_delivery: 'Cash on delivery', manual_bank_transfer: 'Bank transfer', stripe: 'Card', store_credit: 'Store credit', manual: 'Manual payment',
  };
  return names[o.paymentType] ?? '';
}

/** Makes a URL safe inside a CSS url('...') that itself sits in an HTML attribute (space, quotes, brackets, backslash). */
function cssUrl(u: string): string {
  return u.replace(/[\s'"()<>\\]/g, c => `%${c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0')}`);
}

function watermarkHtml(s: OrderDocumentSettings, store: OrderDocumentStore): string {
  if (!s.watermarkEnabled) return '';
  const opacity = Math.min(25, Math.max(3, s.watermarkOpacity)) / 100;
  const logo = safeUrl(store.logo);
  const useLogo = s.watermarkType === 'logo' && logo;
  const text = (s.watermarkType === 'text' ? s.watermarkText : null) || store.name || '';
  if (!useLogo && !text) return '';
  const rot = `transform:rotate(${s.watermarkAngle}deg);`;
  if (s.watermarkPosition === 'tiled') {
    const tile = WM_TILE_PX[s.watermarkSize];
    let bg: string;
    if (useLogo) {
      bg = `background-image:url('${cssUrl(logo)}');background-size:${tile}px auto;background-repeat:space;`;
    } else {
      const fs = Math.min(46, Math.round(tile / Math.max(6, Math.min(14, text.length)) * 1.6));
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${tile * 1.6}" height="${tile}"><text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${fs}" fill="#000">${esc(text)}</text></svg>`;
      bg = `background-image:url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}');background-size:${tile * 1.6}px ${tile}px;background-repeat:repeat;`;
    }
    const tileStyle = `position:absolute;inset:-60%;${bg}${rot}opacity:${opacity}`;
    return `<div class="wm" aria-hidden="true"><div style="${esc(tileStyle)}"></div></div>`;
  }
  const inner = useLogo
    ? `<img src="${esc(logo)}" alt="" style="width:${WM_IMG_PCT[s.watermarkSize]}%;max-height:70%;object-fit:contain;${rot}opacity:${opacity}">`
    : `<div style="font-family:Arial,Helvetica,sans-serif;font-weight:800;font-size:${WM_TEXT_PX[s.watermarkSize]}px;letter-spacing:.06em;text-transform:uppercase;text-align:center;line-height:1.1;max-width:90%;color:#000;${rot}opacity:${opacity}">${esc(text)}</div>`;
  return `<div class="wm" aria-hidden="true" style="display:flex;align-items:center;justify-content:center">${inner}</div>`;
}

function headerHtml(kind: DocKind, o: DocumentOrder, s: OrderDocumentSettings, store: OrderDocumentStore): string {
  const logo = safeUrl(store.logo);
  const name = s.companyName || store.name;
  const email = s.email || store.contactEmail || '';
  const phone = s.phone || store.phone || '';
  const taxId = kind === 'invoice' && s.invoiceShowTaxId && s.taxIdValue ? `${esc(s.taxIdLabel || 'Tax ID')}: ${esc(s.taxIdValue)}` : '';
  const brand = `<div class="brand">${s.showLogo && logo ? `<img class="logo" src="${esc(logo)}" alt="" style="max-height:${LOGO_H[s.logoSize]}px">` : ''}
<div class="co"><div class="co-name">${esc(name)}</div>${s.addressText ? `<div class="co-line">${lines(s.addressText)}</div>` : ''}${phone ? `<div class="co-line">${esc(phone)}</div>` : ''}${email ? `<div class="co-line">${esc(email)}</div>` : ''}${taxId ? `<div class="co-line">${taxId}</div>` : ''}</div></div>`;
  const title = kind === 'invoice' ? (s.invoiceTitle || 'Invoice') : 'Packing slip';
  const chip = kind === 'invoice' || s.slipShowPayment ? paymentChip(o) : null;
  const doc = `<div class="doc"><div class="doc-title">${esc(title)}</div><div class="doc-meta">Order <b>${esc(o.orderNumber)}</b><br>${esc(fmtDate(o.createdAt))}${chip ? `<br><span class="chip ${chip.cls}">${esc(chip.label)}</span>` : ''}${paymentLine(o) && (kind === 'invoice' || s.slipShowPayment) ? `<br><span class="muted">${esc(paymentLine(o))}</span>` : ''}</div></div>`;
  return `<header class="hd ${s.logoAlign}">${brand}${doc}</header>`;
}

function partiesHtml(kind: DocKind, o: DocumentOrder): string {
  let shipTo: string;
  if (o.isPickup) {
    shipTo = `<strong>Local pickup</strong>${o.pickupLocation ? `<br>${esc(o.pickupLocation)}` : ''}`;
  } else if (o.shippingAddress) {
    const a = o.shippingAddress;
    shipTo = [`<strong>${esc(a.recipientName)}</strong>`, esc(a.addressLine1), a.addressLine2 ? esc(a.addressLine2) : '',
      esc([a.city, a.state, a.zipCode].filter(Boolean).join(', ')), a.phoneNumber ? esc(a.phoneNumber) : ''].filter(Boolean).join('<br>');
  } else {
    shipTo = '<em>No shipping address</em>';
  }
  const customer = `<strong>${esc(o.customerName)}</strong>${o.customerEmail ? `<br>${esc(o.customerEmail)}` : ''}${o.customerPhone ? `<br>${esc(o.customerPhone)}` : ''}`;
  return kind === 'invoice'
    ? `<div class="cols"><div><h2>Bill to</h2><p>${customer}</p></div><div><h2>${o.isPickup ? 'Pickup' : 'Ship to'}</h2><p>${shipTo}</p></div></div>`
    : `<div class="cols"><div><h2>${o.isPickup ? 'Pickup' : 'Ship to'}</h2><p>${shipTo}</p></div><div><h2>Customer</h2><p>${customer}</p></div></div>`;
}

function itemsHtml(kind: DocKind, o: DocumentOrder, s: OrderDocumentSettings): string {
  const slip = kind === 'slip';
  const items = slip ? o.items.filter(i => !i.digital) : o.items;
  const showSku = slip ? s.slipShowSku : s.invoiceShowSku;
  const showImg = slip ? s.slipShowImages : s.invoiceShowImages;
  const showCheck = slip && s.slipShowCheckbox;
  const showPrices = !slip || s.slipShowPrices;
  const cur = o.totals?.currency ?? o.currency;
  const head = `<tr>${showCheck ? '<th class="chk"></th>' : ''}${showImg ? '<th class="img"></th>' : ''}<th>Item</th>${showSku ? '<th>SKU</th>' : ''}<th class="n">Qty</th>${showPrices ? '<th class="n">Price</th><th class="n">Amount</th>' : ''}</tr>`;
  const cols = 3 + (showCheck ? 1 : 0) + (showImg ? 1 : 0) + (showSku ? 1 : 0) + (showPrices ? 2 : 0) - 1;
  const rows = items.length
    ? items.map(i => {
        const opts = i.options.map(op => `${esc(op.name)}: ${esc(op.value)}`).join(' / ');
        const img = safeUrl(i.image);
        return `<tr>${showCheck ? '<td class="chk"><span class="box"></span></td>' : ''}${showImg ? `<td class="img">${img ? `<img src="${esc(img)}" alt="">` : ''}</td>` : ''}<td><div class="nm">${esc(i.name)}</div>${opts ? `<div class="sub">${opts}</div>` : ''}</td>${showSku ? `<td>${i.sku ? esc(i.sku) : ''}</td>` : ''}<td class="n">${esc(i.quantity)}</td>${showPrices ? `<td class="n">${esc(money(i.price, cur))}</td><td class="n">${esc(money(i.totalPrice, cur))}</td>` : ''}</tr>`;
      }).join('')
    : `<tr><td colspan="${cols}"><em>No physical items</em></td></tr>`;
  return `<table><thead>${head}</thead><tbody>${rows}</tbody></table>`;
}

function totalsHtml(o: DocumentOrder): string {
  const t = o.totals;
  if (!t) return '';
  const row = (label: string, value: string, cls = '') => `<tr class="${cls}"><td>${esc(label)}</td><td class="n">${esc(value)}</td></tr>`;
  const parts = [row('Subtotal', money(t.subtotal, t.currency))];
  if (t.discount > 0) parts.push(row(t.couponCode ? `Discount (${t.couponCode})` : 'Discount', `- ${money(t.discount, t.currency)}`));
  if (t.shipping !== null) parts.push(row(o.isPickup ? 'Pickup' : 'Shipping', t.shipping > 0 ? money(t.shipping, t.currency) : 'Free'));
  if (t.tax > 0) parts.push(row('Tax', money(t.tax, t.currency)));
  parts.push(row('Total', money(t.total, t.currency), 'grand'));
  if (t.includedTax > 0) parts.push(row('Includes tax', money(t.includedTax, t.currency), 'soft'));
  if (t.giftCard > 0) parts.push(row('Paid with gift card', `- ${money(t.giftCard, t.currency)}`));
  if (t.storeCredit > 0) parts.push(row('Paid with store credit', `- ${money(t.storeCredit, t.currency)}`));
  const cod = !o.isPaid && o.paymentType === 'cash_on_delivery';
  parts.push(row(o.isPaid ? 'Amount paid' : cod ? 'Amount to collect' : 'Amount due', money(t.payable, t.currency), 'due-row'));
  return `<table class="totals"><tbody>${parts.join('')}</tbody></table>`;
}

function slipHtml(kind: DocKind, o: DocumentOrder, s: OrderDocumentSettings, store: OrderDocumentStore): string {
  const slip = kind === 'slip';
  const collect = slip && s.slipShowPayment && !s.slipShowPrices && !o.isPaid && o.paymentType === 'cash_on_delivery' && o.totals
    ? `<div class="collect">Collect on delivery: <b>${esc(money(o.totals.payable, o.totals.currency))}</b></div>` : '';
  const note = slip && s.slipShowNote && o.customerNote ? `<div class="note"><h2>Note from customer</h2><p>${lines(o.customerNote)}</p></div>` : '';
  const message = slip ? s.slipMessage : null;
  const foot = slip ? s.slipFooter : s.invoiceFooter;
  const terms = !slip && s.invoiceTerms ? `<div class="terms"><h2>Terms</h2><p>${lines(s.invoiceTerms)}</p></div>` : '';
  const showTotals = !slip || s.slipShowPrices;
  return `<section class="slip">${headerHtml(kind, o, s, store)}${partiesHtml(kind, o)}${collect}${itemsHtml(kind, o, s)}${showTotals ? totalsHtml(o) : ''}${note}${terms}${message ? `<p class="msg">${lines(message)}</p>` : ''}${foot ? `<footer class="ft">${lines(foot)}</footer>` : ''}</section>`;
}

function css(s: OrderDocumentSettings, preview: boolean): string {
  const accent = hexOr(s.accentColor, '#111111');
  const p = PAPER[s.paperSize] ?? PAPER.a4;
  const thermal = s.paperSize === 'thermal80';
  return `
:root{--accent:${accent}}
*{box-sizing:border-box}
@page{size:${p.page}}
html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;font-size:${p.font}px;line-height:1.4;${preview ? 'background:#e9e9ec;padding:18px;' : 'padding:0;'}}
.paper{position:relative;background:#fff;${preview ? `overflow:hidden;width:${p.px}px;max-width:100%;margin:0 auto;padding:${thermal ? 14 : 38}px;box-shadow:0 1px 6px rgba(0,0,0,.15);` : ''}}
.wm{position:${preview ? 'absolute' : 'fixed'};inset:0;overflow:hidden;pointer-events:none;z-index:0}
.slip{position:relative;z-index:1;page-break-after:always;break-after:page}
.slip:last-child{page-break-after:auto;break-after:auto}
.hd{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;border-bottom:2px solid var(--accent);padding-bottom:12px;margin-bottom:16px}
.hd.right{flex-direction:row-reverse}
.hd.right .doc{text-align:left}
.hd.center{flex-direction:column;align-items:center;text-align:center}
.hd.center .doc{text-align:center}
.brand{display:flex;align-items:center;gap:12px;min-width:0}
.hd.center .brand{flex-direction:column}
.logo{width:auto;max-width:200px;object-fit:contain}
.co-name{font-size:${thermal ? 15 : 18}px;font-weight:700}.co-line{color:#555;font-size:${p.font - 1}px}
.doc{text-align:right}.doc-title{font-size:${thermal ? 15 : 20}px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:var(--accent)}
.doc-meta{margin-top:4px;line-height:1.55}.muted{color:#666}
.chip{display:inline-block;margin-top:3px;padding:1px 9px;border:1.5px solid #111;border-radius:99px;font-size:${p.font - 2}px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}
.chip.ok{border-color:#15803d;color:#15803d}.chip.due{border-color:#b45309;color:#b45309}
h2{font-size:${p.font - 2}px;text-transform:uppercase;letter-spacing:.07em;color:#666;margin:0 0 4px}
.cols{display:${thermal ? 'block' : 'flex'};gap:40px;margin-bottom:16px}.cols p{margin:0 0 ${thermal ? 8 : 0}px;line-height:1.5}
.collect{border:1.5px dashed #b45309;color:#7c3a06;padding:8px 12px;margin-bottom:14px;font-size:${p.font + 1}px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:${thermal ? 4 : 8}px 6px;border-bottom:1px solid #ddd;vertical-align:top}
th{font-size:${p.font - 2}px;text-transform:uppercase;letter-spacing:.05em;color:#555;border-bottom:1.5px solid #111}
.n{text-align:right;white-space:nowrap}.nm{font-weight:600}.sub{color:#666;font-size:${p.font - 1}px;margin-top:2px}
.chk{width:26px}.box{display:inline-block;width:14px;height:14px;border:1.5px solid #111;border-radius:3px}
.img{width:${thermal ? 0 : 52}px}${thermal ? '.img{display:none}' : ''}.img img{width:44px;height:44px;object-fit:cover;border-radius:6px;border:1px solid #e5e5e5;display:block}
.totals{width:${thermal ? '100%' : '46%'};margin:12px 0 0 auto}
.totals td{border-bottom:none;padding:3px 6px}.totals .grand td{border-top:1.5px solid #111;font-weight:700;font-size:${p.font + 2}px;padding-top:6px}
.totals .soft td{color:#666;font-size:${p.font - 1}px}.totals .due-row td{font-weight:700;color:var(--accent)}
.note,.terms{margin-top:16px;padding:10px 12px;border:1px solid #ccc;border-radius:6px}.note p,.terms p{margin:0;white-space:pre-wrap}
.msg{margin:18px 0 0;text-align:center;font-size:${p.font + 1}px;font-weight:600}
.ft{margin-top:14px;padding-top:8px;border-top:1px solid #ddd;text-align:center;color:#666;font-size:${p.font - 1}px}
`;
}

export interface BuildOptions { preview?: boolean }

/** The whole HTML document for the given orders (one section per order, page break between). */
export function buildDocumentsHtml(
  kind: DocKind, orders: DocumentOrder[], settings: OrderDocumentSettings, store: OrderDocumentStore, opts: BuildOptions = {},
): string {
  const preview = opts.preview === true;
  const s = { ...DEFAULT_DOCUMENT_SETTINGS, ...settings };
  const title = kind === 'invoice' ? (s.invoiceTitle || 'Invoice') : 'Packing slip';
  const body = `<div class="paper">${watermarkHtml(s, store)}${orders.map(o => slipHtml(kind, o, s, store)).join('')}</div>`;
  const printScript = preview ? '' : `<script>
(function(){var done=false;function go(){if(done)return;done=true;setTimeout(function(){window.print()},150)}
var imgs=[].slice.call(document.images);var left=imgs.length;if(!left){go();return}
function one(){left--;if(left<=0)go()}
imgs.forEach(function(i){if(i.complete)one();else{i.addEventListener('load',one);i.addEventListener('error',one)}});
setTimeout(go,5000)})();
</script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}${orders.length === 1 ? ` ${esc(orders[0].orderNumber)}` : 's'}</title><style>${css(s, preview)}</style></head><body${preview ? ' class="preview"' : ''}>${body}${printScript}</body></html>`;
}

/**
 * Opens a print-ready document in a new window and starts printing once images have loaded.
 * Returns false when the browser blocked the window.
 */
export function openOrderDocuments(kind: DocKind, orders: DocumentOrder[], settings: OrderDocumentSettings, store: OrderDocumentStore): boolean {
  const html = buildDocumentsHtml(kind, orders, settings, store);
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const w = window.open(url, '_blank');
  if (!w) {
    URL.revokeObjectURL(url);
    return false;
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
