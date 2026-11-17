/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON */
import { useCallback, useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Power } from 'lucide-react';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { scrollRootRef } from '@/utils/scrollRoot';
import { PreviewBlock } from '../../previewInspector';
import '../ledup-signature.css';

export const txt = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');

/** Runs `fn` on every scroll of the page's scroll container (the app scrolls inside RootLayout's div, not window). */
export function useScrollTick(fn: () => void, deps: unknown[] = []) {
  useEffect(() => {
    const target: HTMLElement | Window = scrollRootRef.current ?? window;
    let raf = 0;
    const run = () => { raf = 0; fn(); };
    const on = () => { if (!raf) raf = requestAnimationFrame(run); };
    target.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    on();
    return () => { target.removeEventListener('scroll', on); window.removeEventListener('resize', on); if (raf) cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `fn` reads refs; the caller lists what should re-subscribe
  }, deps);
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Seller link setting -> in-app Link or external anchor. */
export function LinkOrDiv({ link, className, children, style }: { link?: any; className?: string; children: ReactNode; style?: React.CSSProperties }) {
  const { resolveLink } = useStorefront();
  const target = link && link.linkType !== 'none' && link.type !== 'none' ? resolveLink(link) : null;
  if (target?.to) return <Link to={target.to} className={className} style={style}>{children}</Link>;
  if (target?.href) return <a href={target.href} className={className} style={style} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
  return <div className={className} style={style}>{children}</div>;
}

export function HeadBlock({ eyebrow, heading, text, align = 'center' }: { eyebrow?: string; heading?: string; text?: string; align?: 'center' | 'left' }) {
  if (!eyebrow && !heading && !text) return null;
  return (
    <div className="lds-head" style={align === 'left' ? { textAlign: 'left', margin: '0 0 40px' } : undefined}>
      {eyebrow && <p className="lds-eyebrow">{eyebrow}</p>}
      {heading && <h2 className="lds-h2">{heading}</h2>}
      {text && <p className="lds-p">{text}</p>}
    </div>
  );
}

// ───────────────────────── Bento ("Destaques") ─────────────────────────
const TILE_H: Record<string, number> = { compact: 125, short: 218, medium: 260, standard: 297, tall: 340 };

export function Bento({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  if (blocks.length === 0) return null;
  return (
    <section className="lds" style={{ padding: '120px 0 0' }}>
      <div className="lds-wrap">
        <HeadBlock eyebrow={txt(settings.eyebrow)} heading={txt(settings.heading)} text={txt(settings.text)} />
        <div className="lds-bento">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            const img = txt(s.imageUrl);
            const tone: 'photo' | 'light' | 'stat' = s.tone === 'stat' ? 'stat' : s.tone === 'light' || (!img && s.tone !== 'photo') ? 'light' : 'photo';
            const size = ['small', 'medium', 'wide', 'full'].includes(s.size) ? s.size : 'normal';
            const h = TILE_H[String(s.height)] ?? (tone === 'stat' ? 125 : tone === 'photo' ? (size === 'wide' ? 297 : 260) : 297);
            const hasLink = !!s.link && s.link.linkType !== 'none' && s.link.type !== 'none';
            const cls = `lds-tile lds-tile--${tone} s-${size}`;
            const style = { height: h };
            let inner: ReactNode;
            if (tone === 'stat') {
              inner = <><strong><bdi>{txt(s.title)}</bdi></strong>{txt(s.caption) && <span>{txt(s.caption)}</span>}</>;
            } else if (tone === 'photo') {
              inner = (
                <>
                  {img && <img src={img} alt="" loading="lazy" />}
                  <div className="lds-tile-foot">
                    <span className="lds-tile-title">{txt(s.title)}</span>
                    {hasLink && <span className="lds-circ" aria-hidden><ArrowUpRight size={22} strokeWidth={1.4} /></span>}
                  </div>
                </>
              );
            } else {
              inner = (
                <>
                  <div className="lds-tile-img">{img && <img src={img} alt={txt(s.title)} loading="lazy" />}</div>
                  <span className="lds-tile-title">{txt(s.title)}</span>
                </>
              );
            }
            return <PreviewBlock key={id} blockId={id}><LinkOrDiv link={hasLink ? s.link : undefined} className={cls} style={style}>{inner}</LinkOrDiv></PreviewBlock>;
          })}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Projects: drag carousel + rotating badge ─────────────────────────
function Badge({ label }: { label: string }) {
  const id = 'lds-badge-path';
  return (
    <div className="lds-badge" aria-hidden>
      <svg viewBox="0 0 160 160">
        <defs><path id={id} d="M80,80 m-62,0 a62,62 0 1,1 124,0 a62,62 0 1,1 -124,0" /></defs>
        <g className="lds-badge-spin">
          <text fill="#8c847e" fontSize="10.5" letterSpacing="2.2" fontFamily="Poppins, sans-serif"><textPath href={`#${id}`}>{`${label.toUpperCase()}  ·  `}</textPath></text>
        </g>
        <path d="M52 80h52M92 68l12 12-12 12" fill="none" stroke="#8c847e" strokeWidth="1" />
      </svg>
    </div>
  );
}

export function Projects({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const track = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; left: number; moved: boolean } | null>(null);
  const [dragging, setDragging] = useState(false);
  if (blocks.length === 0) return null;
  const down = (e: React.PointerEvent<HTMLDivElement>) => { if (!track.current) return; drag.current = { x: e.clientX, left: track.current.scrollLeft, moved: false }; };
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current; if (!d || !track.current) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) { d.moved = true; setDragging(true); }
    track.current.scrollLeft = d.left - dx;
  };
  const up = () => { drag.current = null; setDragging(false); };
  return (
    <section className="lds" style={{ paddingTop: 40 }}>
      <div className="lds-projects">
        <div className="lds-projects-grid">
          <div className="lds-projects-text">
            <Badge label={txt(settings.dragText) || 'Arrastar para ver mais projetos incríveis'} />
            <div className="lds-projects-copy">
              {txt(settings.eyebrow) && <p className="lds-eyebrow">{txt(settings.eyebrow)}</p>}
              {txt(settings.heading) && <h2 className="lds-h2">{txt(settings.heading)}</h2>}
              {txt(settings.text) && <p className="lds-p">{txt(settings.text)}</p>}
            </div>
          </div>
          <div ref={track} className={`lds-track ${dragging ? 'is-drag' : ''}`} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up}>
            {blocks.map((b, i) => {
              const s = (b.settings ?? {}) as Record<string, any>;
              const id = String(b._id ?? i);
              const dots = txt(s.hotspots).split(';').map(p => p.split(',').map(n => parseFloat(n))).filter(p => p.length === 2 && p.every(Number.isFinite));
              return (
                <PreviewBlock key={id} blockId={id}>
                  <figure className="lds-shot m-0">
                    {txt(s.imageUrl) && <img src={txt(s.imageUrl)} alt={txt(s.title)} loading="lazy" draggable={false} />}
                    {dots.map((p, k) => <span key={k} className="lds-dot" style={{ left: `${p[0]}%`, top: `${p[1]}%` }} />)}
                    {txt(s.title) && <figcaption className="lds-shot-cap">{txt(s.title)}</figcaption>}
                  </figure>
                </PreviewBlock>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Statement ─────────────────────────
export function Statement({ settings }: { settings: Record<string, any> }) {
  const heading = txt(settings.heading);
  if (!heading && !txt(settings.text) && !txt(settings.imageUrl)) return null;
  return (
    <section className="lds lds-statement">
      <div className="lds-wrap">
        {txt(settings.eyebrow) && <p className="lds-eyebrow">{txt(settings.eyebrow)}</p>}
        {heading && <h2 className="lds-h2">{heading}</h2>}
        {txt(settings.text) && <p className="lds-p">{txt(settings.text)}</p>}
        {txt(settings.ctaText) && <LinkOrDiv link={settings.ctaLink} className="lds-pill">{txt(settings.ctaText)} <ArrowUpRight size={14} aria-hidden /></LinkOrDiv>}
      </div>
      {txt(settings.imageUrl) && <img className="lds-statement-img" src={txt(settings.imageUrl)} alt="" loading="lazy" />}
    </section>
  );
}

// ───────────────────────── Lighting simulation ("Interruptores") ─────────────────────────
export function Simulation({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const [on, setOn] = useState<Record<string, boolean>>({});
  const scene = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLDivElement>(null);
  // The picture starts narrow and rounded and grows to the full width while the section scrolls into view.
  const grow = useCallback(() => {
    const el = scene.current; const fr = frame.current; if (!el || !fr) return;
    if (reducedMotion()) { el.style.width = '100%'; el.style.borderRadius = '0'; return; }
    const vh = window.innerHeight;
    const p = clamp01((vh - fr.getBoundingClientRect().top) / (vh * 0.95));
    el.style.width = `${70 + 30 * p}%`;
    el.style.borderRadius = `${20 * (1 - p)}px`;
  }, []);
  useScrollTick(grow, [grow]);
  if (blocks.length === 0) return null;
  const base = txt(settings.baseImage);
  const lit = txt(settings.onImage);
  const count = blocks.filter((b, i) => on[String(b._id ?? i)]).length;
  return (
    <section className="lds lds-sim" data-ld-dark>
      <div className="lds-sim-frame" ref={frame}>
        <div className="lds-sim-scene" ref={scene} style={{ width: '70%', borderRadius: 20 }}>
          {base && <img src={base} alt="" loading="lazy" />}
          {lit && <img className="lds-layer" src={lit} alt="" loading="lazy" style={{ opacity: count / blocks.length }} />}
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            const img = txt(s.imageUrl);
            if (img) return <img key={id} className="lds-layer" src={img} alt="" loading="lazy" style={{ opacity: on[id] ? 1 : 0 }} />;
            if (lit) return null;
            return <div key={id} className={`lds-sim-glow ${on[id] ? 'is-on' : ''}`} style={{ ['--gx' as string]: `${Math.round(((i + 0.5) / blocks.length) * 100)}%` }} />;
          })}
        </div>
        {txt(settings.label) && <p className="lds-sim-label">{txt(settings.label)}</p>}
        <div className="lds-sim-row">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            return (
              <PreviewBlock key={id} blockId={id}>
                <div className="lds-sim-item">
                  <button type="button" className="lds-switch" aria-pressed={!!on[id]} aria-label={txt(s.title)} onClick={() => setOn(p => ({ ...p, [id]: !p[id] }))}><i><Power size={14} aria-hidden /></i></button>
                  <span className="lds-sim-name">{txt(s.title)}</span>
                </div>
              </PreviewBlock>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── Stacked values card ─────────────────────────
const SHADES = ['#4b423b', '#50473f', '#5a514a', '#655c55', '#716862', '#7a716b'];

export function Stacked({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const [open, setOpen] = useState(0);
  const bodies = useRef<(HTMLDivElement | null)[]>([]);
  if (blocks.length === 0 && !txt(settings.heading)) return null;
  const list = blocks.length ? blocks : [];
  return (
    <section className="lds" style={{ padding: '120px 0 40px' }} data-ld-dark>
      <div className="lds-stack">
        {list.map((b, i) => {
          const s = (b.settings ?? {}) as Record<string, any>;
          const id = String(b._id ?? i);
          const active = i === open;
          const heading = txt(s.heading) || (i === 0 ? txt(settings.heading) : '');
          const text = txt(s.text) || (i === 0 ? txt(settings.text) : '');
          const img1 = txt(s.imageUrl) || (i === 0 ? txt(settings.imageUrl) : '');
          const img2 = txt(s.imageUrl2) || (i === 0 ? txt(settings.imageUrl2) : '');
          const body = bodies.current[i];
          return (
            <PreviewBlock key={id} blockId={id}>
              <div className="lds-stack-item" style={{ background: SHADES[Math.min(i, SHADES.length - 1)], zIndex: list.length - i }}>
                <div className="lds-stack-body" ref={el => { bodies.current[i] = el; }} aria-hidden={!active}
                  style={{ maxHeight: active ? (body ? body.scrollHeight + 40 : 760) : 0, opacity: active ? 1 : 0 }}>
                  <div className="lds-stack-copy">
                    {heading && <h2>{heading}</h2>}
                    {text && <p>{text}</p>}
                  </div>
                  <div className="lds-stack-imgs">
                    {img1 && <img src={img1} alt="" loading="lazy" />}
                    {img2 && <img src={img2} alt="" loading="lazy" />}
                  </div>
                </div>
                <button type="button" className="lds-stack-bar" aria-expanded={active} onClick={() => setOpen(i)}>
                  <b>{String(i + 1).padStart(2, '0')}.</b><span>{txt(s.title)}</span>
                </button>
              </div>
            </PreviewBlock>
          );
        })}
      </div>
    </section>
  );
}

export type { RefObject };
