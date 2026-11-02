import type { StockCount, StockCountItem } from '@/api/services/stockCounts';

// Print-ready documents for a stock count, opened in a new window like the order documents:
//  - Count sheet: taken to the shelves BEFORE counting (blind by default: no system quantity,
//    so the counter writes what is really there).
//  - Count report: the result AFTER counting: totals, every difference, and the full list.

export interface StockCountDocStore { name: string; locationName?: string | null; printedBy?: string | null }
export interface SheetOptions { showSystemQty: boolean; showPhotos: boolean }

const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const when = (iso?: string | null) => (iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—');

/** Same product's variants stay together, so one shelf is counted in one go. */
function ordered(items: StockCountItem[]): StockCountItem[] {
  return [...items].sort((a, b) => a.productName.localeCompare(b.productName) || (a.variantLabel ?? '').localeCompare(b.variantLabel ?? '') || (a.sku ?? '').localeCompare(b.sku ?? ''));
}

export interface CountSummary { lines: number; counted: number; notCounted: number; matched: number; short: number; over: number; unitsShort: number; unitsOver: number; net: number }

export function summarizeCount(items: StockCountItem[]): CountSummary {
  const s: CountSummary = { lines: items.length, counted: 0, notCounted: 0, matched: 0, short: 0, over: 0, unitsShort: 0, unitsOver: 0, net: 0 };
  for (const i of items) {
    if (i.countedQty == null) { s.notCounted++; continue; }
    s.counted++;
    const d = i.countedQty - i.systemQty;
    if (d === 0) s.matched++;
    else if (d < 0) { s.short++; s.unitsShort += -d; }
    else { s.over++; s.unitsOver += d; }
    s.net += d;
  }
  return s;
}

const CSS = `
@page{size:A4;margin:12mm}
*{box-sizing:border-box}
body{margin:0;font:12px/1.4 -apple-system,"Segoe UI",Roboto,Arial,sans-serif;color:#111}
h1{font-size:20px;margin:0}h2{font-size:14px;margin:22px 0 6px}
.head{display:flex;justify-content:space-between;gap:16px;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:10px}
.meta{color:#555;margin-top:3px}.meta b{color:#111}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:#555;border-bottom:1.5px solid #111;padding:6px 6px}
td{padding:7px 6px;border-bottom:1px solid #ddd;vertical-align:middle}
thead{display:table-header-group}tr{break-inside:avoid}
.n{text-align:right;white-space:nowrap}.c{text-align:center}
.nm{font-weight:600}.tag{display:inline-block;margin-left:6px;padding:1px 6px;border:1px solid #999;border-radius:4px;font-size:11px;font-weight:600}
.sku{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#333}
.box{display:inline-block;width:70px;height:22px;border:1.5px solid #111;border-radius:3px}
.note{width:24%}.note div{height:22px;border-bottom:1px solid #aaa}
.img{width:44px}.img img{width:38px;height:38px;object-fit:cover;border-radius:5px;border:1px solid #ddd;display:block}
.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:10px 0}
.card{border:1px solid #ccc;border-radius:6px;padding:8px 10px}.card b{display:block;font-size:18px}.card span{color:#555;font-size:11px}
.neg{color:#b91c1c;font-weight:700}.pos{color:#15803d;font-weight:700}.mut{color:#777}
.sign{display:flex;gap:40px;margin-top:34px}.sign div{flex:1;border-top:1px solid #111;padding-top:4px;color:#555;font-size:11px}
.ft{margin-top:14px;color:#777;font-size:10.5px}
`;

function page(title: string, body: string): string {
  const printScript = `<script>(function(){var done=false;function go(){if(done)return;done=true;setTimeout(function(){window.print()},150)}
var imgs=[].slice.call(document.images);var left=imgs.length;if(!left){go();return}
function one(){left--;if(left<=0)go()}
imgs.forEach(function(i){if(i.complete)one();else{i.addEventListener('load',one);i.addEventListener('error',one)}});
setTimeout(go,5000)})();</script>`;
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title><style>${CSS}</style></head><body>${body}${printScript}</body></html>`;
}

const nameCell = (i: StockCountItem) => `<span class="nm">${esc(i.productName)}</span>${i.variantLabel ? `<span class="tag">${esc(i.variantLabel)}</span>` : ''}`;

function header(title: string, count: StockCount, store: StockCountDocStore, extra = ''): string {
  return `<div class="head"><div><h1>${esc(title)}</h1><div class="meta"><b>${esc(store.name)}</b> · ${esc(store.locationName || 'All stock')}</div></div>
<div class="meta" style="text-align:right">Started: <b>${esc(when(count.startedAt))}</b>${extra}</div></div>`;
}

export function buildCountSheetHtml(count: StockCount, store: StockCountDocStore, opts: SheetOptions): string {
  const rows = ordered(count.items).map((i, n) => `<tr>
<td class="c mut">${n + 1}</td>${opts.showPhotos ? `<td class="img">${i.image ? `<img src="${esc(i.image)}" alt="">` : ''}</td>` : ''}
<td>${nameCell(i)}</td><td class="sku">${esc(i.sku ?? '—')}</td>${opts.showSystemQty ? `<td class="n">${i.systemQty}</td>` : ''}
<td class="c"><span class="box"></span></td><td class="note"><div></div></td></tr>`).join('');
  const body = `${header('Stock count sheet', count, store, `<br>Lines: <b>${count.items.length}</b>`)}
<table><thead><tr><th class="c">#</th>${opts.showPhotos ? '<th></th>' : ''}<th>Product / variant</th><th>SKU</th>${opts.showSystemQty ? '<th class="n">System</th>' : ''}<th class="c">Counted</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>
<div class="sign"><div>Counted by</div><div>Checked by</div><div>Date</div></div>
<p class="ft">Count what is physically on the shelf. Enter the numbers in Solvexo → Inventory → Stock Counts.${store.printedBy ? ` Printed by ${esc(store.printedBy)}.` : ''}</p>`;
  return page(`Stock count sheet — ${store.name}`, body);
}

const diffCell = (d: number) => `<td class="n ${d < 0 ? 'neg' : d > 0 ? 'pos' : 'mut'}">${d > 0 ? '+' : ''}${d}</td>`;

export function buildCountReportHtml(count: StockCount, store: StockCountDocStore): string {
  const items = ordered(count.items);
  const sum = summarizeCount(items);
  const diffs = items.filter(i => i.countedQty != null && i.countedQty !== i.systemQty);
  const line = (i: StockCountItem, n: number) => {
    const counted = i.countedQty;
    return `<tr><td class="c mut">${n}</td><td>${nameCell(i)}</td><td class="sku">${esc(i.sku ?? '—')}</td><td class="n">${i.systemQty}</td>
<td class="n">${counted == null ? '<span class="mut">not counted</span>' : counted}</td>${counted == null ? '<td class="n mut">—</td>' : diffCell(counted - i.systemQty)}</tr>`;
  };
  const head = '<thead><tr><th class="c">#</th><th>Product / variant</th><th>SKU</th><th class="n">System</th><th class="n">Counted</th><th class="n">Difference</th></tr></thead>';
  const status = count.status === 'completed' ? `Completed: <b>${esc(when(count.completedAt))}</b>` : count.status === 'cancelled' ? 'Status: <b>Cancelled</b>' : 'Status: <b>In progress</b> (adjustments not applied yet)';
  const netCls = sum.net < 0 ? 'neg' : sum.net > 0 ? 'pos' : '';
  const body = `${header('Stock count report', count, store, `<br>${status}`)}
<div class="cards">
<div class="card"><b>${sum.counted} / ${sum.lines}</b><span>lines counted${sum.notCounted ? ` (${sum.notCounted} not counted)` : ''}</span></div>
<div class="card"><b>${sum.matched}</b><span>matched the system</span></div>
<div class="card"><b>${sum.short + sum.over}</b><span>with a difference (${sum.short} short, ${sum.over} over)</span></div>
<div class="card"><b class="${netCls}">${sum.net > 0 ? '+' : ''}${sum.net}</b><span>net units (−${sum.unitsShort} / +${sum.unitsOver})</span></div>
</div>
<h2>Differences (${diffs.length})</h2>
${diffs.length ? `<table>${head}<tbody>${diffs.map((i, n) => line(i, n + 1)).join('')}</tbody></table>` : '<p class="mut">No differences: every counted line matches the system quantity.</p>'}
<h2>All lines (${items.length})</h2>
<table>${head}<tbody>${items.map((i, n) => line(i, n + 1)).join('')}</tbody></table>
<div class="sign"><div>Counted by</div><div>Approved by</div><div>Date</div></div>
<p class="ft">Printed ${esc(when(new Date().toISOString()))}${store.printedBy ? ` by ${esc(store.printedBy)}` : ''}. "System" is the quantity when the count started.</p>`;
  return page(`Stock count report — ${store.name}`, body);
}

/** Opens the document in a new window and prints it. Returns false when the browser blocked the window. */
export function openCountDocument(html: string): boolean {
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const w = window.open(url, '_blank');
  if (!w) { URL.revokeObjectURL(url); return false; }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
