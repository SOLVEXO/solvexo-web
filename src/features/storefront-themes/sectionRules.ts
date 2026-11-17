/** "Show this section only when…" rules every section may carry (Design v2). Pure logic, no React:
 *  the section wrapper evaluates it for the current visitor. These rules only decide what is DRAWN; they are
 *  not a security feature (the section content is still part of the page data). Unset rule = no restriction. */

export interface SectionRuleContext {
  /** Signed in with a real account (a guest-checkout session does not count). */
  loggedIn: boolean;
  /** Visitor country (ISO2) or null when unknown. */
  country: string | null;
  /** Active content language ("en", "ur", "pt-BR"...) or null. */
  language: string | null;
  /** Current time, ms since epoch. */
  now: number;
}

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/;

/** A saved schedule value -> ms since epoch. The editor saves an exact moment (ISO, e.g. "2026-12-01T04:30:00.000Z"); a bare "2026-12-01T09:30" is read on the visitor's own clock. */
export function localDateTimeToMs(value: string): number | null {
  const t = /[zZ]$|[+-]d{2}:?d{2}$/.test(value) ? Date.parse(value) : (() => {
    const m = LOCAL_RE.exec(value);
    return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5])).getTime() : NaN;
  })();
  return Number.isFinite(t) ? t : null;
}

function codes(value: unknown, upper: boolean): string[] {
  if (typeof value !== 'string') return [];
  return value.split(/[\s,;]+/).map(x => x.trim()).filter(Boolean).map(x => (upper ? x.toUpperCase() : x.toLowerCase()));
}

const RULE_KEYS = ['showTo', 'showFrom', 'showUntil', 'showCountries', 'hideCountries', 'showLanguages'] as const;

/** True when the section carries at least one rule (so the wrapper only does the work when needed). */
export function hasSectionRules(settings: Record<string, unknown> | undefined): boolean {
  if (!settings) return false;
  return RULE_KEYS.some(k => {
    const v = settings[k];
    return typeof v === 'string' && v !== '' && v !== 'all';
  });
}

/** Is the section allowed to show for this visitor? Unknown country: a "show only in" list hides it, a "hide in" list does not. */
export function sectionAllowed(settings: Record<string, unknown> | undefined, ctx: SectionRuleContext): boolean {
  if (!settings || !hasSectionRules(settings)) return true;
  if (settings.showTo === 'guests' && ctx.loggedIn) return false;
  if (settings.showTo === 'customers' && !ctx.loggedIn) return false;

  if (typeof settings.showFrom === 'string' && settings.showFrom) {
    const from = localDateTimeToMs(settings.showFrom);
    if (from !== null && ctx.now < from) return false;
  }
  if (typeof settings.showUntil === 'string' && settings.showUntil) {
    const until = localDateTimeToMs(settings.showUntil);
    if (until !== null && ctx.now >= until) return false;
  }

  const only = codes(settings.showCountries, true);
  if (only.length && (!ctx.country || !only.includes(ctx.country.toUpperCase()))) return false;
  const hidden = codes(settings.hideCountries, true);
  if (hidden.length && ctx.country && hidden.includes(ctx.country.toUpperCase())) return false;

  const langs = codes(settings.showLanguages, false);
  if (langs.length) {
    const base = (ctx.language ?? '').toLowerCase().split('-')[0];
    if (!base || !langs.some(l => l.split('-')[0] === base)) return false;
  }
  return true;
}
