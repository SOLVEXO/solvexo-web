import { useState } from 'react';
import { ts } from '@/utils/tStatic';
import { useParams } from 'react-router-dom';
import { Newspaper } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { FashionSectionRenderer } from '../sections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { EmptyState, ErrorState, Page, PageTitle, PillButton, SkeletonBlock } from '../ui/primitives';
import { BlogPostCard } from './content/BlogPostCard';
import { topicsOf } from '../../core/content/blogUtils';
import { useBlogFeed } from '../../core/content/useBlogFeed';
import { splitAround, useTemplateSections } from '../../core/pageHooks';

/** `/blog` and `/blogs/:blogSlug` - the journal: featured post, topic filter, grid, load more, plus the seller's template sections. */
export function FashionBlogIndexPage() {
  const { blogSlug } = useParams<{ blogSlug?: string }>();
  const { store } = useStorefront();
  const feed = useBlogFeed(store.storeId, blogSlug);
  const [topic, setTopic] = useState<string | null>(null);
  const { before, after } = splitAround(useTemplateSections(store.storeId, 'page', 'blog-index'), 'blog_post_list');
  const title = feed.title ?? 'Journal';
  useStorefrontSeo({ title, description: `Stories, guides and news from ${store.name}.` });

  const topics = topicsOf(feed.posts);
  const activeTopic = topic && topics.includes(topic) ? topic : null;
  const filtered = activeTopic ? feed.posts.filter(p => p.tags?.includes(activeTopic)) : feed.posts;
  const [featured, ...rest] = filtered;

  return (
    <>
      {before.length > 0 && <FashionSectionRenderer sections={before} />}
      <Page>
        <PageTitle accent={feed.title ? undefined : 'stories'} subtitle={`Stories, guides and news from ${store.name}.`}>{feed.title ?? 'The'}</PageTitle>

        {feed.loading ? (
          <div role="status" aria-label={ts('pg.loading_posts', 'Loading posts')} className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map(i => <div key={i}><div className="animate-pulse" style={{ aspectRatio: '4 / 3', background: t.colors.bgAlt, borderRadius: 24 }} /><div className="mt-4"><SkeletonBlock h={18} rows={2} /></div></div>)}
          </div>
        ) : feed.error ? (
          <ErrorState message={ts('pg.we_couldn_t_load_the_posts', 'We couldn\'t load the posts.')} onRetry={feed.retry} />
        ) : feed.posts.length === 0 ? (
          <EmptyState icon={<Newspaper size={24} aria-hidden />} title={ts('pg.no_posts_yet', 'No posts yet')} text={ts('pg.check_back_soon_for_new_stories', 'Check back soon for new stories.')} />
        ) : (
          <>
            {topics.length > 0 && (
              <div role="group" aria-label={ts('pg.filter_posts_by_topic', 'Filter posts by topic')} className="fx-hide-scroll -mx-1 mb-8 flex gap-2 overflow-x-auto px-1">
                {[null, ...topics].map(tag => {
                  const on = tag === activeTopic;
                  return (
                    <button key={tag ?? 'all'} type="button" aria-pressed={on} onClick={() => setTopic(tag)} className="shrink-0 rounded-full px-4 py-2 text-sm font-medium"
                      style={{ cursor: 'pointer', border: `1px solid ${on ? t.colors.ink : t.colors.border}`, background: on ? t.colors.ink : 'transparent', color: on ? t.colors.bg : t.colors.ink }}>
                      {tag ?? 'All'}
                    </button>
                  );
                })}
              </div>
            )}
            <p className="sr-only" role="status">{activeTopic ? `${filtered.length} posts about ${activeTopic}` : ''}</p>
            {filtered.length === 0 ? (
              <EmptyState title={ts('pg.no_posts_in_this_topic_yet', 'No posts in this topic yet')} action={<PillButton variant="outline" onClick={() => setTopic(null)}>{ts('pg.show_all_posts', 'Show all posts')}</PillButton>} />
            ) : (
              <>
                {featured && <div className="mb-12"><BlogPostCard post={featured} blogSlug={blogSlug} featured /></div>}
                {rest.length > 0 && <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">{rest.map(p => <BlogPostCard key={p.slug} post={p} blogSlug={blogSlug} />)}</div>}
              </>
            )}
            {feed.hasMore && (
              <div className="mt-12 grid place-items-center gap-3">
                {feed.loadMoreFailed && <p role="alert" className="m-0 text-sm" style={{ color: t.colors.danger }}>{ts('pg.we_couldn_t_load_more_posts', 'We couldn\'t load more posts.')}</p>}
                <PillButton variant="outline" onClick={() => void feed.loadMore()} loading={feed.loadingMore}>{feed.loadMoreFailed ? 'Try again' : 'Load more posts'}</PillButton>
              </div>
            )}
          </>
        )}
      </Page>
      {after.length > 0 && <FashionSectionRenderer sections={after} />}
    </>
  );
}
