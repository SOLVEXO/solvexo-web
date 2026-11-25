/** The one look of a text-like control (input, textarea, dropdown trigger). Change it here and every field follows. */
// 16px below `sm` on purpose: iOS Safari auto-zooms the whole page whenever a
// focused input renders under 16px. Desktop keeps the tighter 13px scale.
export const CONTROL_BASE =
  'w-full py-[9px] px-3 rounded-md border border-bone bg-white text-[16px] sm:text-[13px] text-charcoal ' +
  'pointer-coarse:min-h-11 outline-none transition-[border-color,box-shadow] duration-150 ' +
  'placeholder:text-slate focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 ' +
  'disabled:opacity-50 disabled:bg-cream';

/** Compact version used in toolbars (filters next to a search box). */
export const CONTROL_FILTER =
  'w-full min-w-0 rounded-lg border border-bone bg-white text-[13px] pointer-coarse:text-[16px] pointer-coarse:min-h-11 ' +
  'text-carbon pl-3 pr-2 py-[7px] outline-none cursor-pointer hover:bg-cream transition-colors ' +
  'focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 disabled:opacity-50 disabled:cursor-not-allowed';
