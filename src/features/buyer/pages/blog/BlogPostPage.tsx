import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Lightbulb } from 'lucide-react';
import { Footer } from '@/components/comman/ui/Footer';
import { stockPhotoAlt, unsplashUrl } from '@/assets/stockPhotos';
import { BLOG_AUTHOR, SORTED_BLOG_POSTS, getBlogPost, type BlogBlock } from '@/features/buyer/data/blogPosts';
import { getPlatformProduct } from '@/features/buyer/data/platformProducts';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { formatBlogDate } from './blogFormat';

function Block({ block }: { block: BlogBlock }) {
  switch (block.type) {
    case 'h2': return <h2 className="mt-10 mb-3 text-[22px] sm:text-[24px] font-semibold leading-[1.3] tracking-[-0.015em] text-[#1c1d1b]">{block.text}</h2>;
    case 'h3': return <h3 className="mt-7 mb-2 text-[18px] font-semibold text-[#1c1d1b]">{block.text}</h3>;
    case 'ul': return <ul className="my-4 pl-5 list-disc space-y-2 marker:text-brand-orange">{block.items.map(i => <li key={i}>{i}</li>)}</ul>;
    case 'ol': return <ol className="my-4 pl-5 list-decimal space-y-2 marker:text-brand-orange marker:font-semibold">{block.items.map(i => <li key={i}>{i}</li>)}</ol>;
    case 'tip': return (
      <aside className="my-6 flex gap-3 rounded-xl border border-brand-orange/25 bg-[#fdf3ee] px-4 py-3.5 text-[15px]">
        <Lightbulb size={18} className="text-brand-orange shrink-0 mt-0.5" aria-hidden />
        <p><strong className="font-semibold text-[#1c1d1b]">Tip: </strong>{block.text}</p>
      </aside>
    );
    default: return <p className="my-4">{block.text}</p>;
  }
}

/** www.solvexo.store/blog/:slug. Title, description, canonical and structured data come from src/seo (also pre-built). */
export function BlogPostPage() {
  const { slug = '' } = useParams();
  const post = getBlogPost(slug);
  const sellEntry = useSellEntry();
  if (!post) return <Navigate to="/blog" replace />;

  const related = post.related.map(getPlatformProduct).filter(Boolean);
  const more = SORTED_BLOG_POSTS.filter(p => p.slug !== post.slug).slice(0, 2);

  return (
    <div className="bg-[#faf9f5] min-h-full">
      <article className="px-4 md:px-8 pt-10 md:pt-14 pb-16 max-w-[760px] mx-auto">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-[#8b8985]">
          <Link to="/blog" className="inline-flex items-center gap-1 hover:text-brand-orange"><ArrowLeft size={13} aria-hidden /> Blog</Link>
          <span className="mx-2">/</span>{post.category}
        </nav>
        <h1 className="mt-5 text-[30px] sm:text-[40px] font-semibold leading-[1.15] tracking-[-0.03em] text-[#1c1d1b]">{post.title}</h1>
        <p className="mt-4 text-[13px] text-[#8b8985]">{BLOG_AUTHOR} · {formatBlogDate(post.published)} · {post.readMinutes} min read</p>
        <div className="mt-7 aspect-[16/9] rounded-2xl overflow-hidden bg-[#efece4]">
          <img src={unsplashUrl(post.image, 1200)} alt={stockPhotoAlt(post.image)} className="w-full h-full object-cover" />
        </div>

        <div className="mt-8 text-[16px] leading-[1.85] text-[#3d3c39]">
          {post.body.map((block, i) => <Block key={i} block={block} />)}
        </div>

        <div className="mt-12 rounded-2xl bg-[#1c1d1b] text-white p-6 sm:p-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-brand-orange">Start with Solvexo</p>
          <p className="mt-3 text-[22px] font-semibold leading-[1.3]">Your store, your POS and your orders in one place.</p>
          <p className="mt-2 text-[14px] text-[#b0aea8]">Create your store and add your first products today.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={sellEntry.go} disabled={sellEntry.loading} className="inline-flex items-center gap-2 px-5 py-3 rounded-[7px] bg-brand-orange text-white text-[13px] font-semibold cursor-pointer border-0 disabled:opacity-60">
              Start selling <ArrowRight size={14} aria-hidden />
            </button>
            <Link to="/pricing" className="inline-flex items-center px-5 py-3 rounded-[7px] border border-white/25 text-[13px] font-semibold hover:bg-white/5">See pricing</Link>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[18px] font-semibold text-[#1c1d1b]">Solvexo tools mentioned in this guide</h2>
            <ul className="mt-4 grid sm:grid-cols-3 gap-3">
              {related.map(p => p && (
                <li key={p.slug}>
                  <Link to={`/products/${p.slug}`} className="block h-full rounded-xl border border-[#e5e5dd] bg-white p-4 hover:border-brand-orange/40">
                    <p className="text-[14px] font-semibold text-[#1c1d1b]">{p.name}</p>
                    <p className="mt-1 text-[12.5px] leading-[1.6] text-[#777974]">{p.tagline}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {more.length > 0 && (
          <section className="mt-12">
            <h2 className="text-[18px] font-semibold text-[#1c1d1b]">More from the blog</h2>
            <ul className="mt-4 space-y-3">
              {more.map(p => (
                <li key={p.slug}><Link to={`/blog/${p.slug}`} className="text-[15px] font-medium text-brand-orange hover:underline">{p.title}</Link></li>
              ))}
            </ul>
          </section>
        )}
      </article>
      <Footer />
    </div>
  );
}
