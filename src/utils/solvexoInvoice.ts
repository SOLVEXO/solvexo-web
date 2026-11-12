import { apiGetSolvexoInvoiceDoc, type SolvexoInvoiceDoc } from '@/api/services/fbrDi';
import { fbrQrDataUrl } from '@/utils/fbrInvoice';

const esc = (v: unknown): string => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
const usd = (n: number) => `$${(Number.isFinite(n) ? n : 0).toFixed(2)}`;
const pkr = (n: number) => `Rs ${(Number.isFinite(n) ? n : 0).toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
const day = (d: string) => { const x = new Date(d); return Number.isNaN(x.getTime()) ? '' : x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); };

const STATUS: Record<string, string> = { paid: 'Paid', failed: 'Payment failed', pending: 'Pending', refunded: 'Refunded', partially_refunded: 'Partly refunded' };

/** The printable Solvexo invoice a seller receives for a plan payment. Pure: everything comes from the API document. */
export function buildSolvexoInvoiceHtml(doc: SolvexoInvoiceDoc, qrDataUrl: string | null, opts: { autoPrint?: boolean } = {}): string {
  const { invoice: i, seller: s, buyer: b, fbr } = doc;
  const taxLine = i.tax > 0 ? `<tr><td>${esc(i.taxLabel || 'Tax')}${i.taxRatePercent ? ` (${esc(i.taxRatePercent)}%)` : ''}</td><td class="n">${usd(i.tax)}</td></tr>` : '';
  const refund = i.refunded > 0 ? `<tr class="soft"><td>Refunded</td><td class="n">- ${usd(i.refunded)}</td></tr>` : '';
  const filed = !!(fbr && fbr.status === 'submitted' && fbr.invoiceNumber);
  const fbrBlock = filed && fbr
    ? `<div class="fbr">${qrDataUrl && qrDataUrl.startsWith('data:image/') ? `<img class="fbr-qr" src="${esc(qrDataUrl)}" alt="FBR QR code">` : ''}<div><div class="fbr-t">FBR Digital Invoicing System</div><div>Invoice No: <b>${esc(fbr.invoiceNumber)}</b></div>${fbr.dated ? `<div class="muted">${esc(fbr.dated)}</div>` : ''}${fbr.netPKR !== null && fbr.taxPKR !== null && fbr.fxRate ? `<div class="muted">Reported to FBR in rupees: ${esc(pkr(fbr.netPKR))} + tax ${esc(pkr(fbr.taxPKR))} (1 USD = ${esc(fbr.fxRate)} PKR)</div>` : ''}${fbr.mode === 'sandbox' ? '<div class="test">TEST invoice (FBR sandbox) — not a valid tax invoice</div>' : ''}</div></div>`
    : '';
  const printScript = opts.autoPrint === false ? '' : '<script>window.addEventListener("load",function(){setTimeout(function(){window.print()},200)})</script>';
  return `<!doctype html><html><head><meta charset="utf-8"><title>Invoice ${esc(i.number)}</title><style>
*{box-sizing:border-box}@page{size:A4;margin:0}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:Arial,Helvetica,sans-serif;color:#111;margin:0;padding:18mm 16mm;font-size:13px;line-height:1.45}
.hd{display:flex;justify-content:space-between;gap:24px;border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:18px}
.co-name{font-size:19px;font-weight:700}.line{color:#555}.title{font-size:20px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;text-align:right}
.meta{text-align:right;margin-top:4px}.muted{color:#666}.cols{display:flex;gap:40px;margin-bottom:18px}.cols>div{flex:1}h2{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#666;margin:0 0 4px}
table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:9px 6px;border-bottom:1px solid #ddd}th{font-size:11px;text-transform:uppercase;color:#555;border-bottom:1.5px solid #111}.n{text-align:right;white-space:nowrap}
.totals{width:46%;margin:12px 0 0 auto}.totals td{border-bottom:none;padding:4px 6px}.totals .grand td{border-top:1.5px solid #111;font-weight:700;font-size:15px;padding-top:7px}.soft td{color:#666}
.chip{display:inline-block;margin-top:4px;padding:1px 10px;border:1.5px solid #111;border-radius:99px;font-size:11px;font-weight:700;text-transform:uppercase}
.fbr{display:flex;align-items:center;gap:14px;margin-top:22px;padding:10px 12px;border:1px solid #ccc;border-radius:6px;break-inside:avoid}.fbr-qr{width:1in;height:1in;image-rendering:pixelated;flex:none}.fbr-t{font-weight:700}.test{color:#b45309;font-weight:700;margin-top:3px}
.ft{margin-top:26px;padding-top:8px;border-top:1px solid #ddd;color:#666;font-size:11.5px;text-align:center}
</style></head><body>
<div class="hd"><div><div class="co-name">${esc(s.legalName || 'Solvexo')}</div>
${s.address ? `<div class="line">${esc(s.address)}</div>` : ''}${s.ntn ? `<div class="line">NTN: ${esc(s.ntn)}</div>` : ''}${s.strn ? `<div class="line">STRN: ${esc(s.strn)}</div>` : ''}${s.ntn ? `<div class="line">Registered with ${esc(s.authority)}</div>` : ''}</div>
<div><div class="title">${i.tax > 0 ? 'Tax invoice' : 'Invoice'}</div><div class="meta">No. <b>${esc(i.number)}</b><br>Date: ${esc(day(i.date))}<br><span class="chip">${esc(STATUS[i.status] ?? i.status)}</span></div></div></div>
<div class="cols"><div><h2>Billed to</h2><div><b>${esc(b.name)}</b></div>${b.address ? `<div class="line">${esc(b.address)}</div>` : ''}${b.province ? `<div class="line">${esc(b.province)}</div>` : ''}${b.taxId ? `<div class="line">NTN / CNIC: ${esc(b.taxId)}</div>` : ''}</div></div>
<table><thead><tr><th>Description</th><th class="n">Amount (${esc(i.currency)})</th></tr></thead><tbody><tr><td>Solvexo ${esc(i.planName)} plan${i.type === 'proration' ? ' (plan change)' : i.type === 'initial' ? ' (first payment)' : ''}</td><td class="n">${usd(i.subtotal)}</td></tr></tbody></table>
<table class="totals"><tbody><tr><td>Subtotal</td><td class="n">${usd(i.subtotal)}</td></tr>${taxLine}<tr class="grand"><td>Total</td><td class="n">${usd(i.total)}</td></tr>${refund}</tbody></table>
${fbrBlock}
<p class="ft">Thank you for choosing ${esc(s.legalName || 'Solvexo')}.${i.tax > 0 ? ' Tax shown is Solvexo&#39;s own tax on this plan fee.' : ''}</p>
${printScript}</body></html>`;
}

/**
 * Opens the invoice in a new window and starts printing. The window opens at once (inside the click, so pop-up blockers allow it)
 * and is filled in when the data arrives. Throws a readable message on failure.
 */
export async function openSolvexoInvoice(storeId: string, invoiceId: string): Promise<void> {
  const w = window.open('', '_blank');
  if (!w) throw new Error('Your browser blocked the invoice window. Allow pop-ups for this site and try again.');
  try {
    w.document.title = 'Invoice';
    w.document.body.innerHTML = '<p style="font-family:Arial,sans-serif;padding:24px">Preparing your invoice…</p>';
    const doc = (await apiGetSolvexoInvoiceDoc(storeId, invoiceId)).data;
    let qr: string | null = null;
    if (doc.fbr?.status === 'submitted' && doc.fbr.invoiceNumber) {
      try { qr = await fbrQrDataUrl(doc.fbr.qrText ?? doc.fbr.invoiceNumber); } catch { qr = null; }
    }
    w.document.open();
    w.document.write(buildSolvexoInvoiceHtml(doc, qr));
    w.document.close();
  } catch (e) {
    w.close();
    throw e instanceof Error ? e : new Error('Could not open the invoice.');
  }
}
