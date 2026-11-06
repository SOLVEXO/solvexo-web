import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const POPULAR = [
  { to: '/products', label: 'Products' },
  { to: '/pricing', label: 'Pricing' },
  { to: '/solutions', label: 'Solutions' },
  { to: '/faq', label: 'FAQ' },
  { to: '/contact-us', label: 'Contact us' },
];

/** Unknown address on Solvexo's public site: a real "not found" page (SeoHead marks it noindex) instead of the home page. */
export function NotFoundPage() {
  return (
    <section className="bg-[#faf9f5] min-h-[70vh] flex items-center px-6 py-20">
      <div className="max-w-[560px] mx-auto text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a66c53]">404 · Page not found</p>
        <h1 className="mt-4 text-[34px] sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#1c1d1b]">This page doesn’t exist.</h1>
        <p className="mt-4 text-[15px] leading-[1.8] text-[#777974]">The link may be old or mistyped. Here are some places to start instead.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          {POPULAR.map(p => (
            <Link key={p.to} to={p.to} className="px-4 py-2 rounded-full border border-[#e5e5dd] bg-white text-[13px] font-medium text-[#1c1d1b] hover:border-brand-orange hover:text-brand-orange transition-colors">
              {p.label}
            </Link>
          ))}
        </div>
        <Link to="/" className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-[7px] bg-brand-orange text-white text-[13px] font-semibold hover:-translate-y-0.5 transition-transform">
          Go to the home page <ArrowRight size={15} aria-hidden />
        </Link>
      </div>
    </section>
  );
}
