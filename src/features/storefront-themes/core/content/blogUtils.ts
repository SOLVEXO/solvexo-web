import type { BlogPostSummary } from '@/api/services/storeBlog';
import type { Block } from '@/api/services/storefrontTypes';
import { ts } from '@/utils/tStatic';

export const BLOG_PAGE_SIZE = 12;

/** `/blog/:post` for the store's default blog, `/blogs/:blog/:post` for a named one. */
export function blogPostPath(blogSlug: string | undefined, postSlug: string): string {
  return blogSlug ? `/blogs/${blogSlug}/${postSlug}` : `/blog/${postSlug}`;
}

export function blogIndexPath(blogSlug: string | undefined): string {
  return blogSlug ? `/blogs/${blogSlug}` : '/blog';
}

export function formatPostDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

function blockText(b: Block): string {
  const s = (b.settings ?? {}) as Record<string, unknown>;
  const parts: string[] = [];
  if (typeof s.text === 'string') parts.push(s.text);
  if (Array.isArray(s.items)) parts.push(...s.items.filter((x): x is string => typeof x === 'string'));
  return parts.join(' ');
}

/** Whole minutes to read an article, at ~200 words a minute (at least 1). */
export function readingMinutes(blocks: Block[] | undefined): number {
  const words = (blocks ?? []).reduce((n, b) => n + blockText(b).split(/\s+/).filter(Boolean).length, 0);
  return Math.max(1, Math.round(words / 200));
}

/** Every distinct tag across the posts, most used first. */
export function topicsOf(posts: BlogPostSummary[]): string[] {
  const counts = new Map<string, number>();
  for (const p of posts) for (const tag of p.tags ?? []) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}

/** Other posts that share the most tags with `current`; falls back to the newest others. */
export function relatedPosts(posts: BlogPostSummary[], currentSlug: string, currentTags: string[], limit = 3): BlogPostSummary[] {
  const tags = new Set(currentTags);
  const others = posts.filter(p => p.slug !== currentSlug);
  const score = (p: BlogPostSummary) => (p.tags ?? []).filter(t => tags.has(t)).length;
  return others
    .map((p, i) => ({ p, i, s: score(p) }))
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, limit)
    .map(x => x.p);
}

export interface ShareTarget { key: string; label: string; href: string }

export function shareTargets(url: string, title: string): ShareTarget[] {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);
  return [
    { key: 'x', label: ts('pg.share_on_x', 'Share on X'), href: `https://twitter.com/intent/tweet?url=${u}&text=${t}` },
    { key: 'facebook', label: ts('pg.share_on_facebook', 'Share on Facebook'), href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: 'whatsapp', label: ts('pg.share_on_whatsapp', 'Share on WhatsApp'), href: `https://wa.me/?text=${t}%20${u}` },
    { key: 'email', label: ts('pg.share_by_email', 'Share by email'), href: `mailto:?subject=${t}&body=${u}` },
  ];
}
