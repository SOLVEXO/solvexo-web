/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts, type PublicStoreProductsParams } from '@/api/services/store';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLoad } from '../../core/pageHooks';
import { copyText } from '../../sectionCopy';
import { EditableText } from '../../inlineEdit';
import type { BaseColors } from '../theme.base';
import { ledupTheme as t } from '../theme.config';
import { LedupProductCard } from '../components/LedupProductCard';
import { LedupLinkButton } from '../ui/ledupUiPort';
import { ledupButtonStyle } from '../ui/ledupStylePort';
import { registerLedupSection } from './ledupSectionRegistry';

const text = (v: unknown) => (typeof v === 'string' ? v : '');

/** Standard Tech section frame: centred box, heading on the left, an optional "See all" link on the right. */
export function LedupSectionShell({ colors, heading, link, children, padY = true }: { colors: BaseColors; heading?: string; link?: { to: string; label: string }; children: ReactNode; padY?: boolean }) {
  return (
    <section style={{ padding: padY ? `${t.layout.sectionPadY} ${t.layout.containerPadX}` : `0 ${t.layout.containerPadX}`, color: colors.ink, fontFamily: t.fonts.body }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {(heading || link) && (
          <header className="mb-5 flex items-baseline justify-between gap-4">
            {heading ? <h2 className="m-0 text-[clamp(20px,2.4vw,26px)] font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}><EditableText value={heading} settingKey="heading" /></h2> : <span />}
            {link && <Link to={link.to} className="text-xs font-medium no-underline hover:underline" style={{ color: colors.accent }}>{link.label}</Link>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

// ── Product row (replaces the shared featured_products renderer) ────────────────────────────────────────
function queryFor(s: Record<string, any>): PublicStoreProductsParams {
  const limit = Math.min(24, Math.max(1, Number(s.limit) || 10));
  switch (s.source) {
    case 'bestsellers': return { limit, sort: 'best_selling' };
    case 'trending': return { limit, sort: 'trending' };
    case 'onSale': return { limit, onSale: true, sort: 'newest' };
    case 'category': return { limit, categoryId: s.categoryId, sort: 'newest' };
    case 'collection': return { limit, collectionId: s.collectionId, sort: 'newest' };
    case 'manual': case 'pinned': return Array.isArray(s.productIds) && s.productIds.length ? { ids: s.productIds as string[], limit } : { limit, sort: 'newest' };
    default: return { limit, sort: 'newest' };
  }
}

function ProductRow({ settings: s, colors }: { settings: Record<string, any>; colors: BaseColors }) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const scroller = useRef<HTMLDivElement>(null);
  const key = JSON.stringify(queryFor(s));
  const { data: items, error, retry } = useLoad(() => apiGetPublicStoreProducts(store.storeId, JSON.parse(key) as PublicStoreProductsParams).then(r => r.data?.products ?? []), [store.storeId, key]);
  if (items && items.length === 0) return null;
  const nudge = (dir: 1 | -1) => scroller.current?.scrollBy({ left: dir * (scroller.current.clientWidth * 0.8) * (document.dir === 'rtl' ? -1 : 1), behavior: 'smooth' });
  const to = s.source === 'collection' && s.collectionId ? `/collections/${s.collectionId}` : '/search';
  const arrow = 'absolute top-1/2 z-10 hidden size-9 -translate-y-1/2 cursor-pointer place-items-center rounded-full border-0 md:grid';
  return (
    <LedupSectionShell colors={colors} heading={s.heading} link={{ to, label: text(s.linkLabel) || ts('pg.see_all', 'See all') }}>
      {error ? (
        <p role="alert" className="m-0 text-sm" style={{ color: colors.inkMuted }}>{ts('pg.we_couldn_t_load_these_products', "We couldn't load these products.")} <button type="button" onClick={retry} className="cursor-pointer border-0 bg-transparent p-0 underline" style={{ color: colors.ink }}>{ts('checkout.tryAgain', 'Try again')}</button></p>
      ) : (
        <div className="relative">
          <button type="button" aria-label={ts('pg.previous', 'Previous')} onClick={() => nudge(-1)} className={`${arrow} start-0 -translate-x-1/2`} style={{ background: colors.bgAlt, color: colors.ink }}><ChevronLeft size={18} className="tx-flip-rtl" /></button>
          <div ref={scroller} className="tx-hide-scroll flex snap-x gap-3 overflow-x-auto" aria-busy={items === null}>
            {items === null
              ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[340px] w-[200px] shrink-0 animate-pulse" style={{ background: colors.bgAlt }} />)
              : items.map(p => <div key={p._id} className="w-[200px] shrink-0 snap-start sm:w-[220px]"><LedupProductCard product={p} currency={currency} /></div>)}
          </div>
          <button type="button" aria-label={ts('pg.next', 'Next')} onClick={() => nudge(1)} className={`${arrow} end-0 translate-x-1/2`} style={{ background: colors.bgAlt, color: colors.ink }}><ChevronRight size={18} className="tx-flip-rtl" /></button>
        </div>
      )}
    </LedupSectionShell>
  );
}
registerLedupSection('featured_products', (section, _b, colors) => <ProductRow settings={section.settings} colors={colors} />);

// ── Theme-defined sections (`theme_section` + `settings.sectionKey`) ────────────────────────────────────
type Custom = (section: Section, blocks: Block[], colors: BaseColors) => ReactNode;
const custom = new Map<string, Custom>();
/** The registry of theme-declared sections (also filled by ledupMoreSections.tsx). */
export const ledupCustom = custom;
registerLedupSection('theme_section', (section, blocks, colors) => custom.get(String(section.settings.sectionKey))?.(section, blocks, colors) ?? null);

export function BlockLink({ block, children, className, style }: { block: Block; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  const { resolveLink } = useStorefront();
  const link = block.settings.link ? resolveLink(block.settings.link) : null;
  if (link?.to) return <Link to={link.to} className={className} style={style}>{children}</Link>;
  if (link?.href) return <a href={link.href} className={className} style={style} {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
  return <div className={className} style={style}>{children}</div>;
}

/** Category tiles: photo + name, each linking where the seller chose. */
custom.set('tech.category_tiles', (section, blocks, colors) => {
  const tiles = blocks.filter(b => b.type === 'theme_block' && text(b.settings.title));
  if (tiles.length === 0) return null;
  return (
    <LedupSectionShell colors={colors} heading={text(section.settings.heading)}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {tiles.map((b, i) => (
          <BlockLink key={b._id ?? i} block={b} className="group flex flex-col items-center gap-2 p-3 text-center no-underline" style={{ background: colors.bgAlt, color: colors.ink }}>
            {text(b.settings.imageUrl) ? <img src={text(b.settings.imageUrl)} alt="" loading="lazy" className="h-24 w-full object-contain transition-transform group-hover:scale-105" /> : <span className="block h-24" />}
            <span className="text-sm font-semibold">{text(b.settings.title)}</span>
          </BlockLink>
        ))}
      </div>
    </LedupSectionShell>
  );
});

/** Deal banner: a dark promo band with headline, text, button and an optional countdown date typed by the seller. */
function Countdown({ endsAt, colors }: { endsAt: string; colors: BaseColors }) {
  const end = new Date(endsAt).getTime();
  const [now] = useState(() => Date.now());
  const left = end - now;
  if (!Number.isFinite(end) || left <= 0) return null;
  const days = Math.floor(left / 86_400_000);
  const hours = Math.floor((left % 86_400_000) / 3_600_000);
  const part = (n: number, label: string) => <span className="grid min-w-[56px] place-items-center px-2 py-2" style={{ background: colors.accent, color: colors.accentInk }}><b className="text-xl leading-none">{n}</b><span className="text-[10px] uppercase">{label}</span></span>;
  return <div className="mt-4 flex gap-2">{part(days, ts('pg.days', 'days'))}{part(hours, ts('pg.hours', 'hours'))}</div>;
}
/** The deal banner's button: resolves the seller's own link setting (page, collection, product or external). */
export function DealButton({ label, link }: { label: string; link: any }) {
  const { resolveLink } = useStorefront();
  const target = resolveLink(link);
  if (target.to) return <LedupLinkButton to={target.to}>{label}</LedupLinkButton>;
  if (!target.href) return null;
  return <a href={target.href} className="tx-btn" style={{ ...ledupButtonStyle('primary'), borderRadius: t.buttonRadiusPx }} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label}</a>;
}
custom.set('tech.deal_banner', (section, _blocks, colors) => {
  const s = section.settings;
  if (!text(s.heading) && !text(s.imageUrl)) return null;
  return (
    <section style={{ background: t.colors.dark, color: t.colors.darkInk, fontFamily: t.fonts.body }}>
      <div className="mx-auto grid items-center gap-8 md:grid-cols-2" style={{ maxWidth: t.layout.maxWidth, padding: `clamp(32px,5vw,64px) ${t.layout.containerPadX}` }}>
        <div>
          <h2 className="m-0 text-[clamp(26px,3.4vw,40px)] font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}><EditableText value={text(s.heading)} settingKey="heading" /></h2>
          {text(s.text) && <p className="m-0 mt-4 text-base leading-relaxed opacity-80">{text(s.text)}</p>}
          {text(s.endsAt) && <Countdown endsAt={text(s.endsAt)} colors={colors} />}
          {text(s.buttonLabel) && s.buttonLink && <div className="mt-6"><DealButton label={text(s.buttonLabel)} link={s.buttonLink} /></div>}
        </div>
        {text(s.imageUrl) && <img src={text(s.imageUrl)} alt="" loading="lazy" className="max-h-[360px] w-full object-contain" />}
      </div>
    </section>
  );
});

/** Brand strip: seller-uploaded logos in a row (greyscale until hovered). */
custom.set('tech.brand_strip', (section, blocks, colors) => {
  const brands = blocks.filter(b => b.type === 'theme_block' && text(b.settings.imageUrl));
  if (brands.length === 0) return null;
  return (
    <LedupSectionShell colors={colors} heading={text(section.settings.heading)}>
      <ul className="m-0 flex list-none flex-wrap items-center justify-between gap-x-8 gap-y-4 p-0">
        {brands.map((b, i) => (
          <li key={b._id ?? i}><BlockLink block={b} className="block no-underline"><img src={text(b.settings.imageUrl)} alt={text(b.settings.title)} loading="lazy" className="h-10 max-w-[140px] object-contain opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0" /></BlockLink></li>
        ))}
      </ul>
    </LedupSectionShell>
  );
});

/** Trust / feature strip: three or more icon-less columns with a heading and a line each (support, warranty, savings...). */
custom.set('tech.feature_strip', (_section, blocks) => {
  const items = blocks.filter(b => b.type === 'theme_block' && text(b.settings.title));
  if (items.length === 0) return null;
  return (
    <section style={{ background: t.colors.bgAlt, color: t.colors.ink, fontFamily: t.fonts.body }}>
      <div className="mx-auto grid gap-8 text-center sm:grid-cols-3" style={{ maxWidth: t.layout.maxWidth, padding: `clamp(32px,5vw,56px) ${t.layout.containerPadX}` }}>
        {items.map((b, i) => (
          <div key={b._id ?? i} className="flex flex-col items-center gap-2">
            {text(b.settings.imageUrl) ? <img src={text(b.settings.imageUrl)} alt="" loading="lazy" className="size-14 rounded-full object-cover" /> : <span className="grid size-14 place-items-center rounded-full text-xl font-bold" style={{ background: t.colors.accent, color: t.colors.accentInk }} aria-hidden>{text(b.settings.title).charAt(0)}</span>}
            <p className="m-0 mt-1 text-base font-semibold">{text(b.settings.title)}</p>
            {text(b.settings.text) && <p className="m-0 max-w-[260px] text-sm" style={{ color: t.colors.inkMuted }}>{text(b.settings.text)}</p>}
          </div>
        ))}
      </div>
    </section>
  );
});

/** Spec highlights: big numbers on a dark band (battery hours, storage...). Values are typed by the seller. */
custom.set('tech.spec_highlights', (section, blocks) => {
  const items = blocks.filter(b => b.type === 'theme_block' && text(b.settings.value));
  if (items.length === 0) return null;
  return (
    <section style={{ background: t.colors.dark, color: t.colors.darkInk, fontFamily: t.fonts.body }}>
      <div className="mx-auto text-center" style={{ maxWidth: t.layout.maxWidth, padding: `clamp(40px,6vw,72px) ${t.layout.containerPadX}` }}>
        {text(section.settings.heading) && <h2 className="m-0 mb-3 text-[clamp(24px,3vw,34px)] font-semibold">{text(section.settings.heading)}</h2>}
        {text(section.settings.intro) && <p className="m-0 mx-auto mb-10 max-w-[560px] text-sm opacity-80">{text(section.settings.intro)}</p>}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((b, i) => (
            <div key={b._id ?? i} className="flex flex-col items-center gap-2">
              <b className="text-[clamp(32px,4vw,48px)] font-semibold leading-none" style={{ color: t.colors.accent }}><bdi>{text(b.settings.value)}</bdi></b>
              <span className="text-sm font-semibold">{text(b.settings.title)}</span>
              {text(b.settings.text) && <span className="max-w-[220px] text-xs opacity-70">{text(b.settings.text)}</span>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
});

/** Comparison table: one row per line, columns split with | (first line is the header). */
function parseRows(raw: string): string[][] {
  return raw.split('\n').map(line => line.split('|').map(c => c.trim())).filter(r => r.some(Boolean)).slice(0, 30);
}
custom.set('tech.comparison_table', (section, _b, colors) => {
  const rows = parseRows(text(section.settings.rows));
  if (rows.length < 2) return null;
  const [head, ...body] = rows;
  return (
    <LedupSectionShell colors={colors} heading={text(section.settings.heading)}>
      <div className="overflow-x-auto" style={{ border: `1px solid ${colors.border}` }}>
        <table className="w-full border-collapse text-sm" style={{ color: colors.ink }}>
          <thead><tr style={{ background: colors.bgAlt }}>{head.map((h, i) => <th key={i} scope="col" className="px-4 py-3 text-start font-semibold">{h}</th>)}</tr></thead>
          <tbody>
            {body.map((r, ri) => (
              <tr key={ri} style={{ borderTop: `1px solid ${colors.border}`, background: ri % 2 === 1 ? colors.bgAlt : 'transparent' }}>
                {head.map((_, ci) => ci === 0 ? <th key={ci} scope="row" className="px-4 py-3 text-start font-medium">{r[ci]}</th> : <td key={ci} className="px-4 py-3">{r[ci] ?? ''}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {text(section.settings.note) && <p className="m-0 mt-3 text-xs" style={{ color: colors.inkMuted }}>{copyText(section.settings, 'note', '')}</p>}
    </LedupSectionShell>
  );
});
