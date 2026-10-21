import { Link } from 'react-router-dom';
import { handleOf } from '@/utils/activeStoreText';
import { ImageOff } from 'lucide-react';
import type { BlogPostSummary } from '@/api/services/storeBlog';
import { fashionTheme as t } from '../../theme.config';
import { StatusPill } from '../../ui/primitives';
import { blogPostPath, formatPostDate } from '../../../core/content/blogUtils';

/** Journal card: rounded cover, tags, title, excerpt and date. `featured` makes a wide two-column card. */
export function BlogPostCard({ post, blogSlug, featured }: { post: BlogPostSummary; blogSlug?: string; featured?: boolean }) {
  const href = blogPostPath(blogSlug, handleOf(post));
  const date = formatPostDate(post.publishedAt);
  return (
    <article className={featured ? 'grid items-center gap-5 md:grid-cols-2 md:gap-10' : 'flex flex-col'}>
      <Link to={href} tabIndex={-1} aria-hidden className="block overflow-hidden" style={{ borderRadius: 24, background: t.colors.bgAlt, aspectRatio: featured ? '4 / 3' : '4 / 3' }}>
        {post.coverImage
          ? <img src={post.coverImage} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
          : <span className="grid size-full place-items-center"><ImageOff size={26} style={{ color: t.colors.inkMuted }} /></span>}
      </Link>
      <div className={featured ? '' : 'pt-4'}>
        {(post.tags?.length ?? 0) > 0 && <div className="mb-2.5 flex flex-wrap gap-1.5">{post.tags.slice(0, 3).map(tag => <StatusPill key={tag}>{tag}</StatusPill>)}</div>}
        <h2 className={`m-0 font-medium leading-[1.2] tracking-tight ${featured ? 'text-[clamp(26px,3.2vw,40px)]' : 'text-xl'}`} style={{ fontFamily: t.fonts.display }}>
          <Link to={href} className="no-underline" style={{ color: t.colors.ink }}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className={`m-0 mt-2.5 leading-relaxed ${featured ? 'line-clamp-4 text-base' : 'line-clamp-3 text-[15px]'}`} style={{ color: t.colors.inkMuted }}>{post.excerpt}</p>}
        <p className="m-0 mt-3 text-[13px]" style={{ color: t.colors.inkMuted }}>
          {post.authorName && <span>{post.authorName}</span>}{post.authorName && date && ' · '}{date && <time dateTime={post.publishedAt ?? undefined}>{date}</time>}
        </p>
      </div>
    </article>
  );
}
