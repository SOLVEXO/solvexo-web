import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Newspaper, ImageOff } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { apiListPublicBlogPosts, type BlogPostSummary } from '@/api/services/storeBlog';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaSectionRenderer } from '../sections';
import { novaTheme as t } from '../theme.config';

function PostImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="w-full flex items-center justify-center" style={{ aspectRatio: '4/3', background: t.colors.bgAlt, borderRadius: t.radius.md }}>
        <ImageOff size={22} style={{ color: t.colors.inkMuted }} />
      </div>
    );
  }
  return <img src={src} alt={alt} loading="lazy" className="w-full object-cover" style={{ aspectRatio: '4/3', borderRadius: t.radius.md }} />;
}

/** Theme 02's own Stories (blog) index — same real posts/pagination cap as
 *  `AtelierBlogIndexPage` (this platform's own 20-per-page precedent). */
export function NovaBlogIndexPage() {
  const { store } = useStorefront();
  useStorefrontSeo({ title: 'Stories' });
  const [posts, setPosts] = useState<BlogPostSummary[] | null>(null);
  const [sections, setSections] = useState<Section[]>([]);

  useEffect(() => {
    apiListPublicBlogPosts(store.storeId, undefined, 1, 20)
      .then(res => setPosts(res.data.posts))
      .catch(() => setPosts([]));
  }, [store.storeId]);

  useEffect(() => {
    apiGetPublicCollectionTemplate(store.storeId, 'page', 'blog-index')
      .then(res => setSections(res.data.sections ?? []))
      .catch(() => setSections([]));
  }, [store.storeId]);

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 3vw, 36px)', fontWeight: 700, color: t.colors.ink, marginBottom: '36px' }}>Stories</h1>

      {sections.length > 0 && <div style={{ marginBottom: '40px' }}><NovaSectionRenderer sections={sections} /></div>}

      {posts === null && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col gap-3">
              <div className="animate-pulse" style={{ aspectRatio: '4/3', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
              <div className="animate-pulse h-3 w-2/3" style={{ background: t.colors.bgAlt }} />
            </div>
          ))}
        </div>
      )}

      {posts !== null && posts.length === 0 && (
        <div className="flex flex-col items-center text-center" style={{ padding: '80px 0', background: t.colors.bgAlt, borderRadius: t.radius.md }}>
          <Newspaper size={30} style={{ color: t.colors.inkMuted }} className="mb-3" />
          <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted }}>No posts yet — check back soon.</p>
        </div>
      )}

      {posts !== null && posts.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {posts.map(post => (
            <Link key={post.slug} to={`/blog/${post.slug}`} className="block no-underline">
              <PostImage src={post.coverImage} alt={post.title} />
              <div style={{ paddingTop: '14px' }}>
                {post.publishedAt && (
                  <p style={{ fontFamily: t.fonts.body, fontSize: '11px', color: t.colors.inkMuted, marginBottom: '4px', fontWeight: 600 }}>
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </p>
                )}
                <p style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 700, color: t.colors.ink }}>{post.title}</p>
                {post.excerpt && (
                  <p className="line-clamp-2" style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px', lineHeight: 1.6 }}>
                    {post.excerpt}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
