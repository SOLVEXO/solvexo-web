/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this file registers renderers, it exports none */
import { useRef, useState } from 'react';
import { Download, Power } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { renderRichText } from '@/utils/richText';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { featureIcon } from '../../featureIcons';
import { PreviewBlock } from '../../previewInspector';
import { LedupHeroCategoryBanner } from '../components/LedupHeroCategoryBanner';
import { LedupBox } from '../ui/ledupUi';
import { baseTheme as t } from '../theme.base';
import { registerLedupSection } from './ledupSectionRegistry';

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');

/** Seller's own "link" setting -> an in-app or external anchor. */
function Cta({ label, link, className }: { label?: string; link?: any; className: string }) {
  const { resolveLink } = useStorefront();
  if (!label || !link) return null;
  const target = resolveLink(link);
  if (target.to) return <Link to={target.to} className={className}>{label} <ArrowUpRight size={14} aria-hidden /></Link>;
  return <a href={target.href ?? '#'} className={className} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label} <ArrowUpRight size={14} aria-hidden /></a>;
}

const solidCta = 'inline-flex items-center gap-2 rounded-full bg-[var(--ld-accent)] px-6 py-3 text-sm font-medium text-white no-underline transition hover:bg-[var(--ld-accent-hover)]';

// ── Rich text ───────────────────────────────────────────────────────────────
function RichText({ settings, blocks, dynamic }: { settings: Record<string, any>; blocks: Block[]; dynamic: Record<string, string> }) {
  const align = settings.alignment === 'center' || settings.alignment === 'right' ? settings.alignment : 'left';
  const heading = (settings.dynamicSourceKey && dynamic[settings.dynamicSourceKey]) || text(settings.heading);
  const parts = blocks.map((b, i) => {
    const bs = (b.settings ?? {}) as Record<string, any>;
    const body = String((bs.dynamicSourceKey && dynamic[bs.dynamicSourceKey]) || bs.text || '');
    if (!body) return null;
    const id = String(b._id ?? i);
    if (b.type === 'heading') {
      const Tag = bs.level === 'h2' ? 'h2' : bs.level === 'h4' ? 'h4' : 'h3';
      return <PreviewBlock key={id} blockId={id}><Tag className="m-0 mt-4 text-2xl font-bold text-stone-900">{body}</Tag></PreviewBlock>;
    }
    if (b.type === 'paragraph' || b.type === 'text') {
      return <PreviewBlock key={id} blockId={id}><p className="m-0 whitespace-pre-line text-base leading-8 text-stone-600">{renderRichText(body)}</p></PreviewBlock>;
    }
    if (b.type === 'button') return <PreviewBlock key={id} blockId={id}><div><Cta label={text(bs.label) || body} link={bs.link} className={solidCta} /></div></PreviewBlock>;
    return null;
  }).filter(Boolean);
  const intro = text(settings.text);
  if (!heading && !intro && parts.length === 0) return null;
  return (
    <section className="border-y border-stone-100 bg-white py-16">
      <LedupBox narrow padY={false}>
        <div className="flex flex-col gap-4" style={{ textAlign: align }}>
          {heading && <h2 className="m-0 text-3xl font-light tracking-tight text-stone-900 md:text-4xl" style={{ fontFamily: t.fonts.display }}>{heading}</h2>}
          {intro && <p className="m-0 whitespace-pre-line text-base leading-8 text-stone-600">{renderRichText(intro)}</p>}
          {parts}
        </div>
      </LedupBox>
    </section>
  );
}

// ── Feature list / highlights ───────────────────────────────────────────────
function FeatureList({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  if (blocks.length === 0) return null;
  const heading = text(settings.heading);
  const eyebrow = text(settings.eyebrow);
  return (
    <section className="bg-[#F9F8F6] py-16">
      <LedupBox padY={false}>
        {(heading || eyebrow) && (
          <div className="mx-auto mb-10 max-w-2xl text-center">
            {eyebrow && <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ld-accent)]">{eyebrow}</span>}
            {heading && <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl" style={{ fontFamily: t.fonts.display }}>{heading}</h2>}
            {text(settings.text) && <p className="mt-3 text-sm leading-relaxed text-stone-600">{text(settings.text)}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const Icon = featureIcon(s.icon);
            const id = String(b._id ?? i);
            return (
              <PreviewBlock key={id} blockId={id}>
                <div className="h-full rounded-3xl border border-stone-200/60 bg-white p-8 shadow-sm transition hover:shadow-md">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ld-accent)]/10 text-[var(--ld-accent)]"><Icon size={24} aria-hidden /></div>
                  {text(s.title) && <h3 className="mb-2 text-lg font-bold text-stone-900">{s.title}</h3>}
                  {text(s.description) && <p className="mb-4 text-sm leading-relaxed text-stone-500">{renderRichText(s.description)}</p>}
                  <Cta label={text(s.linkText)} link={s.link} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ld-accent)] no-underline hover:underline" />
                </div>
              </PreviewBlock>
            );
          })}
        </div>
      </LedupBox>
    </section>
  );
}

// ── Bento grid (ledup.pt "Destaques"): photo tiles of different sizes with a round arrow ──
const BENTO_SPAN: Record<string, string> = { wide: 'md:col-span-6', tall: 'md:col-span-3 md:row-span-2', small: 'md:col-span-2', normal: 'md:col-span-3' };
function Bento({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const { resolveLink } = useStorefront();
  if (blocks.length === 0) return null;
  const heading = text(settings.heading);
  const eyebrow = text(settings.eyebrow);
  return (
    <section className="py-16">
      <LedupBox padY={false}>
        {(heading || eyebrow) && (
          <div className="mx-auto mb-12 max-w-2xl text-center">
            {eyebrow && <p className="m-0 mb-1 text-xs text-[#a69d98]">{eyebrow}</p>}
            {heading && <h2 className="m-0 text-2xl font-normal tracking-tight md:text-4xl" style={{ fontFamily: t.fonts.display, color: 'var(--ld-accent)' }}>{heading}</h2>}
            {text(settings.text) && <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-[#736c67]">{text(settings.text)}</p>}
          </div>
        )}
        <div className="grid grid-cols-2 gap-4 auto-rows-[190px] md:grid-cols-12 md:auto-rows-[230px] md:gap-5">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            const img = text(s.imageUrl);
            const stat = s.tone === 'stat';
            const light = s.tone === 'light' || (!img && !stat);
            const target = s.link ? resolveLink(s.link) : null;
            const inner = stat ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-4 text-center">
                <span className="text-4xl font-light md:text-5xl"><bdi>{text(s.title)}</bdi></span>
                <span className="text-[11px] font-medium leading-tight opacity-90">{text(s.caption)}</span>
              </div>
            ) : (
              <>
                {img && <img src={img} alt="" loading="lazy" className={`absolute inset-0 h-full w-full transition duration-700 group-hover:scale-105 ${light ? 'object-contain p-6' : 'object-cover'}`} />}
                {!light && <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(40,32,26,.78) 0%, rgba(40,32,26,0) 62%)' }} />}
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <span className={`text-sm font-medium ${light ? 'text-[var(--ld-accent)]' : 'text-white'}`}>{text(s.title)}</span>
                  {target && <span aria-hidden className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition duration-300 group-hover:bg-white group-hover:text-[var(--ld-accent)] ${light ? 'border-[var(--ld-accent)] text-[var(--ld-accent)]' : 'border-white/70 text-white'}`}><ArrowUpRight size={18} /></span>}
                </div>
              </>
            );
            const cls = `group relative overflow-hidden rounded-3xl bg-white no-underline ${stat ? 'ld-stat-tile ' : ''}${BENTO_SPAN[String(s.size)] ?? BENTO_SPAN.normal} ${s.size === 'wide' ? 'col-span-2' : ''}`;
            return (
              <PreviewBlock key={id} blockId={id}>
                {target?.to ? <Link to={target.to} className={cls}>{inner}</Link>
                  : target?.href ? <a href={target.href} className={cls} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{inner}</a>
                  : <div className={cls}>{inner}</div>}
              </PreviewBlock>
            );
          })}
        </div>
      </LedupBox>
    </section>
  );
}

// ── Projects carousel ──
function Projects({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const row = useRef<HTMLDivElement>(null);
  if (blocks.length === 0) return null;
  const nudge = (d: 1 | -1) => row.current?.scrollBy({ left: d * Math.max(280, (row.current?.clientWidth ?? 600) * 0.7), behavior: 'smooth' });
  return (
    <section className="py-10">
      <div className="mx-auto max-w-[1440px] px-4 sm:px-8">
        <div className="grid items-center gap-8 rounded-[2.5rem] bg-white px-6 py-12 md:grid-cols-[minmax(0,1fr)_1.7fr] md:px-12">
          <div>
            {text(settings.eyebrow) && <p className="m-0 mb-2 text-xs text-[#a69d98]">{text(settings.eyebrow)}</p>}
            {text(settings.heading) && <h2 className="m-0 text-[clamp(24px,3vw,38px)] font-medium leading-tight" style={{ fontFamily: t.fonts.display, color: 'var(--ld-accent)' }}>{text(settings.heading)}</h2>}
            {text(settings.text) && <p className="mt-4 max-w-md text-sm leading-relaxed text-[#736c67]">{text(settings.text)}</p>}
            {blocks.length > 1 && (
              <div className="mt-6 flex gap-2">
                <button type="button" aria-label="Previous" onClick={() => nudge(-1)} className="ld-iconbtn"><span aria-hidden>‹</span></button>
                <button type="button" aria-label="Next" onClick={() => nudge(1)} className="ld-iconbtn"><span aria-hidden>›</span></button>
              </div>
            )}
          </div>
          <div ref={row} className="ld-hide-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth">
            {blocks.map((b, i) => {
              const s = (b.settings ?? {}) as Record<string, any>;
              const id = String(b._id ?? i);
              return (
                <PreviewBlock key={id} blockId={id}>
                  <figure className="m-0 w-[min(78vw,440px)] shrink-0 snap-start">
                    <div className="aspect-[4/3] overflow-hidden rounded-3xl bg-[#f1efed]">
                      {text(s.imageUrl) && <img src={text(s.imageUrl)} alt={text(s.title)} loading="lazy" className="h-full w-full object-cover transition duration-700 hover:scale-105" />}
                    </div>
                    {text(s.title) && <figcaption className="mt-2 text-xs text-[#736c67]">{text(s.title)}</figcaption>}
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

// ── Photo switcher ("Interruptores") ──
function Switcher({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const [on, setOn] = useState(0);
  if (blocks.length === 0) return null;
  const cur = Math.min(on, blocks.length - 1);
  return (
    <section className="py-10">
      <div className="mx-auto max-w-[1440px] px-0 sm:px-8">
        <div className="overflow-hidden bg-[#e4e0dc] sm:rounded-[2.5rem]">
          <div className="relative aspect-[16/8] w-full bg-[#d9d4cf]">
            {blocks.map((b, i) => {
              const img = text(((b.settings ?? {}) as Record<string, any>).imageUrl);
              return img ? <img key={String(b._id ?? i)} src={img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ opacity: i === cur ? 1 : 0, transition: 'opacity .7s ease' }} /> : null;
            })}
          </div>
          <div className="px-4 py-5 text-center">
            {text(settings.label) && <p className="m-0 mb-3 text-[11px] text-[#8c847e]">{text(settings.label)}</p>}
            <div className="flex flex-wrap justify-center gap-3">
              {blocks.map((b, i) => {
                const s = (b.settings ?? {}) as Record<string, any>;
                const id = String(b._id ?? i);
                return (
                  <PreviewBlock key={id} blockId={id}>
                    <button type="button" aria-pressed={i === cur} onClick={() => setOn(i)} className="min-w-[4.6rem] cursor-pointer rounded-full border-0 px-4 py-2 text-[10px] font-medium uppercase tracking-wider text-white transition duration-300"
                      style={{ background: i === cur ? 'var(--ld-accent)' : 'color-mix(in srgb, var(--ld-accent) 55%, transparent)', boxShadow: i === cur ? '0 0 0 3px rgba(255,255,255,.55)' : 'none' }}>
                      {text(s.title) || String(i + 1)}
                    </button>
                  </PreviewBlock>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Dark stacked card ──
function Stacked({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const img1 = text(settings.imageUrl);
  const img2 = text(settings.imageUrl2);
  if (!text(settings.heading) && blocks.length === 0) return null;
  return (
    <section className="py-10" data-ld-dark>
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8">
        <div className="relative overflow-hidden rounded-[2.5rem] text-white" style={{ background: 'var(--ld-accent)' }}>
          <div className="grid gap-8 px-6 pb-0 pt-12 md:grid-cols-[1.2fr_1fr] md:px-12">
            <div className="pb-8">
              {text(settings.heading) && <h2 className="m-0 text-[clamp(24px,3vw,36px)] font-medium leading-tight" style={{ fontFamily: t.fonts.display }}>{text(settings.heading)}</h2>}
              {text(settings.text) && <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/80">{text(settings.text)}</p>}
            </div>
            {(img1 || img2) && (
              <div className="relative hidden min-h-[240px] md:block">
                {img1 && <img src={img1} alt="" loading="lazy" className="absolute end-0 top-0 h-[190px] w-[62%] rounded-2xl object-cover shadow-xl" />}
                {img2 && <img src={img2} alt="" loading="lazy" className="absolute bottom-0 start-0 h-[170px] w-[52%] rounded-2xl object-cover shadow-xl" />}
              </div>
            )}
          </div>
          <ol className="m-0 list-none p-0">
            {blocks.map((b, i) => {
              const s = (b.settings ?? {}) as Record<string, any>;
              const id = String(b._id ?? i);
              return (
                <PreviewBlock key={id} blockId={id}>
                  <li className="-mt-4 flex items-center gap-3 rounded-b-[1.6rem] px-6 pb-4 pt-8 text-xs font-medium uppercase tracking-wide md:px-12"
                    style={{ background: `color-mix(in srgb, var(--ld-accent) ${Math.max(55, 100 - i * 9)}%, #fff)` }}>
                    <span className="opacity-70">{String(i + 1).padStart(2, '0')}.</span>{text(s.title)}
                  </li>
                </PreviewBlock>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// ── Lighting simulation (ledup.pt "Interruptores"): switches turn zones of a scene on and off ──
function Simulation({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const [on, setOn] = useState<Record<string, boolean>>({});
  if (blocks.length === 0) return null;
  const base = text(settings.baseImage);
  return (
    <section className="py-6" data-ld-dark>
      <div className="ld-sim mx-auto max-w-[1440px]">
        <div className="ld-sim-scene">
          {base && <img src={base} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />}
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            const img = text(s.imageUrl);
            const gx = `${Math.round(((i + 0.5) / blocks.length) * 100)}%`;
            return img
              ? <img key={id} src={img} alt="" loading="lazy" className={`ld-sim-layer ${on[id] ? 'is-on' : ''}`} />
              : <div key={id} className={`ld-sim-glow ${on[id] ? 'is-on' : ''}`} style={{ ['--gx' as string]: gx }} />;
          })}
        </div>
        <div className="px-4 pb-6 pt-5 text-center">
          {text(settings.label) && <p className="m-0 mb-3 text-xs text-[#8c847e]">{text(settings.label)}</p>}
          <div className="flex flex-wrap items-start justify-center gap-5 sm:gap-7">
            {blocks.map((b, i) => {
              const s = (b.settings ?? {}) as Record<string, any>;
              const id = String(b._id ?? i);
              return (
                <PreviewBlock key={id} blockId={id}>
                  <div className="flex flex-col items-center gap-2">
                    <button type="button" className="ld-sim-switch" aria-pressed={!!on[id]} aria-label={text(s.title)} onClick={() => setOn(p => ({ ...p, [id]: !p[id] }))}><i /></button>
                    <span className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-[#8c847e]"><Power size={11} aria-hidden />{text(s.title)}</span>
                  </div>
                </PreviewBlock>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Timeline (about page): year + text ──
function Timeline({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  if (blocks.length === 0) return null;
  return (
    <section className="py-14">
      <LedupBox padY={false}>
        {text(settings.heading) && <h2 className="m-0 mb-10 text-center text-2xl font-normal md:text-4xl" style={{ fontFamily: t.fonts.display, color: 'var(--ld-accent)' }}>{text(settings.heading)}</h2>}
        <ol className="m-0 mx-auto flex max-w-3xl list-none flex-col gap-0 p-0">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            return (
              <PreviewBlock key={id} blockId={id}>
                <li className="grid grid-cols-[84px_1fr] gap-6 border-t border-[#e2dedb] py-6">
                  <span className="text-3xl font-light" style={{ color: 'var(--ld-accent)' }}><bdi>{text(s.year)}</bdi></span>
                  <div>
                    <h3 className="m-0 text-base font-medium">{text(s.title)}</h3>
                    {text(s.text) && <p className="mt-1 text-sm leading-relaxed text-[#736c67]">{text(s.text)}</p>}
                  </div>
                </li>
              </PreviewBlock>
            );
          })}
        </ol>
      </LedupBox>
    </section>
  );
}

// ── Documents list (datasheets / catalogues / brochures): one row per file with a download pill ──
function Documents({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const { resolveLink } = useStorefront();
  if (blocks.length === 0) return null;
  return (
    <section className="py-14">
      <LedupBox padY={false}>
        {text(settings.heading) && <h2 className="m-0 mb-8 text-2xl font-normal md:text-4xl" style={{ fontFamily: t.fonts.display, color: 'var(--ld-accent)' }}>{text(settings.heading)}</h2>}
        <ul className="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            const target = s.link ? resolveLink(s.link) : null;
            const href = target?.href ?? target?.to ?? '#';
            return (
              <PreviewBlock key={id} blockId={id}>
                <li className="flex items-center justify-between gap-4 rounded-3xl bg-white p-5">
                  <div className="min-w-0">
                    <p className="m-0 truncate text-sm font-medium">{text(s.title)}</p>
                    {text(s.kind) && <p className="m-0 mt-0.5 text-xs text-[#8c847e]">{text(s.kind)}</p>}
                  </div>
                  <a href={href} {...(target?.newTab !== false ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="ld-pillbtn shrink-0" aria-label={text(s.title)}>
                    <Download size={14} aria-hidden />
                  </a>
                </li>
              </PreviewBlock>
            );
          })}
        </ul>
      </LedupBox>
    </section>
  );
}

// ── Registration ────────────────────────────────────────────────────────────
const categoryTabs = () => <section className="pb-6 pt-2"><LedupHeroCategoryBanner /></section>;

registerLedupSection('hero_banner', categoryTabs);

// Theme-defined sections (namespace `ledup.`): the same renderers, driven by the seller's own fields.
registerLedupSection('theme_section', (sec, blocks, col, dynamic) => {
  const key = String(sec.settings?.sectionKey || '');
  if (key === 'ledup.category_tabs') return categoryTabs();
  if (key === 'ledup.projects') return <Projects settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.switcher') return <Switcher settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.stacked') return <Stacked settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.bento') return <Bento settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.simulation') return <Simulation settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.timeline') return <Timeline settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.documents') return <Documents settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.highlights') return <FeatureList settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.statement') return <RichText settings={sec.settings} blocks={blocks} dynamic={dynamic} />;
  void col;
  return null;
});
