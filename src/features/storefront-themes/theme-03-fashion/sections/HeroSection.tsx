/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { imgProps } from '../components/imgProps';
import { HERO_SRCSET_WIDTHS } from '@/utils/cloudinaryImage';
import { ts } from '@/utils/tStatic';
import { useEffect, useRef, useState } from 'react';
import { isDocumentRtl, swipeStep, trackOffsetPct } from '../carouselDirection';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import type { Block } from '@/api/services/storefrontTypes';
import { PreviewBlock } from '../../previewInspector';
import { focalOf, mobileHeightOf, type HeightPreset } from '../../imageFit';
import { fashionTheme as t } from '../theme.config';
import { registerFashionSection } from './sectionRegistry';
import { LinkButton } from './SectionShell';
import { EditableText, useInlineEditActive } from '../../inlineEdit';

const HEIGHT: Record<Exclude<HeightPreset, 'adapt'>, string> = { small: 'clamp(320px, 46vh, 460px)', medium: 'clamp(420px, 68vh, 680px)', large: 'clamp(520px, 88vh, 900px)' };

/** Last word of the headline set in the serif italic accent face. */
function AccentHeading({ text }: { text: string }) {
  const words = String(text).trim().split(/\s+/);
  if (words.length < 2) return <>{text}</>;
  const last = words.pop();
  return <>{words.join(' ')} <span className="fx-serif" style={{ fontSize: '1.08em' }}>{last}</span></>;
}

/** The slide's heading / text / button. Used over the image, and again under it on phones when the seller picks "Below image". */
function SlideText({ block, color, onImage }: { block: Block; color: string; onImage: boolean }) {
  const s = block.settings;
  const editing = useInlineEditActive();
  return (
    <div className={`${onImage ? 'fx-on-image' : ''} max-w-[640px] ${s.contentAlign === 'center' ? 'mx-auto' : s.contentAlign === 'right' ? 'ml-auto' : ''}`} style={{ color }}>
      {s.heading && <h1 className="fx-up m-0 mb-5 text-[clamp(38px,6vw,80px)] font-medium leading-[1.04] tracking-tight" style={{ fontFamily: t.fonts.display }}>{editing ? <EditableText value={s.heading} settingKey="heading" blockId={block._id ?? null} /> : <AccentHeading text={s.heading} />}</h1>}
      {s.subheading && <p className="fx-up fx-up-1 m-0 mb-8 max-w-[520px] text-base leading-relaxed opacity-90 md:text-lg" style={{ fontFamily: t.fonts.body }}><EditableText value={s.subheading} settingKey="subheading" blockId={block._id ?? null} /></p>}
      <LinkButton text={s.ctaText} link={s.ctaLink} variant={onImage ? 'light' : 'outline'} />
    </div>
  );
}

const hasText = (b: Block) => !!(b.settings.heading || b.settings.subheading || b.settings.ctaText);

function Slide({ block, height, active, eager, below }: { block: Block; height: string | undefined; active: boolean; eager: boolean; below: boolean }) {
  const s = block.settings;
  const adapt = !height;
  return (
    <div className="relative w-full shrink-0 overflow-hidden" style={{ height, background: '#1b1b1b' }} aria-hidden={!active}>
      {s.imageUrl && (
        <img {...imgProps(s.imageUrl, HERO_SRCSET_WIDTHS, '100vw')} alt={s.heading ?? ''} loading={eager ? 'eager' : 'lazy'} fetchPriority={eager ? 'high' : undefined}
          className={adapt ? 'block h-auto w-full' : 'absolute inset-0 h-full w-full object-cover'}
          style={adapt ? undefined : { objectPosition: focalOf(s.focalPoint) }} />
      )}
      <div className="absolute inset-0" style={{ background: typeof s.overlayOpacity === 'number' ? `rgba(0,0,0,${Math.min(80, Math.max(0, s.overlayOpacity)) / 100})` : 'linear-gradient(90deg, rgba(0,0,0,.52) 0%, rgba(0,0,0,.18) 55%, rgba(0,0,0,0) 100%)' }} />
      {hasText(block) && (
        // "Below image" on phones: no text over the picture there (it appears under it instead, see Hero).
        <div className={`absolute inset-0 ${below ? 'hidden md:flex' : 'flex'} items-end md:items-center`}>
          <div className="mx-auto w-full" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX} 72px`, textAlign: s.contentAlign === 'center' || s.contentAlign === 'right' ? s.contentAlign : 'left' }}>
            <SlideText block={block} onImage color={typeof s.textColor === 'string' && s.textColor ? s.textColor : '#fff'} />
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
  const rtl = isDocumentRtl();

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
  const below = settings.mobileTextLayout === 'below';
  // One slide = the image box + (phones, "Below image" only) its text underneath.
  const slideBody = (b: Block, k: number) => (
    <>
      <PreviewBlock blockId={b._id ?? String(k)}><div className="fx-h"><Slide block={b} height={hd ? 'inherit' : undefined} active={k === cur} eager={k === 0} below={below} /></div></PreviewBlock>
      {below && hasText(b) && (
        <div className="md:hidden" style={{ padding: '24px 20px 8px', textAlign: b.settings.contentAlign === 'center' || b.settings.contentAlign === 'right' ? b.settings.contentAlign : 'left' }}>
          <SlideText block={b} onImage={false} color={t.colors.ink} />
        </div>
      )}
    </>
  );

  return (
    <section aria-roledescription="carousel" aria-label={ts('browse.sort.featured', 'Featured')} className="relative" style={{ padding: `12px ${t.layout.containerPadX} 0` }} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onTouchStart={e => { touch.current = e.touches[0].clientX; }}
      onTouchEnd={e => { if (touch.current != null) { const d = e.changedTouches[0].clientX - touch.current; const s = swipeStep(d, rtl); if (s) go(s); touch.current = null; } }}>
      <style>{`.fx-hero{--h:${hm ?? 'auto'}}@media(min-width:768px){.fx-hero{--h:${hd ?? 'auto'}}}.fx-hero .fx-h{height:var(--h)!important}`}</style>
      <div className="fx-hero mx-auto overflow-hidden" style={{ maxWidth: t.layout.maxWidth, borderRadius: t.sectionRadiusPx }}>
        {fade ? (
          <div className="relative">
            {slides.map((b, k) => (
              <div key={b._id ?? k} style={{ position: k === 0 ? 'relative' : 'absolute', inset: 0, opacity: k === cur ? 1 : 0, transition: 'opacity .8s ease', pointerEvents: k === cur ? 'auto' : 'none' }}>
                {slideBody(b, k)}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex" style={{ transform: `translateX(${trackOffsetPct(cur, rtl)}%)`, transition: 'transform .7s cubic-bezier(.22,.61,.36,1)' }}>
            {slides.map((b, k) => (
              <div key={b._id ?? k} className="w-full shrink-0">
                {slideBody(b, k)}
              </div>
            ))}
          </div>
        )}
      </div>

      {n > 1 && settings.showArrows === true && (
        <>
          <button type="button" aria-label={ts('sections.prevSlide', 'Previous slide')} onClick={() => go(-1)} className="absolute start-8 top-1/2 hidden size-11 md:flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-black"><ChevronLeft size={20} className="fx-flip-rtl" /></button>
          <button type="button" aria-label={ts('sections.nextSlide', 'Next slide')} onClick={() => go(1)} className="absolute end-8 top-1/2 hidden size-11 md:flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-black"><ChevronRight size={20} className="fx-flip-rtl" /></button>
        </>
      )}

      {n > 1 && pagination !== 'none' && (
        <div className="absolute inset-x-0 bottom-5 flex items-center justify-center gap-3">
          {pagination === 'counter'
            ? <span className="text-xs font-medium tracking-widest text-white">{cur + 1} / {n}</span>
            : slides.map((_, k) => (
              <button key={k} type="button" aria-label={ts('sections.goToSlide', 'Go to slide {{n}}', { n: k + 1 })} aria-current={k === cur} onClick={() => setI(k)} className="h-[3px] cursor-pointer border-0 p-0 transition-all"
                style={{ width: k === cur ? 36 : 20, background: k === cur ? '#fff' : 'rgba(255,255,255,.5)' }} />
            ))}
          {settings.autoplay !== false && settings.showPauseButton === true && (
            <button type="button" aria-label={paused ? ts('sections.playSlideshow', 'Play slideshow') : ts('sections.pauseSlideshow', 'Pause slideshow')} onClick={() => setPaused(p => !p)} className="ml-2 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-0 bg-white/90 text-black">
              {paused ? <Play size={12} /> : <Pause size={12} />}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

registerFashionSection('hero', (section, blocks) => <Hero settings={section.settings} blocks={blocks} />);
