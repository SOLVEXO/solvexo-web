/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this file registers renderers, it exports none */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { handleOf } from '@/utils/activeStoreText';
import { renderRichText } from '@/utils/richText';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicStoreProducts } from '@/api/services/store';
import { apiGetPublicCollections, type PublicCollectionSummary } from '@/api/services/collections';
import { useCurrencyPreference } from '@/contexts/CurrencyPreferenceContext';
import { useLoad } from '../../core/pageHooks';
import { featureIcon } from '../../featureIcons';
import { PreviewBlock } from '../../previewInspector';
import { EditableText } from '../../inlineEdit';
import { LedupProductCard } from '../components/LedupProductCard';
import { LedupHeroCategoryBanner } from '../components/LedupHeroCategoryBanner';
import { LedupBox, LedupSkeleton } from '../ui/ledupUi';
import { baseTheme as t, type BaseColors } from '../theme.base';
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

const solidCta = 'inline-flex items-center gap-2 rounded-full bg-[#8C7355] px-6 py-3 text-sm font-medium text-white no-underline transition hover:bg-[#796247]';

// ── Featured products ───────────────────────────────────────────────────────
function FeaturedProducts({ settings, colors }: { settings: Record<string, any>; colors: BaseColors }) {
  const { store } = useStorefront();
  const { currency } = useCurrencyPreference();
  const limit = Math.min(24, Math.max(1, Number(settings.limit) || 8));
  const { data: items, loading, error, retry } = useLoad(
    () => apiGetPublicStoreProducts(store.storeId, { limit, sort: 'newest' }).then(r => r.data?.products ?? []),
    [store.storeId, limit],
  );
  if (!loading && !error && (items ?? []).length === 0) return null;
  const heading = text(settings.heading);

  return (
    <section className="py-12" style={{ color: colors.ink }}>
      <LedupBox padY={false}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            {heading && <h2 className="m-0 text-2xl font-bold tracking-tight md:text-3xl" style={{ fontFamily: t.fonts.display }}><EditableText value={heading} settingKey="heading" /></h2>}
            {text(settings.subheading) && <p className="mt-1 text-sm text-stone-500">{text(settings.subheading)}</p>}
          </div>
          <Link to="/search" className="inline-flex items-center gap-1.5 rounded-full border border-stone-300 px-4 py-2 text-xs font-medium text-stone-800 no-underline transition hover:border-stone-900">
            {ts('ld.viewAllProducts', 'View all products')} <ArrowUpRight size={13} aria-hidden />
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <LedupSkeleton key={i} h={300} />)}</div>
        ) : error ? (
          <div role="alert" className="py-8 text-center text-sm text-red-500">{ts('pg.we_couldn_t_load_the_products', "We couldn't load the products.")} <button type="button" onClick={retry} className="cursor-pointer border-0 bg-transparent underline">{ts('checkout.tryAgain', 'Try again')}</button></div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {(items ?? []).map(p => <LedupProductCard key={p._id} product={p} currency={currency} />)}
          </div>
        )}
      </LedupBox>
    </section>
  );
}

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

// ── Image banner ────────────────────────────────────────────────────────────
function ImageBanner({ settings }: { settings: Record<string, any> }) {
  const [errored, setErrored] = useState(false);
  const img = text(settings.imageUrl);
  if (!img && !text(settings.heading) && !text(settings.subheading)) return null;
  const has = !!img && !errored;
  const overlay = Math.min(80, Math.max(0, Number(settings.overlayOpacity ?? 30)));
  return (
    <section className="py-6">
      <LedupBox padY={false}>
        <div className="relative flex min-h-[320px] items-center overflow-hidden rounded-3xl bg-stone-100 md:min-h-[440px]">
          {has && <img src={img} alt="" onError={() => setErrored(true)} className="absolute inset-0 h-full w-full object-cover" />}
          {has && overlay > 0 && <div aria-hidden className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay / 100})` }} />}
          <div className={`relative flex max-w-2xl flex-col gap-4 p-8 md:p-14 ${has ? 'text-white' : 'text-stone-900'}`}>
            {text(settings.heading) && <h2 className="m-0 text-[clamp(28px,4.5vw,54px)] font-light leading-tight" style={{ fontFamily: t.fonts.display }}><EditableText value={settings.heading} settingKey="heading" /></h2>}
            {text(settings.subheading) && <p className="m-0 text-base opacity-90 md:text-lg"><EditableText value={settings.subheading} settingKey="subheading" /></p>}
            <div><Cta label={text(settings.ctaText)} link={settings.ctaLink} className={solidCta} /></div>
          </div>
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
            {eyebrow && <span className="text-xs font-semibold uppercase tracking-wider text-[#8C7355]">{eyebrow}</span>}
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
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8C7355]/10 text-[#8C7355]"><Icon size={24} aria-hidden /></div>
                  {text(s.title) && <h3 className="mb-2 text-lg font-bold text-stone-900">{s.title}</h3>}
                  {text(s.description) && <p className="mb-4 text-sm leading-relaxed text-stone-500">{renderRichText(s.description)}</p>}
                  <Cta label={text(s.linkText)} link={s.link} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8C7355] no-underline hover:underline" />
                </div>
              </PreviewBlock>
            );
          })}
        </div>
      </LedupBox>
    </section>
  );
}

// ── Collection list ─────────────────────────────────────────────────────────
function CollectionList({ settings }: { settings: Record<string, any> }) {
  const { store } = useStorefront();
  const [items, setItems] = useState<PublicCollectionSummary[] | null>(null);
  useEffect(() => {
    let off = false;
    apiGetPublicCollections(store.storeId).then(r => { if (!off) setItems(r.data ?? []); }).catch(() => { if (!off) setItems([]); });
    return () => { off = true; };
  }, [store.storeId]);
  if (!items || items.length === 0) return null;
  const limit = Math.min(24, Math.max(1, Number(settings.limit) || 6));
  return (
    <section className="py-12">
      <LedupBox padY={false}>
        {text(settings.heading) && <h2 className="mb-8 mt-0 text-2xl font-bold tracking-tight text-stone-900 md:text-3xl" style={{ fontFamily: t.fonts.display }}>{settings.heading}</h2>}
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
          {items.slice(0, limit).map(c => (
            <Link key={c._id} to={`/collections/${handleOf(c)}`} className="ld-product-card group block overflow-hidden p-4 no-underline">
              <div className="aspect-square overflow-hidden rounded-xl bg-stone-50/60">
                {c.image ? <img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center p-4 text-center text-sm text-stone-400">{c.name}</div>}
              </div>
              <h3 className="m-0 mt-3 text-sm font-semibold text-stone-900">{c.name}</h3>
            </Link>
          ))}
        </div>
      </LedupBox>
    </section>
  );
}

// ── Registration ────────────────────────────────────────────────────────────
const categoryTabs = () => <section className="pb-6 pt-2"><LedupHeroCategoryBanner /></section>;

registerLedupSection('featured_products', (sec, _b, col) => <FeaturedProducts settings={sec.settings} colors={col} />);
registerLedupSection('hero_banner', categoryTabs);
registerLedupSection('hero', (sec) => <ImageBanner settings={sec.settings} />);
registerLedupSection('image_banner', (sec) => <ImageBanner settings={sec.settings} />);
registerLedupSection('rich_text', (sec, blocks, _c, dynamic) => <RichText settings={sec.settings} blocks={blocks} dynamic={dynamic} />);
registerLedupSection('feature_list', (sec, blocks) => <FeatureList settings={sec.settings} blocks={blocks} />);
registerLedupSection('collection_list', (sec) => <CollectionList settings={sec.settings} />);

// Theme-defined sections (namespace `ledup.`): the same renderers, driven by the seller's own fields.
registerLedupSection('theme_section', (sec, blocks, col, dynamic) => {
  const key = String(sec.settings?.sectionKey || '');
  if (key === 'ledup.category_tabs') return categoryTabs();
  if (key === 'ledup.highlights') return <FeatureList settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.statement') return <RichText settings={sec.settings} blocks={blocks} dynamic={dynamic} />;
  void col;
  return null;
});
