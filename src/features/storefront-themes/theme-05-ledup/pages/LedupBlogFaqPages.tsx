/* eslint-disable @typescript-eslint/no-explicit-any -- article block settings are seller-authored JSON */
import { useMemo } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { handleOf } from '@/utils/activeStoreText';
import { ts } from '@/utils/tStatic';
import { renderRichText } from '@/utils/richText';
import { localizeFields } from '@/utils/storeText';
import { useStoreTextIndex } from '@/features/storefront/storeTextContext';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicBlogPost, apiListPublicBlogPosts, type BlogPostSummary } from '@/api/services/storeBlog';
import { apiListPublicStoreFaqs } from '@/api/services/storeFaq';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { articleJsonLd, blogJsonLd, breadcrumbJsonLd, pageUrlBuilder } from '../../core/seo/jsonLd';
import { useBlogFeed } from '../../core/content/useBlogFeed';
import { blogIndexPath, blogPostPath, formatPostDate, readingMinutes, relatedPosts } from '../../core/content/blogUtils';
import { safeUrl } from '../../core/community/communityFormat';
import { useLoad } from '../../core/pageHooks';
import { LedupBox, LedupError, LedupSkeleton } from '../ui/ledupUi';
import { LedupNotFoundPage } from './LedupContentPages';

function PostCard({ post, blogSlug }: { post: BlogPostSummary; blogSlug?: string }) {
  const href = blogPostPath(blogSlug, handleOf(post));
  const date = formatPostDate(post.publishedAt);
  return (
    <article className="ld-product-card flex flex-col overflow-hidden">
      {post.coverImage && (
        <Link to={href} tabIndex={-1} aria-hidden className="block aspect-[16/10] overflow-hidden bg-stone-50">
          <img src={post.coverImage} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" />
        </Link>
      )}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          {date && <time dateTime={post.publishedAt ?? undefined} className="text-xs font-medium text-[var(--ld-accent)]">{date}</time>}
          <h2 className="m-0 mt-2 text-lg font-bold leading-snug text-stone-900"><Link to={href} className="text-inherit no-underline">{post.title}</Link></h2>
          {post.excerpt && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-stone-600">{post.excerpt}</p>}
        </div>
        <div className="mt-6 border-t border-stone-100 pt-4">
          <Link to={href} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ld-accent)] no-underline hover:underline">{ts('pg.read_more', 'Read more')} <ArrowUpRight size={13} aria-hidden /></Link>
        </div>
      </div>
    </article>
  );
}

/** `/blog` and `/blogs/:blogSlug`: the posts of the store's blogs (all blogs together, or the chosen one). */
export function LedupBlogIndexPage() {
  const { blogSlug } = useParams<{ blogSlug?: string }>();
  const { store } = useStorefront();
  const feed = useBlogFeed(store.storeId, blogSlug, 12);
  const title = feed.title ?? ts('blog.label', 'Blog');
  const desc = ts('pg.stories_guides_and_news_from_store', 'Stories, guides and news from {{store}}.', { store: store.name });
  useStorefrontSeo({ title, description: desc });
  const { origin, pathname } = window.location;
  const urlFor = pageUrlBuilder(origin, pathname);
  useJsonLd('blog', !feed.loading && !feed.error && feed.posts.length ? blogJsonLd({ name: title, description: desc, url: `${origin}${pathname}`, origin, posts: feed.posts, postUrl: slug => urlFor(blogPostPath(blogSlug, slug)) }) : null);

  return (
    <div className="py-16">
      <LedupBox>
        <h1 className="mb-2 text-3xl font-bold text-stone-900 md:text-4xl">{title}</h1>
        <p className="mb-8 text-sm text-stone-500">{desc}</p>
        {feed.blogs.length > 1 && (
          <nav aria-label={ts('blog.label', 'Blog')} className="mb-8 flex flex-wrap gap-2">
            {[{ title: ts('pg.word_all', 'All'), slug: undefined as string | undefined }, ...feed.blogs].map(b => {
              const on = b.slug === blogSlug;
              return <Link key={b.slug ?? 'all'} to={b.slug ? `/blogs/${b.slug}` : '/blog'} aria-current={on ? 'page' : undefined} className={`rounded-full px-5 py-2 text-xs font-semibold no-underline ${on ? 'bg-[#594C40] text-white' : 'border border-stone-300 bg-white text-stone-700'}`}>{b.title}</Link>;
            })}
          </nav>
        )}
        {feed.loading ? (
          <div role="status" className="grid grid-cols-1 gap-8 md:grid-cols-3">{[0, 1, 2].map(i => <LedupSkeleton key={i} h={280} />)}</div>
        ) : feed.error ? (
          <LedupError message={ts('pg.we_couldn_t_load_the_posts', "We couldn't load the posts.")} onRetry={feed.retry} />
        ) : feed.posts.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-12 text-center text-stone-500">{ts('pg.no_posts_yet', 'No posts yet')}</div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">{feed.posts.map(p => <PostCard key={p.slug} post={p} blogSlug={blogSlug} />)}</div>
            {feed.hasMore && (
              <div className="mt-12 flex flex-col items-center gap-3">
                {feed.loadMoreFailed && <p role="alert" className="m-0 text-sm text-red-600">{ts('pg.we_couldn_t_load_more_posts', "We couldn't load more posts.")}</p>}
                <button type="button" disabled={feed.loadingMore} onClick={() => void feed.loadMore()} className="cursor-pointer rounded-full border border-stone-300 bg-white px-8 py-3 text-xs font-semibold tracking-wider text-stone-800 hover:border-stone-900 disabled:opacity-60">
                  {feed.loadMoreFailed ? ts('checkout.tryAgain', 'Try again') : ts('pg.load_more_posts', 'Load more posts')}
                </button>
              </div>
            )}
          </>
        )}
      </LedupBox>
    </div>
  );
}

function ArticleBlocks({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        const s = (block.settings ?? {}) as Record<string, any>;
        const key = String((block as { id?: string }).id ?? block._id ?? i);
        switch (block.type) {
          case 'heading': {
            const Tag = s.level === 'h2' ? 'h2' : s.level === 'h4' ? 'h4' : 'h3';
            return <Tag key={key} className="m-0 mt-4 text-2xl font-bold leading-tight text-stone-900">{String(s.text ?? '')}</Tag>;
          }
          case 'paragraph':
            return <p key={key} className="m-0 whitespace-pre-line text-base leading-8 text-stone-700">{renderRichText(String(s.text ?? ''))}</p>;
          case 'image': {
            const src = safeUrl(s.imageUrl);
            if (!src) return null;
            return (
              <figure key={key} className="m-0 my-2">
                <img src={src} alt={s.alt ?? ''} loading="lazy" decoding="async" className="block w-full rounded-2xl" />
                {s.caption && <figcaption className="mt-3 text-center text-xs text-stone-500">{s.caption}</figcaption>}
              </figure>
            );
          }
          case 'quote':
            return <blockquote key={key} className="m-0 my-3 rounded-2xl bg-stone-50 px-8 py-6"><p className="m-0 text-xl leading-snug text-stone-800">“{s.text}”</p>{s.author && <footer className="mt-3 text-sm font-medium text-stone-500">{s.author}</footer>}</blockquote>;
          case 'list': {
            const items = (Array.isArray(s.items) ? s.items : []) as string[];
            const List = s.style === 'numbered' ? 'ol' : 'ul';
            return <List key={key} className="m-0 flex flex-col gap-2 ps-6 text-base leading-7 text-stone-700" style={{ listStyleType: s.style === 'numbered' ? 'decimal' : 'disc' }}>{items.map((it, j) => <li key={j}>{renderRichText(it)}</li>)}</List>;
          }
          case 'divider':
            return <hr key={key} className="my-4 border-0 border-t border-stone-200" />;
          default:
            return null;
        }
      })}
    </>
  );
}

/** `/blog/:postSlug` and `/blogs/:blogSlug/:postSlug`. */
export function LedupBlogPostPage() {
  const { postSlug = '', blogSlug } = useParams<{ postSlug: string; blogSlug?: string }>();
  const { store } = useStorefront();
  const { pathname } = useLocation();
  const { data: post, loading, error, retry } = useLoad(
    () => apiGetPublicBlogPost(store.storeId, postSlug).then(r => r.data).catch((e: { status?: number }) => { if (e?.status === 404) return null; throw e; }),
    [store.storeId, postSlug],
  );
  const more = useLoad(() => apiListPublicBlogPosts(store.storeId, blogSlug, 1, 12).then(r => r.data?.posts ?? []).catch(() => []), [store.storeId, blogSlug]);

  useStorefrontSeo({ title: post ? (post.seoTitle || post.title) : ts('blog.label', 'Blog'), description: post ? (post.seoDescription || post.excerpt || undefined) : undefined, image: post?.coverImage ?? undefined });
  const origin = window.location.origin;
  const urlFor = pageUrlBuilder(origin, pathname);
  const url = `${origin}${pathname}`;
  useJsonLd('article', post ? articleJsonLd({ headline: post.title, description: post.seoDescription || post.excerpt, image: post.coverImage, datePublished: post.publishedAt, dateModified: post.updatedAt, author: post.authorName, storeName: store.name, logo: store.logo, url, origin }) : null);
  useJsonLd('breadcrumb', post ? breadcrumbJsonLd([{ name: store.name, url: urlFor('/') }, { name: ts('blog.label', 'Blog'), url: urlFor(blogIndexPath(blogSlug)) }, { name: post.title, url }]) : null);

  if (loading) return <LedupBox narrow><LedupSkeleton h={320} rows={2} /></LedupBox>;
  if (error) return <LedupBox><LedupError message={ts('pg.we_couldn_t_load_this_article', "We couldn't load this article.")} onRetry={retry} /></LedupBox>;
  if (!post) return <LedupNotFoundPage />;

  const date = formatPostDate(post.publishedAt);
  const cover = safeUrl(post.coverImage);
  const next = more.data ? relatedPosts(more.data, post.slug, post.tags ?? [], 3) : [];

  return (
    <article className="py-12">
      <LedupBox narrow>
        <Link to={blogIndexPath(blogSlug)} className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-stone-500 no-underline"><ArrowLeft size={16} className="fx-flip-rtl" aria-hidden />{ts('blog.label', 'Blog')}</Link>
        <h1 className="m-0 text-[clamp(30px,4.5vw,48px)] font-bold leading-tight tracking-tight text-stone-900">{post.title}</h1>
        {post.excerpt && <p className="mt-4 text-lg leading-relaxed text-stone-500">{post.excerpt}</p>}
        <p className="mt-4 text-sm text-stone-500">
          {post.authorName && <>{post.authorName} · </>}{date && <><time dateTime={post.publishedAt ?? undefined}>{date}</time> · </>}{ts('pg.minutes_min_read', '{{minutes}} min read', { minutes: readingMinutes(post.content) })}
        </p>
        {cover && <img src={cover} alt="" decoding="async" className="mt-8 block w-full rounded-3xl object-cover" style={{ maxHeight: 520 }} />}
        <div className="mt-8 flex flex-col gap-6"><ArticleBlocks blocks={post.content ?? []} /></div>
      </LedupBox>
      {next.length > 0 && (
        <LedupBox>
          <h2 className="mb-8 mt-12 text-2xl font-bold text-stone-900">{ts('pg.keep_reading', 'Keep reading')}</h2>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">{next.map(p => <PostCard key={p.slug} post={p} blogSlug={blogSlug} />)}</div>
        </LedupBox>
      )}
    </article>
  );
}

/** `/faqs`: the questions the seller manages under Online Store, as an accordion. */
export function LedupFaqsPage() {
  const { store } = useStorefront();
  useStorefrontSeo({ title: ts('faq.title', 'Frequently asked questions') });
  const { data: source, loading, error, retry } = useLoad(() => apiListPublicStoreFaqs(store.storeId).then(r => r.data ?? []), [store.storeId]);
  const textIndex = useStoreTextIndex();
  const data = useMemo(() => (source ? source.map(f => localizeFields(f, `faq:${f._id}`, textIndex)) : source), [source, textIndex]);
  const jsonLd = data && data.length > 0 ? JSON.stringify({
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: data.map(f => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  }).replace(/</g, '\\u003c') : null;

  return (
    <div className="py-16">
      <LedupBox narrow>
        <h1 className="mb-8 text-3xl font-bold text-stone-900 md:text-4xl">{ts('faq.title', 'Frequently asked questions')}</h1>
        {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />}
        {loading ? <LedupSkeleton h={68} rows={4} />
          : error ? <LedupError message={ts('pg.we_couldn_t_load_the_questions_right_now', "We couldn't load the questions right now.")} onRetry={retry} />
          : !data || data.length === 0 ? <div className="rounded-2xl border border-stone-200 bg-stone-50 p-12 text-center text-stone-500">{ts('pg.no_questions_yet', 'No questions yet')}</div>
          : (
            <div className="divide-y divide-stone-200">
              {data.map(f => (
                <details key={f._id} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold text-stone-900">{f.question}<span aria-hidden className="text-[var(--ld-accent)] transition group-open:rotate-45">+</span></summary>
                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-600">{f.answer}</p>
                </details>
              ))}
            </div>
          )}
      </LedupBox>
    </div>
  );
}
