import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Footer } from '@/components/comman/ui/Footer';
import { Reveal } from '@/components/comman/motion/Reveal';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { stockPhotoAlt, unsplashUrl } from '@/assets/stockPhotos';
import { BLOG_AUTHOR, SORTED_BLOG_POSTS } from '@/features/buyer/data/blogPosts';
import { formatBlogDate } from './blogFormat';

/** www.solvexo.store/blog — Solvexo's own articles for sellers. Title and description come from src/seo/publicPages. */
export function BlogIndexPage() {
  const [lead, ...rest] = SORTED_BLOG_POSTS;
  return (
    <div className="bg-[#faf9f5] min-h-full">
      <section className="px-4 md:px-8 lg:px-12 pt-14 md:pt-20 pb-10 max-w-[1100px] mx-auto">
        <SectionHeading
          as="h1"
          kicker="Solvexo blog"
          title="Guides for selling online and in person"
          subtitle="Practical advice for Pakistani sellers, creators and shop owners: starting a store, delivery, cash on delivery, POS and growing your sales."
          size="lg"
        />
      </section>

      {lead && (
        <section className="px-4 md:px-8 lg:px-12 pb-10 max-w-[1100px] mx-auto">
          <Reveal>
            <Link to={`/blog/${lead.slug}`} className="group grid md:grid-cols-2 gap-6 md:gap-10 items-center bg-white border border-[#e5e5dd] rounded-2xl overflow-hidden hover:border-brand-orange/40 transition-colors">
              <div className="aspect-[16/10] md:aspect-auto md:h-full overflow-hidden">
                <img src={unsplashUrl(lead.image, 900)} alt={stockPhotoAlt(lead.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-6 md:p-8 md:pl-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#a66c53]">{lead.category}</p>
                <h2 className="mt-3 text-[24px] sm:text-[28px] font-semibold leading-[1.2] tracking-[-0.02em] text-[#1c1d1b]">{lead.title}</h2>
                <p className="mt-3 text-[14.5px] leading-[1.75] text-[#777974]">{lead.description}</p>
                <p className="mt-4 text-[12px] text-[#8b8985]">{formatBlogDate(lead.published)} · {lead.readMinutes} min read</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-semibold text-brand-orange">Read the guide <ArrowRight size={14} aria-hidden /></span>
              </div>
            </Link>
          </Reveal>
        </section>
      )}

      <section className="px-4 md:px-8 lg:px-12 pb-20 max-w-[1100px] mx-auto grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {rest.map(post => (
          <Reveal key={post.slug}>
            <Link to={`/blog/${post.slug}`} className="group flex flex-col h-full bg-white border border-[#e5e5dd] rounded-2xl overflow-hidden hover:border-brand-orange/40 transition-colors">
              <div className="aspect-[16/10] overflow-hidden">
                <img src={unsplashUrl(post.image, 600)} alt={stockPhotoAlt(post.image)} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-5 flex flex-col flex-1">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#a66c53]">{post.category}</p>
                <h2 className="mt-2 text-[17px] font-semibold leading-[1.3] text-[#1c1d1b]">{post.title}</h2>
                <p className="mt-2 text-[13px] leading-[1.7] text-[#777974] flex-1">{post.description}</p>
                <p className="mt-4 text-[11.5px] text-[#8b8985]">{formatBlogDate(post.published)} · {post.readMinutes} min read · {BLOG_AUTHOR}</p>
              </div>
            </Link>
          </Reveal>
        ))}
      </section>
      <Footer />
    </div>
  );
}
