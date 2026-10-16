import { Link, useLocation, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { apiGetPublicBlogPost, apiListPublicBlogPosts } from '@/api/services/storeBlog';
import { apiGetPublicMetafieldValues } from '@/api/services/metafields';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { FashionSectionRenderer } from '../sections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { ErrorState, StatusPill } from '../ui/primitives';
import { FashionNotFoundPage } from './FashionNotFoundPage';
import { BlogComments } from './content/BlogComments';
import { BlogContentBlocks } from './content/BlogContentBlocks';
import { BlogPostCard } from './content/BlogPostCard';
import { ShareBar } from './content/ShareBar';
import { blogIndexPath, formatPostDate, readingMinutes, relatedPosts } from '../../core/content/blogUtils';
import { PageBox, PageSkeleton } from './pageParts';
import { splitAround, useLoad, useTemplateSections } from '../../core/pageHooks';
import { safeUrl } from '../../core/community/communityFormat';

/** `/blog/:postSlug` and `/blogs/:blogSlug/:postSlug` - one article with SEO, rich content, share, related posts and comments. */
export function FashionBlogPostPage() {
  const { postSlug = '', blogSlug } = useParams<{ postSlug: string; blogSlug?: string }>();
  const { store } = useStorefront();
  const { pathname } = useLocation();

  const { data, loading, error, retry } = useLoad(async () => {
    const post = await apiGetPublicBlogPost(store.storeId, postSlug).then(r => r.data).catch((e: { status?: number }) => { if (e?.status === 404) return null; throw e; });
    if (!post) return null;
    const dynamic = await apiGetPublicMetafieldValues(store.storeId, 'article', post._id)
      .then(r => Object.fromEntries(r.data.map(v => [`${v.namespace}:${v.key}`, v.value])) as Record<string, string>)
      .catch(() => ({} as Record<string, string>));
    return { post, dynamic };
  }, [store.storeId, postSlug]);

  const related = useLoad(() => apiListPublicBlogPosts(store.storeId, blogSlug, 1, 12).then(r => r.data?.posts ?? []).catch(() => []), [store.storeId, blogSlug]);
  const { before, after } = splitAround(useTemplateSections(store.storeId, 'page', 'blog-article'), 'article_content');

  const post = data?.post ?? null;
  useStorefrontSeo({ title: post ? (post.seoTitle || post.title) : 'Journal', description: post ? (post.seoDescription || post.excerpt || undefined) : undefined, image: post?.coverImage ?? undefined });

  if (loading) return <PageSkeleton hero />;
  if (error) return <PageBox><ErrorState message="We couldn't load this article." onRetry={retry} /></PageBox>;
  if (!data || !post) return <FashionNotFoundPage />;

  const dynamic = data.dynamic;
  const minutes = readingMinutes(post.content);
  const date = formatPostDate(post.publishedAt);
  const cover = safeUrl(post.coverImage);
  const url = `${window.location.origin}${pathname}`;
  const more = related.data ? relatedPosts(related.data, post.slug, post.tags ?? [], 3) : [];
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title, description: post.seoDescription || post.excerpt || undefined,
    image: cover ?? undefined, datePublished: post.publishedAt ?? undefined, dateModified: post.updatedAt, mainEntityOfPage: url,
    author: post.authorName ? { '@type': 'Person', name: post.authorName } : { '@type': 'Organization', name: store.name },
    publisher: { '@type': 'Organization', name: store.name },
  }).replace(/</g, '\\u003c');

  return (
    <>
      {before.length > 0 && <FashionSectionRenderer sections={before} dynamicSourceValues={dynamic} />}
      <article>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
        <PageBox narrow>
          <Link to={blogIndexPath(blogSlug)} className="mb-8 inline-flex items-center gap-2 text-sm font-medium no-underline" style={{ color: t.colors.inkMuted }}><ArrowLeft size={16} aria-hidden />All stories</Link>
          {(post.tags?.length ?? 0) > 0 && <div className="mb-4 flex flex-wrap gap-1.5">{post.tags.map(tag => <StatusPill key={tag}>{tag}</StatusPill>)}</div>}
          <h1 className="m-0 text-[clamp(32px,5.2vw,58px)] font-medium leading-[1.06] tracking-tight" style={{ fontFamily: t.fonts.display }}>{post.title}</h1>
          {post.excerpt && <p className="m-0 mt-5 text-lg leading-relaxed" style={{ color: t.colors.inkMuted }}>{post.excerpt}</p>}
          <p className="m-0 mt-5 text-sm" style={{ color: t.colors.inkMuted }}>
            {post.authorName && <>By <span className="font-semibold" style={{ color: t.colors.ink }}>{post.authorName}</span> · </>}
            {date && <><time dateTime={post.publishedAt ?? undefined}>{date}</time> · </>}{minutes} min read
          </p>
        </PageBox>
        {cover && (
          <PageBox padY={false}>
            <img src={cover} alt="" decoding="async" className="mt-8 block w-full object-cover" style={{ borderRadius: 28, maxHeight: 560, aspectRatio: '16 / 8' }} />
          </PageBox>
        )}
        <PageBox narrow>
          <div className="flex flex-col gap-6" style={{ fontFamily: t.fonts.body }}>
            <BlogContentBlocks blocks={post.content ?? []} dynamicSourceValues={dynamic} />
          </div>
          <div className="mt-10 pt-6" style={{ borderTop: `1px solid ${t.colors.border}` }}><ShareBar url={url} title={post.title} /></div>
          {post.commentsEnabled && <BlogComments storeId={store.storeId} postId={post._id} />}
        </PageBox>
        {more.length > 0 && (
          <PageBox>
            <h2 className="m-0 mb-8 text-[clamp(24px,3vw,34px)] font-medium tracking-tight">Keep <span className="fx-serif" style={{ fontSize: '1.06em' }}>reading</span></h2>
            <div className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">{more.map(p => <BlogPostCard key={p.slug} post={p} blogSlug={blogSlug} />)}</div>
          </PageBox>
        )}
      </article>
      {after.length > 0 && <FashionSectionRenderer sections={after} dynamicSourceValues={dynamic} />}
    </>
  );
}
