/**
 * Script-specific web fonts for RTL storefront languages. Fonts come from
 * Google Fonts through a <link> stylesheet (the same host/mechanism index.css
 * already uses for the Latin fonts), injected once and only when needed.
 */
const FONT_LINK_ID = 'solvexo-script-fonts';
const FONT_STYLE_ID = 'solvexo-script-font-rules';

const URDU_STACK = "'Noto Nastaliq Urdu', 'Noto Naskh Arabic', 'Segoe UI', Tahoma, serif";
const ARABIC_STACK = "'Noto Sans Arabic', 'Segoe UI', Tahoma, sans-serif";

const FONT_CSS_URLS: Record<string, string> = {
  ur: 'https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&family=Noto+Naskh+Arabic:wght@400;700&display=swap',
  ar: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap',
  fa: 'https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600;700&display=swap',
};

/** Font stack for a language, or null when the default fonts are fine. */
export function getFontFamily(lang: string): string | null {
  if (lang === 'ur') return URDU_STACK;
  if (lang === 'ar' || lang === 'fa') return ARABIC_STACK;
  return null;
}

/** Idempotent: one <link> and one <style>, re-pointed on every language change. */
export function applyScriptFonts(lang: string): void {
  if (typeof document === 'undefined') return;
  const url = FONT_CSS_URLS[lang];
  let link = document.getElementById(FONT_LINK_ID) as HTMLLinkElement | null;
  if (url) {
    if (!link) {
      link = document.createElement('link');
      link.id = FONT_LINK_ID;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    if (link.href !== url) link.href = url;
  } else if (link) {
    link.remove();
  }

  const family = getFontFamily(lang);
  let style = document.getElementById(FONT_STYLE_ID) as HTMLStyleElement | null;
  if (!family) { style?.remove(); return; }
  if (!style) {
    style = document.createElement('style');
    style.id = FONT_STYLE_ID;
    document.head.appendChild(style);
  }
  // Themes set font-family inline, so the script font has to win for buyer text; icons are SVG and unaffected.
  style.textContent = `html[lang="${lang}"] body, html[lang="${lang}"] body *:not(svg):not(svg *) { font-family: ${family} !important; }`
    + (lang === 'ur' ? `html[lang="ur"] body { line-height: 1.8; }` : '');
}
