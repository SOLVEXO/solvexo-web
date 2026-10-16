/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { Block } from '@/api/services/storefrontTypes';
import { PreviewBlock } from '../../previewInspector';
import { focalOf, mobileHeightOf, type HeightPreset } from '../../imageFit';
import { fashionTheme as t } from '../theme.config';
import { registerFashionSection } from './sectionRegistry';
import { LinkButton } from './SectionShell';

const HEIGHT: Record<Exclude<HeightPreset, 'adapt'>, string> = { small: 'clamp(320px, 46vh, 460px)', medium: 'clamp(420px, 68vh, 680px)', large: 'clamp(520px, 88vh, 900px)' };

/** Last word of the headline set in the serif italic accent face. */
function AccentHeading({ text }: { text: string }) {
  const words = String(text).trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return <>{words.join(' ')} <span className="fx-serif" style={{ fontSize: '1.08em' }}>{last}</span></>;
}

function Slide({ block, height, active, eager }: { block: Block; height: string | undefined; active: boolean; eager: boolean }) {
  const s = block.settings;
  const adapt = !height;
  return (
    <div className="relative w-full shrink-0 overflow-hidden" style={{ height, background: '#1b1b1b' }} aria-hidden={!active}>
      {s.imageUrl && (
        <img src={s.imageUrl} alt={s.heading ?? ''} loading={eager ? 'eager' : 'lazy'}
          className={adapt ? 'block h-auto w-full' : 'absolute inset-0 h-full w-full object-cover'}
          style={adapt ? undefined : { objectPosition: focalOf(s.focalPoint) }} />
      )}
      <div className="absolute inset-0" style={{ background: typeof s.overlayOpacity === 'number' ? `rgba(0,0,0,${Math.min(80, Math.max(0, s.overlayOpacity)) / 100})` : 'linear-gradient(90deg, rgba(0,0,0,.52) 0%, rgba(0,0,0,.18) 55%, rgba(0,0,0,0) 100%)' }} />
      {(s.heading || s.subheading || s.ctaText) && (
        <div className="absolute inset-0 flex items-end md:items-center">
          <div className="mx-auto w-full" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX} 72px`, textAlign: s.contentAlign === 'center' || s.contentAlign === 'right' ? s.contentAlign : 'left' }}>
            <div className={`max-w-[640px] ${s.contentAlign === 'center' ? 'mx-auto' : s.contentAlign === 'right' ? 'ml-auto' : ''}`} style={{ color: typeof s.textColor === 'string' && s.textColor ? s.textColor : '#fff' }}>
              {s.heading && <h1 className="fx-up m-0 mb-5 text-[clamp(38px,6vw,80px)] font-medium leading-[1.04] tracking-tight" style={{ fontFamily: t.fonts.display }}><AccentHeading text={s.heading} /></h1>}
              {s.subheading && <p className="fx-up fx-up-1 m-0 mb-8 max-w-[520px] text-base leading-relaxed opacity-90 md:text-lg" style={{ fontFamily: t.fonts.body }}>{s.subheading}</p>}
              <LinkButton text={s.ctaText} link={s.ctaLink} variant="light" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Hero({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const slides = blocks.filter(b => b.type === 'hero_slide');
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const n = slides.length;
  const auto = settings.autoplay !== false && n > 1 && !paused && !hover;
  const seconds = Math.min(10, Math.max(3, Number(settings.autoplaySeconds) || 5));
  const fade = settings.transition === 'fade';
  const cur = n ? i % n : 0;
  const touch = useRef<number | null>(null);

  useEffect(() => {
    if (!auto) return;
    const id = window.setInterval(() => setI(v => (v + 1) % n), seconds * 1000);
    return () => window.clearInterval(id);
  }, [auto, n, seconds]);

  if (n === 0) return null;
  const desk = (settings.heightPreset ?? 'medium') as HeightPreset;
  const mob = mobileHeightOf(desk, settings.mobileHeightPreset);
  const hd = desk === 'adapt' ? undefined : HEIGHT[desk];
  const hm = mob === 'adapt' ? undefined : HEIGHT[(mob ?? 'medium') as Exclude<HeightPreset, 'adapt'>];
  const go = (d: number) => setI(v => (v + d + n) % n);
  const pagination = settings.pagination ?? 'dots';

  return (
    <section aria-roledescription="carousel" aria-label="Featured" className="relative" style={{ padding: `12px ${t.layout.containerPadX} 0` }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onTouchStart={e => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={e => { if (touch.current != null) { const d = e.changedTouches[0].clientX - touch.current; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); touch.current = null; } }}>
      <style>{`.fx-hero{--h:${hm ?? 'auto'}}@media(min-width:768px){.fx-hero{--h:${hd ?? 'auto'}}}.fx-hero .fx-h{height:var(--h)!important}`}</style>
      <div className="fx-hero mx-auto overflow-hidden" style={{ maxWidth: t.layout.maxWidth, borderRadius: 28 }}>
        {fade ? (
          <div className="relative">
            {slides.map((b, k) => (
              <div key={b._id ?? k} style={{ position: k === 0 ? 'relative' : 'absolute', inset: 0, opacity: k === cur ? 1 : 0, transition: 'opacity .8s ease', pointerEvents: k === cur ? 'auto' : 'none' }}>
                <PreviewBlock blockId={b._id ?? String(k)}><div className="fx-h"><Slide block={b} height={hd ? 'inherit' : undefined} active={k === cur} eager={k === 0} /></div></PreviewBlock>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex" style={{ transform: `translateX(-${cur * 100}%)`, transition: 'transform .7s cubic-bezier(.22,.61,.36,1)' }}>
            {slides.map((b, k) => (
              <div key={b._id ?? k} className="w-full shrink-0">
                <PreviewBlock blockId={b._id ?? String(k)}><div className="fx-h"><Slide block={b} height={hd ? 'inherit' : undefined} active={k === cur} eager={k === 0} /></div></PreviewBlock>
              </div>
            ))}
          </div>
        )}
      </div>

      {n > 1 && settings.showArrows === true && (
        <>
          <button type="button" aria-label="Previous slide" onClick={() => go(-1)} className="absolute left-8 top-1/2 hidden size-11 md:flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-black"><ChevronLeft size={20} /></button>
          <button type="button" aria-label="Next slide" onClick={() => go(1)} className="absolute right-8 top-1/2 hidden size-11 md:flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-black"><ChevronRight size={20} /></button>
        </>
      )}

      {n > 1 && pagination !== 'none' && (
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3">
          {pagination === 'counter'
            ? <span className="text-xs font-medium tracking-widest text-white">{cur + 1} / {n}</span>
            : slides.map((_, k) => (
              <button key={k} type="button" aria-label={`Go to slide ${k + 1}`} aria-current={k === cur} onClick={() => setI(k)} className="h-[3px] cursor-pointer border-0 p-0 transition-all"
                style={{ width: k === cur ? 36 : 20, background: k === cur ? '#fff' : 'rgba(255,255,255,.5)' }} />
            ))}
          {settings.autoplay !== false && settings.showPauseButton === true && (
            <button type="button" aria-label={paused ? 'Play slideshow' : 'Pause slideshow'} onClick={() => setPaused(p => !p)} className="ml-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-black">
              {paused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

registerFashionSection('hero', (section, blocks) => <Hero settings={section.settings} blocks={blocks} />);
