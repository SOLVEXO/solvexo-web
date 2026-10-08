import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ImageOff } from 'lucide-react';
import type { Section } from '@/api/services/storefrontTypes';
import { apiListPublicBlogPosts, type BlogPostSummary } from '@/api/services/storeBlog';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';
import { imageFit } from '../../imageFit';

/** Latest posts from the store's default blog — same card look as the Journal index. */
function BlogPostsSection({ section, colors }: { section: Section; colors: AtelierSectionColors }) {
  const { store } = useStorefront();
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);
  const limit = section.settings.limit ?? 3;
  const fit = imageFit(section.settings.imageRatio, '4 / 3');

  useEffect(() => {
    let cancelled = false;
    apiListPublicBlogPosts(store.storeId, undefined, 1, limit)
      .then(res => { if (!cancelled) setPosts(res.data.posts); })
      .catch(() => { if (!cancelled) setPosts([]); });
    return () => { cancelled = true; };
  }, [store.storeId, limit]);

  if (!posts || posts.length === 0) return null;

  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        <div className="flex items-end justify-between flex-wrap gap-3 mb-8">
          {section.settings.heading && (
            <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink }}>{section.settings.heading}</h2>
          )}
          <Link to="/blog" className="no-underline" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: colors.ink, textDecoration: 'underline' }}>View all</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {posts.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block no-underline">
              {post.coverImage ? (
                <div style={{ ...fit.box, overflow: 'hidden' }}>
                  <img src={post.coverImage} alt={post.title} loading="lazy" style={fit.img} />
                </div>
              ) : (
                <div className="w-full flex items-center justify-center" style={{ aspectRatio: '4 / 3', background: colors.bgAlt }}>
                  <ImageOff size={22} style={{ color: t.colors.inkMuted }} />
                </div>
              )}
              <div style={{ paddingTop: '14px' }}>
                {post.publishedAt && (
                  <p style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.inkMuted, marginBottom: '4px' }}>{new Date(post.publishedAt).toLocaleDateString()}</p>
                )}
                <p style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 600, color: colors.ink }}>{post.title}</p>
                {post.excerpt && (
                  <p className="line-clamp-2" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px', lineHeight: 1.6 }}>{post.excerpt}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

registerAtelierSection('blog_posts', (section: Section, _blocks, colors: AtelierSectionColors) => <BlogPostsSection section={section} colors={colors} />);
