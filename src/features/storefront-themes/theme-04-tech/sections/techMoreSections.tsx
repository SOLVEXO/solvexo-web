/* eslint-disable react-refresh/only-export-components -- this module registers renderers as a side effect */
import { useEffect, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { apiGetPublicStoreProducts } from '@/api/services/store';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLoad } from '../../core/pageHooks';
import type { BaseColors } from '../theme.base';
import { techTheme as t } from '../theme.config';
import { TechProductCard } from '../components/TechProductCard';
import { BlockLink, DealButton, TechSectionShell, techCustom } from './techSections';

const text = (v: unknown) => (typeof v === 'string' ? v : '');
const reduceMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

// ── Hero: dark split slider (text left, image right), arrows + dots, optional autoplay ───────────────────
const HERO_HEIGHT: Record<string, number> = { compact: 320, standard: 440, tall: 560 };

function HeroSlider({ section, blocks }: { section: Section; blocks: Block[] }) {
  const slides = blocks.filter(b => b.type === 'theme_block' && (text(b.settings.heading) || text(b.settings.imageUrl)));
  const [index, setIndex] = useState(0);
  const count = slides.length;
  const autoplay = section.settings.autoplay === true && count > 1;
  useEffect(() => {
    if (!autoplay || reduceMotion()) return;
    const id = window.setInterval(() => setIndex(i => (i + 1) % count), 6000);
    return () => window.clearInterval(id);
  }, [autoplay, count]);
  if (count === 0) return null;
  const s = slides[Math.min(index, count - 1)].settings;
  const minHeight = HERO_HEIGHT[text(section.settings.height)] ?? HERO_HEIGHT.standard;
  const arrow = 'absolute top-1/2 z-10 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0';
  return (
    <section aria-roledescription="carousel" aria-label={text(section.settings.heading) || ts('pg.featured', 'Featured')} style={{ background: t.colors.dark, color: t.colors.darkInk, fontFamily: t.fonts.body }}>
      <div className="relative mx-auto grid items-center gap-8 md:grid-cols-2" style={{ maxWidth: t.layout.maxWidth, minHeight, padding: `clamp(28px,4vw,56px) ${t.layout.containerPadX}` }}>
        <div aria-live={autoplay ? 'off' : 'polite'}>
          {text(s.eyebrow) && <p className="m-0 mb-3 text-xs font-semibold uppercase" style={{ color: t.colors.accent, letterSpacing: '.1em' }}>{text(s.eyebrow)}</p>}
          <h2 className="m-0 text-[clamp(28px,4vw,48px)] font-semibold leading-[1.1]" style={{ fontFamily: t.fonts.display }}>{text(s.heading)}</h2>
          {text(s.text) && <p className="m-0 mt-4 max-w-[460px] text-base leading-relaxed opacity-80">{text(s.text)}</p>}
          {text(s.buttonLabel) && s.link && <div className="mt-7"><DealButton label={text(s.buttonLabel)} link={s.link} /></div>}
        </div>
        {text(s.imageUrl) && <img key={text(s.imageUrl)} src={text(s.imageUrl)} alt={text(s.imageAlt)} loading={index === 0 ? 'eager' : 'lazy'} className="tx-fade max-h-[420px] w-full object-contain" />}
        {count > 1 && (
          <>
            <button type="button" aria-label={ts('pg.previous', 'Previous')} onClick={() => setIndex(i => (i - 1 + count) % count)} className={`${arrow} start-2`} style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}><ChevronLeft size={20} className="tx-flip-rtl" /></button>
            <button type="button" aria-label={ts('pg.next', 'Next')} onClick={() => setIndex(i => (i + 1) % count)} className={`${arrow} end-2`} style={{ background: 'rgba(255,255,255,.14)', color: '#fff' }}><ChevronRight size={20} className="tx-flip-rtl" /></button>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2" role="group" aria-label={ts('pg.slides', 'Slides')}>
              {slides.map((_, i) => <button key={i} type="button" aria-label={ts('pg.go_to_slide', 'Go to slide {{n}}', { n: i + 1 })} aria-current={i === index} onClick={() => setIndex(i)} className="size-2.5 cursor-pointer rounded-full border-0 p-0" style={{ background: i === index ? t.colors.accent : 'rgba(255,255,255,.4)' }} />)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
techCustom.set('tech.hero', (section, blocks) => <HeroSlider section={section} blocks={blocks} />);

// ── Bento banner grid: tiles of different sizes, each a photo with a title (all typed / uploaded by the seller) ──
const BENTO_SPAN: Record<string, string> = { wide: 'md:col-span-2', tall: 'md:row-span-2', large: 'md:col-span-2 md:row-span-2', normal: '' };
techCustom.set('tech.bento_grid', (section, blocks, colors) => {
  const tiles = blocks.filter(b => b.type === 'theme_block' && (text(b.settings.title) || text(b.settings.imageUrl)));
  if (tiles.length === 0) return null;
  return (
    <TechSectionShell colors={colors} heading={text(section.settings.heading)}>
      <div className="grid auto-rows-[minmax(180px,1fr)] grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
        {tiles.map((b, i) => (
          <BlockLink key={b._id ?? i} block={b} className={`group relative block overflow-hidden no-underline ${BENTO_SPAN[text(b.settings.size)] ?? ''}`} style={{ background: t.colors.dark, color: '#fff', borderRadius: t.cardRadiusPx, minHeight: 180 }}>
            {text(b.settings.imageUrl) && <img src={text(b.settings.imageUrl)} alt="" loading="lazy" className="absolute inset-0 size-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-105" />}
            <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-4" style={{ background: 'linear-gradient(transparent, rgba(2,2,3,.75))' }}>
              <span className="text-lg font-semibold">{text(b.settings.title)}</span>
              {text(b.settings.text) && <span className="text-sm opacity-85">{text(b.settings.text)}</span>}
            </span>
          </BlockLink>
        ))}
      </div>
    </TechSectionShell>
  );
});

// ── Image grid, Instagram-style: seller-chosen photos with optional captions and links. Never a live feed. ──────
const GRID_COLS: Record<number, string> = { 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' };
techCustom.set('tech.image_grid', (section, blocks, colors) => {
  const items = blocks.filter(b => b.type === 'theme_block' && text(b.settings.imageUrl));
  if (items.length === 0) return null;
  const cols = GRID_COLS[Number(section.settings.columns)] ?? GRID_COLS[6];
  return (
    <TechSectionShell colors={colors} heading={text(section.settings.heading)}>
      <ul className={`m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-3 ${cols}`}>
        {items.map((b, i) => (
          <li key={b._id ?? i}>
            <BlockLink block={b} className="block no-underline" style={{ color: colors.ink }}>
              <img src={text(b.settings.imageUrl)} alt={text(b.settings.caption)} loading="lazy" className="aspect-square w-full object-cover" style={{ borderRadius: t.imageRadiusPx }} />
              {text(b.settings.caption) && <span className="mt-2 block text-xs leading-snug" style={{ color: colors.inkMuted }}>{text(b.settings.caption)}</span>}
            </BlockLink>
          </li>
        ))}
      </ul>
    </TechSectionShell>
  );
});

// ── Showroom / store info card: everything is typed by the seller ──────────────────────────────────────────────
techCustom.set('tech.showroom', (section, _blocks, colors: BaseColors) => {
  const s = section.settings;
  const address = text(s.address).trim(), hours = text(s.hours).trim(), phone = text(s.phone).trim(), email = text(s.email).trim();
  const map = /^https:\/\//i.test(text(s.mapLink)) ? text(s.mapLink) : '';
  if (!address && !hours && !phone && !email) return null;
  const row = (icon: ReactNode, body: ReactNode) => <div className="flex items-start gap-3"><span className="mt-0.5 shrink-0" style={{ color: t.colors.accent }}>{icon}</span><div className="min-w-0 text-sm leading-relaxed">{body}</div></div>;
  return (
    <TechSectionShell colors={colors}>
      <div className="grid gap-6 p-6 md:grid-cols-[1fr_2fr] md:p-9" style={{ background: t.colors.bgAlt, borderRadius: t.cardRadiusPx }}>
        <div>
          <h2 className="m-0 text-xl font-semibold" style={{ fontFamily: t.fonts.display }}>{text(s.heading) || ts('tx.showroom.title', 'Visit our showroom')}</h2>
          {text(s.note) && <p className="m-0 mt-3 text-sm" style={{ color: t.colors.inkMuted }}>{text(s.note)}</p>}
          {map && <a href={map} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm font-semibold" style={{ color: t.colors.accent }}>{ts('tx.showroom.directions', 'Get directions')}</a>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {address && row(<MapPin size={18} aria-hidden />, <p className="m-0 whitespace-pre-line">{address}</p>)}
          {hours && row(<Clock size={18} aria-hidden />, <p className="m-0 whitespace-pre-line">{hours}</p>)}
          {phone && row(<Phone size={18} aria-hidden />, <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="no-underline hover:underline" style={{ color: t.colors.ink }}><bdi>{phone}</bdi></a>)}
          {email && row(<Mail size={18} aria-hidden />, <a href={`mailto:${email}`} className="no-underline hover:underline" style={{ color: t.colors.ink }}><bdi>{email}</bdi></a>)}
        </div>
      </div>
    </TechSectionShell>
  );
});

// ── Featured products with tabs: one tab per seller-chosen collection ─────────────────────────────────────────
function TabbedProducts({ section, blocks, colors }: { section: Section; blocks: Block[]; colors: BaseColors }) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const tabs = blocks.filter(b => b.type === 'theme_block' && text(b.settings.label));
  const [active, setActive] = useState(0);
  const tab = tabs[Math.min(active, Math.max(0, tabs.length - 1))];
  const collectionId = tab ? text(tab.settings.collectionId) || undefined : undefined;
  const limit = Math.min(10, Math.max(2, Number(section.settings.limit) || 5));
  const { data, error, retry } = useLoad(
    () => (tab ? apiGetPublicStoreProducts(store.storeId, { limit, collectionId, sort: 'newest' }).then(r => r.data?.products ?? []) : Promise.resolve([])),
    [store.storeId, collectionId, limit, tab?._id],
  );
  if (tabs.length === 0) return null;
  return (
    <TechSectionShell colors={colors} heading={text(section.settings.heading)}>
      <div role="tablist" aria-label={text(section.settings.heading) || ts('pg.products', 'Products')} className="tx-hide-scroll mb-5 flex gap-1 overflow-x-auto" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
        {tabs.map((b, i) => (
          <button key={b._id ?? i} type="button" role="tab" aria-selected={i === active} onClick={() => setActive(i)} className="cursor-pointer whitespace-nowrap border-0 bg-transparent px-4 py-3 text-sm font-semibold"
            style={{ color: i === active ? t.colors.accent : t.colors.inkMuted, boxShadow: i === active ? `inset 0 -2px 0 ${t.colors.accent}` : 'none' }}>{text(b.settings.label)}</button>
        ))}
      </div>
      {error ? <p role="alert" className="m-0 text-sm" style={{ color: colors.inkMuted }}>{ts('pg.we_couldn_t_load_these_products', "We couldn't load these products.")} <button type="button" onClick={retry} className="cursor-pointer border-0 bg-transparent p-0 underline" style={{ color: colors.ink }}>{ts('checkout.tryAgain', 'Try again')}</button></p>
        : (
          <div role="tabpanel" className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" aria-busy={data === null}>
            {data === null ? Array.from({ length: limit }).map((_, i) => <div key={i} className="h-[320px] animate-pulse" style={{ background: colors.bgAlt }} />) : data.map(p => <TechProductCard key={p._id} product={p} currency={currency} />)}
          </div>
        )}
    </TechSectionShell>
  );
}
techCustom.set('tech.featured_tabs', (section, blocks, colors) => <TabbedProducts section={section} blocks={blocks} colors={colors} />);
