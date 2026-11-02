/** Small CSV helpers for the shared bulk-import flow (template + failed-rows downloads). */

// Spreadsheet apps run cells that start with = + - @ as formulas; prefix such
// text with an apostrophe-style guard (numbers like -5 are left alone).
function guard(cell: string): string {
  if (/^[=+@]/.test(cell) || (/^-/.test(cell) && Number.isNaN(Number(cell)))) return `'${cell}`;
  return cell;
}

function quote(cell: string): string {
  const safe = guard(cell);
  return /[",\n\r;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function buildCsv(headers: string[], rows: string[][]): string {
  return [headers, ...rows].map(r => r.map(c => quote(String(c ?? ''))).join(',')).join('\r\n') + '\r\n';
}

/** Saves text as a file. The UTF-8 BOM makes Excel read non-English text correctly. */
export function downloadTextFile(filename: string, text: string): void {
  const BOM = '﻿';
  const withBom = text.startsWith(BOM) ? text : `${BOM}${text}`;
  const url = URL.createObjectURL(new Blob([withBom], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/**
 * Reads CSV text into rows of cells (RFC 4180: quoted cells may hold commas, quotes as "" and line breaks).
 * Handles a UTF-8 BOM, \r\n or \n line ends, and a `;` or tab separator when the header row uses one
 * (Excel in some locales). Blank lines are dropped.
 */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^\uFEFF/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const count = (ch: string) => firstLine.split(ch).length - 1;
  const sep = count(',') >= count(';') && count(',') >= count('\t') ? ',' : count(';') >= count('\t') ? ';' : '\t';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"' && cell === '') quoted = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some(c => c.trim() !== '')) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some(c => c.trim() !== '')) rows.push(row);
  return rows;
}
