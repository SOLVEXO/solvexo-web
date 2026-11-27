import type { CSSProperties } from 'react';

/** Block-level Style (no-code): every block can carry `settings.style`. All values optional; unset = the theme's own look.
 *  Keep the keys in step with the API validator (`validateBlockStyle`) and the editor panel (`BlockStylePanel`). */
export const BLOCK_STYLE_CSS =
  '.bs-hov-lift{transition:transform .25s ease}.bs-hov-lift:hover{transform:translateY(-4px)}' +
  '.bs-hov-zoom{transition:transform .25s ease}.bs-hov-zoom:hover{transform:scale(1.04)}' +
  '.bs-hov-fade{transition:opacity .25s ease}.bs-hov-fade:hover{opacity:.7!important}' +
  '.bs-hov-shadow{transition:box-shadow .25s ease}.bs-hov-shadow:hover{box-shadow:0 12px 30px rgba(0,0,0,.18)!important}' +
  '.bs-fs>*,.bs-fs{font-size:var(--bs-fs)!important}.bs-fw,.bs-fw *{font-weight:var(--bs-fw)!important}' +
  '.bs-ta-l,.bs-ta-l *{text-align:left!important}.bs-ta-c,.bs-ta-c *{text-align:center!important}.bs-ta-r,.bs-ta-r *{text-align:right!important}' +
  '.bs-tc,.bs-tc :is(h1,h2,h3,h4,h5,h6,p,span,li,a):not(button *){color:var(--bs-tc)!important}' +
  '.bs-hov-tilt{transition:transform .25s ease}.bs-hov-tilt:hover{transform:rotate(-2deg) scale(1.02)}' +
  '.bs-hov-glow{transition:box-shadow .25s ease}.bs-hov-glow:hover{box-shadow:0 0 28px var(--bs-glow,rgba(255,180,80,.55))!important}' +
  // entrance animations reuse the section reveal observer (`.sx-anim` / `data-sx-pre`)
  '.sx-anim.bs-a{transition:opacity var(--sx-ad-dur,.6s) var(--sx-ease,ease) var(--sx-ad,0ms),transform var(--sx-ad-dur,.6s) var(--sx-ease,ease) var(--sx-ad,0ms),filter var(--sx-ad-dur,.6s) var(--sx-ease,ease) var(--sx-ad,0ms),clip-path var(--sx-ad-dur,.6s) var(--sx-ease,ease) var(--sx-ad,0ms)}' +
  '.bs-a-slide-down[data-sx-pre]{transform:translateY(-32px)}.bs-a-zoom-out[data-sx-pre]{transform:scale(1.12)}' +
  '.bs-a-blur[data-sx-pre]{filter:blur(14px)}.bs-a-rotate[data-sx-pre]{transform:rotate(-8deg) scale(.95)}' +
  '.bs-a-flip[data-sx-pre]{transform:perspective(600px) rotateX(-60deg)}.bs-a-bounce[data-sx-pre]{transform:translateY(60px) scale(.9)}' +
  // the start state keeps ~14% visible: the reveal observer needs 12% of the element to count as seen (a fully clipped element never would)
  '.bs-a-wipe[data-sx-pre]{opacity:1!important;clip-path:inset(0 86% 0 0)}.bs-a-wipe{clip-path:inset(0 0 0 0)}' +
  '@keyframes bs-float{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}@keyframes bs-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}' +
  '@keyframes bs-spin{to{transform:rotate(360deg)}}@keyframes bs-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}' +
  '.bs-loop-float{animation:bs-float 3s ease-in-out infinite}.bs-loop-pulse{animation:bs-pulse 2s ease-in-out infinite}.bs-loop-spin{animation:bs-spin 12s linear infinite}.bs-loop-shake{animation:bs-shake .6s ease-in-out infinite}' +
  '@media (prefers-reduced-motion:reduce){.bs-loop-float,.bs-loop-pulse,.bs-loop-spin,.bs-loop-shake{animation:none}}' +
  '@media (max-width:749px){.bs-fsm,.bs-fsm>*{font-size:var(--bs-fsm)!important}.bs-hide-m{display:none!important}}' +
  '@media (min-width:750px){.bs-hide-d{display:none!important}}';

const SHADOWS: Record<string, string> = { soft: '0 2px 10px rgba(0,0,0,.08)', medium: '0 8px 24px rgba(0,0,0,.14)', strong: '0 16px 44px rgba(0,0,0,.25)' };
const WEIGHTS: Record<string, string> = { normal: '400', medium: '500', semibold: '600', bold: '700', black: '900' };
const ALIGN: Record<string, string> = { left: 'l', center: 'c', right: 'r' };
const HOVERS = ['lift', 'zoom', 'fade', 'shadow', 'tilt', 'glow'];
// 'fade', 'slide-up', 'slide-left', 'slide-right', 'zoom' are the section ones (sx-anim-*, defined in sectionSpacing.ts)
const SECTION_ANIMS = ['fade', 'slide-up', 'slide-left', 'slide-right', 'zoom'];
const OWN_ANIMS = ['slide-down', 'zoom-out', 'blur', 'rotate', 'flip', 'bounce', 'wipe'];
const SPEEDS: Record<string, string> = { fast: '.35s', normal: '.6s', slow: '1.1s', 'very-slow': '1.8s' };
const EASES: Record<string, string> = { smooth: 'ease', 'ease-out': 'cubic-bezier(.22,.61,.36,1)', bouncy: 'cubic-bezier(.34,1.56,.64,1)', linear: 'linear' };
const LOOPS = ['float', 'pulse', 'spin', 'shake'];

export function blockStyle(raw: unknown): { className: string; style: CSSProperties } | null {
  if (!raw || typeof raw !== 'object') return null;
  const s = raw as Record<string, unknown>;
  const hex = (v: unknown) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : undefined);
  const n = (v: unknown, min: number, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : undefined);
  const classes: string[] = [];
  const style: Record<string, string | number> = {};
  const set = (k: string, v: string | number | undefined) => { if (v !== undefined) style[k] = v; };

  set('marginTop', n(s.marginTop, -200, 300)); set('marginBottom', n(s.marginBottom, -200, 300));
  set('marginLeft', n(s.marginLeft, -200, 300)); set('marginRight', n(s.marginRight, -200, 300));
  set('paddingTop', n(s.paddingTop, 0, 300)); set('paddingBottom', n(s.paddingBottom, 0, 300));
  set('paddingLeft', n(s.paddingLeft, 0, 300)); set('paddingRight', n(s.paddingRight, 0, 300));
  set('backgroundColor', hex(s.backgroundColor));
  const bw = n(s.borderWidth, 0, 12);
  if (bw) { style.borderWidth = bw; style.borderStyle = 'solid'; style.borderColor = hex(s.borderColor) ?? 'currentColor'; }
  const r = n(s.borderRadius, 0, 200); if (r) { style.borderRadius = r; style.overflow = 'hidden'; }
  const sh = SHADOWS[String(s.shadow)]; if (sh) style.boxShadow = sh;
  const op = n(s.opacity, 0, 100); if (op !== undefined && op < 100) style.opacity = op / 100;
  const mw = n(s.maxWidth, 40, 2000); if (mw) { style.maxWidth = mw; style.width = '100%'; }
  const al = String(s.align);
  if (al === 'center') { style.marginLeft = 'auto'; style.marginRight = 'auto'; }
  else if (al === 'right') style.marginLeft = 'auto';
  const tc = hex(s.textColor); if (tc) { classes.push('bs-tc'); style['--bs-tc'] = tc; }
  const fs = n(s.fontSize, 8, 120); if (fs) { classes.push('bs-fs'); style['--bs-fs'] = `${fs}px`; }
  const fsm = n(s.fontSizeMobile, 8, 120); if (fsm) { classes.push('bs-fsm'); style['--bs-fsm'] = `${fsm}px`; }
  const fw = WEIGHTS[String(s.fontWeight)]; if (fw) { classes.push('bs-fw'); style['--bs-fw'] = fw; }
  const ta = ALIGN[String(s.textAlign)]; if (ta) classes.push(`bs-ta-${ta}`);
  if (HOVERS.includes(String(s.hover))) classes.push(`bs-hov-${s.hover}`);
  const an = String(s.animation);
  if (SECTION_ANIMS.includes(an) || OWN_ANIMS.includes(an)) {
    classes.push('sx-anim', 'bs-a', SECTION_ANIMS.includes(an) ? `sx-anim-${an}` : `bs-a-${an}`);
    const dl = n(s.animationDelay, 0, 3000); if (dl) style['--sx-ad'] = `${dl}ms`;
    const sp = SPEEDS[String(s.animationSpeed)]; if (sp) style['--sx-ad-dur'] = sp;
    const ez = EASES[String(s.animationEase)]; if (ez) style['--sx-ease'] = ez;
  }
  if (LOOPS.includes(String(s.loop))) classes.push(`bs-loop-${s.loop}`);
  if (s.visibility === 'desktop') classes.push('bs-hide-m');
  else if (s.visibility === 'mobile') classes.push('bs-hide-d');

  if (!classes.length && !Object.keys(style).length) return null;
  return { className: classes.join(' '), style: style as CSSProperties };
}

export function blockStyleProps(raw: unknown): { className?: string; style?: CSSProperties } {
  return blockStyle(raw) ?? {};
}
