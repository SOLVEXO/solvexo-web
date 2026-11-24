/**
 * The server-rendered page, kept as HTML text when the browser app starts. React replaces the server HTML when it mounts, and
 * while a lazy chunk it needs is still downloading its Suspense fallback would show instead - a blank or skeleton flash right
 * after the real page was visible. These fallbacks show this snapshot instead, so what the visitor sees does not change.
 * It is the page's own markup from the same server response (nothing from outside), taken before React touches it.
 */
let snapshot = '';

/** Call once, before the app renders. No-op when the page was not server-rendered. */
export function captureSsrSnapshot(): void {
  if (typeof document === 'undefined') return;
  // Not `firstElementChild`: React puts resource hints (<link rel="preload">) in front of the page's own markup.
  const wrapper = document.querySelector('#root > [data-sx-ssr]');
  snapshot = wrapper ? wrapper.innerHTML : '';
}

/** The server-rendered markup (inside the page's scroll container), or '' when there is none. */
export function ssrSnapshot(): string {
  return snapshot;
}
