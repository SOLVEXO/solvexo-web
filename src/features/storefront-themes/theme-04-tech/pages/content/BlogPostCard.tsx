import { Link } from 'react-router-dom';
import { handleOf } from '@/utils/activeStoreText';
import { ArrowRight, ImageOff } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import type { BlogPostSummary } from '@/api/services/storeBlog';
import { techTheme as t } from '../../theme.config';
import { StatusPill } from '../../ui/techForm';
import { blogPostPath, formatPostDate } from '../../../core/content/blogUtils';

/** Journal card: rounded cover, tags, title, excerpt and date. `featured` makes a wide two-column card. */
export function BlogPostCard({ post, blogSlug, featured }: { post: BlogPostSummary; blogSlug?: string; featured?: boolean }) {
  const href = blogPostPath(blogSlug, handleOf(post));
  const date = formatPostDate(post.publishedAt);
  return (
    <article className={featured ? 'grid items-stretch gap-0 overflow-hidden md:grid-cols-2' : 'flex flex-col overflow-hidden'} style={{ border: `1px solid ${t.colors.border}`, borderRadius: t.cardRadiusPx, background: t.colors.bg }}>
      <Link to={href} tabIndex={-1} aria-hidden className="block overflow-hidden" style={{ background: t.colors.bgAlt, aspectRatio: '16 / 10' }}>
        {post.coverImage
          ? <img src={post.coverImage} alt="" loading="lazy" decoding="async" className="size-full object-cover transition-transform duration-500 hover:scale-[1.03]" />
          : <span className="grid size-full place-items-center"><ImageOff size={26} style={{ color: t.colors.inkMuted }} /></span>}
      </Link>
      <div className={featured ? 'flex flex-col justify-center p-6 md:p-8' : 'flex flex-1 flex-col p-5'}>
        {(post.tags?.length ?? 0) > 0 && <div className="mb-2.5 flex flex-wrap gap-1.5">{post.tags.slice(0, 3).map(tag => <StatusPill key={tag}>{tag}</StatusPill>)}</div>}
        <h2 className={`m-0 font-semibold leading-[1.25] ${featured ? 'text-[clamp(22px,2.6vw,32px)]' : 'text-lg'}`} style={{ fontFamily: t.fonts.display }}>
          <Link to={href} className="no-underline" style={{ color: t.colors.ink }}>{post.title}</Link>
        </h2>
        {post.excerpt && <p className={`m-0 mt-2.5 leading-relaxed ${featured ? 'line-clamp-4 text-base' : 'line-clamp-3 text-[15px]'}`} style={{ color: t.colors.inkMuted }}>{post.excerpt}</p>}
        <p className="m-0 mt-3 text-[13px]" style={{ color: t.colors.inkMuted }}>
          {post.authorName && <span>{post.authorName}</span>}{post.authorName && date && ' · '}{date && <time dateTime={post.publishedAt ?? undefined}>{date}</time>}
        </p>
        <Link to={href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold no-underline" style={{ color: t.colors.accent }}>{ts('pg.read_more', 'Read more')}<ArrowRight size={14} aria-hidden className="fx-flip-rtl" /></Link>
      </div>
    </article>
  );
}
