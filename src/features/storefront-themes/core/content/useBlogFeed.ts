import { useState } from 'react';
import { apiListPublicBlogPosts, type BlogPostSummary } from '@/api/services/storeBlog';
import { useLoad } from '../pageHooks';
import { BLOG_PAGE_SIZE } from './blogUtils';

interface More { scope: string; posts: BlogPostSummary[]; page: number; totalPages: number; busy: boolean; failed: boolean }

/** First page of a blog (with loading / error / retry) plus "load more" paging that never mixes two blogs. */
export function useBlogFeed(storeId: string, blogSlug: string | undefined) {
  const first = useLoad(() => apiListPublicBlogPosts(storeId, blogSlug, 1, BLOG_PAGE_SIZE).then(r => ({ ...r.data, posts: r.data?.posts ?? [] })), [storeId, blogSlug]);
  const scope = `${storeId}|${blogSlug ?? ''}`;
  const [more, setMore] = useState<More | null>(null);
  const extra = more && more.scope === scope ? more : null;

  const firstData = first.data;
  const posts = firstData ? [...firstData.posts, ...(extra?.posts ?? [])] : [];
  const page = extra?.page ?? 1;
  const totalPages = extra?.totalPages ?? firstData?.pagination?.totalPages ?? 1;

  const loadMore = async () => {
    if (!firstData || (extra?.busy ?? false) || page >= totalPages) return;
    const base: More = extra ?? { scope, posts: [], page: 1, totalPages, busy: false, failed: false };
    setMore({ ...base, busy: true, failed: false });
    try {
      const res = await apiListPublicBlogPosts(storeId, blogSlug, page + 1, BLOG_PAGE_SIZE);
      setMore({ scope, posts: [...base.posts, ...(res.data?.posts ?? [])], page: page + 1, totalPages: res.data?.pagination?.totalPages ?? totalPages, busy: false, failed: false });
    } catch {
      setMore({ ...base, busy: false, failed: true });
    }
  };

  return {
    title: firstData?.blog?.title ?? null,
    posts, loading: first.loading, error: first.error, retry: first.retry,
    hasMore: !!firstData && page < totalPages, loadingMore: extra?.busy ?? false, loadMoreFailed: extra?.failed ?? false, loadMore,
  };
}
