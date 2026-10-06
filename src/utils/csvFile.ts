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
