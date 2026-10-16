/* eslint-disable react-refresh/only-export-components -- this module registers renderers as a side effect */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import { tt } from '@/utils/tStatic';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { apiListPublicBlogPosts, type BlogPostSummary } from '@/api/services/storeBlog';
import { apiGetPublicMetaobjectEntriesByType, type MetaobjectEntry } from '@/api/services/metaobjects';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { imageFit } from '../../imageFit';
import { copyText } from '../../sectionCopy';
import { CollageSection, CollectionBannerSection, FeaturedProductSection, MultirowSection, RecentlyViewedSection } from '../../moreSections';
import type { SharedThemeTokens } from '../../sharedSections';
import { fashionTheme as t, type FashionColors } from '../theme.config';
import { FashionButton } from '../components/FashionButton';
import { FashionProductCard } from '../components/FashionProductCard';
import { registerFashionSection } from './sectionRegistry';
import { LinkButton, SectionShell, TextLink } from './SectionShell';

// ── Library sections shared across themes (one implementation, Maison's tokens) ──────────
const tokens = (): SharedThemeTokens => ({
  fonts: t.fonts, layout: t.layout, imageRadiusPx: t.imageRadiusPx,
  Button: FashionButton as SharedThemeTokens['Button'], ProductCard: FashionProductCard as SharedThemeTokens['ProductCard'],
});
const lib = (Comp: typeof MultirowSection) => (section: Section, blocks: Block[], colors: FashionColors) => (
  <Comp section={section} blocks={blocks} colors={colors} theme={tokens()} />
);
registerFashionSection('multirow', lib(MultirowSection));
registerFashionSection('collage', lib(CollageSection));
registerFashionSection('featured_product', lib(FeaturedProductSection));
registerFashionSection('collection_banner', lib(CollectionBannerSection));
registerFashionSection('recently_viewed', lib(RecentlyViewedSection));

// ── Latest blog posts ────────────────────────────────────────────────────────────────────
function BlogPostsSection({ section, colors }: { section: Section; colors: FashionColors }) {
  const { store } = useStorefront();
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);
  const limit = Math.min(12, Math.max(1, Number(section.settings.limit) || 3));
  const fit = imageFit(section.settings.imageRatio, '4 / 3');

  useEffect(() => {
    let off = false;
    apiListPublicBlogPosts(store.storeId, undefined, 1, limit)
      .then(res => { if (!off) setPosts(res.data.posts); })
      .catch(() => { if (!off) setPosts([]); });
    return () => { off = true; };
  }, [store.storeId, limit]);

  if (!posts || posts.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={section.settings.heading} action={<TextLink to="/blog" color={colors.ink}>{copyText(section.settings, 'viewAllLabel', 'View all')}</TextLink>}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map(post => (
          <Link key={post.slug} to={`/blog/${post.slug}`} className="block no-underline" style={{ color: colors.ink }}>
            {post.coverImage ? (
              <div style={{ ...fit.box, overflow: 'hidden', borderRadius: t.imageRadiusPx }}><img src={post.coverImage} alt={post.title} loading="lazy" style={fit.img} /></div>
            ) : (
              <div className="flex w-full items-center justify-center" style={{ aspectRatio: '4 / 3', background: colors.bgAlt, borderRadius: t.imageRadiusPx }}><ImageOff size={22} aria-hidden style={{ color: colors.inkMuted }} /></div>
            )}
            <div className="pt-4">
              {post.publishedAt && <p className="m-0 mb-1 text-xs" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{new Date(post.publishedAt).toLocaleDateString()}</p>}
              <p className="m-0 text-lg font-semibold leading-snug" style={{ fontFamily: t.fonts.display }}>{post.title}</p>
              {post.excerpt && <p className="m-0 mt-2 line-clamp-2 text-sm leading-relaxed" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{post.excerpt}</p>}
            </div>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}
registerFashionSection('blog_posts', (section, _b, colors) => <BlogPostsSection section={section} colors={colors} />);

// ── Metaobject list (every value is shown as plain text) ─────────────────────────────────
function MetaobjectListSection({ section, colors }: { section: Section; colors: FashionColors }) {
  const { store } = useStorefront();
  const type = section.settings.metaobjectType as string | undefined;
  const [entries, setEntries] = useState<MetaobjectEntry[] | null>(null);

  useEffect(() => {
    if (!type) return;
    let off = false;
    apiGetPublicMetaobjectEntriesByType(store.storeId, type)
      .then(res => { if (!off) setEntries(res.data); })
      .catch(() => { if (!off) setEntries([]); });
    return () => { off = true; };
  }, [store.storeId, type]);

  if (!type || (entries !== null && entries.length === 0)) return null;
  return (
    <SectionShell colors={colors} heading={section.settings.heading} align="center">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {entries === null
          ? Array.from({ length: 3 }).map((_, i) => <div key={i} aria-hidden className="h-32 animate-pulse" style={{ background: colors.bgAlt, borderRadius: 20 }} />)
          : entries.map(entry => (
            <div key={entry._id} className="flex flex-col gap-3 p-6" style={{ background: colors.bgAlt, borderRadius: 20 }}>
              <p className="m-0 text-lg font-semibold" style={{ fontFamily: t.fonts.display }}>{entry.displayName}</p>
              {entry.fields.length > 0 && (
                <dl className="m-0 flex flex-col gap-1.5">
                  {entry.fields.map(f => (
                    <div key={f.key} className="flex items-baseline gap-2">
                      <dt className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.inkMuted }}>{f.key}</dt>
                      <dd className="m-0 break-words text-[13px]">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          ))}
      </div>
    </SectionShell>
  );
}
registerFashionSection('metaobject_list', (section, _b, colors) => <MetaobjectListSection section={section} colors={colors} />);

// ── Drop countdown ───────────────────────────────────────────────────────────────────────
function timeLeft(targetIso?: string) {
  const target = targetIso ? new Date(targetIso).getTime() : NaN;
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86400000), hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000), seconds: Math.floor((diff % 60000) / 1000), done: false,
  };
}

function DropCountdownSection({ section }: { section: Section }) {
  const s = section.settings;
  const [now, setNow] = useState(() => timeLeft(s.targetDate));
  useEffect(() => {
    const id = setInterval(() => setNow(timeLeft(s.targetDate)), 1000);
    return () => clearInterval(id);
  }, [s.targetDate]);
  if (!now) return null;
  const units: [number, string][] = [
    [now.days, tt('countdown.days', 'Days')], [now.hours, tt('countdown.hrs', 'Hrs')],
    [now.minutes, tt('countdown.min', 'Min')], [now.seconds, tt('countdown.sec', 'Sec')],
  ];
  return (
    <section style={{ background: t.colors.accent, color: t.colors.accentInk, padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto flex max-w-[680px] flex-col items-center gap-6 text-center">
        {s.heading && <h2 className="m-0 text-[clamp(26px,3.5vw,42px)] font-semibold leading-tight tracking-tight" style={{ fontFamily: t.fonts.display }}>{s.heading}</h2>}
        {s.subheading && <p className="m-0 text-sm font-medium uppercase tracking-widest opacity-70" style={{ fontFamily: t.fonts.body }}>{s.subheading}</p>}
        {now.done ? (
          <p className="m-0 text-2xl" style={{ fontFamily: t.fonts.display }}>{copyText(s, 'endedText', 'Dropped!')}</p>
        ) : (
          <div className="flex items-center gap-6 sm:gap-10" role="timer" aria-label={s.heading || 'Countdown'}>
            {units.map(([value, label]) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-[clamp(30px,5vw,52px)] font-semibold leading-none" style={{ fontFamily: t.fonts.display, fontVariantNumeric: 'tabular-nums' }}>{String(value).padStart(2, '0')}</span>
                <span className="text-[10px] uppercase tracking-[0.14em] opacity-70" style={{ fontFamily: t.fonts.body }}>{label}</span>
              </div>
            ))}
          </div>
        )}
        {s.ctaText && s.ctaLink && <LinkButton text={s.ctaText} link={s.ctaLink} variant="light" />}
      </div>
    </section>
  );
}
registerFashionSection('drop_countdown', section => <DropCountdownSection section={section} />);
