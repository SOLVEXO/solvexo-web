import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/comman/ui/Button';
import { Card } from '@/components/comman/ui/Card';
import { Avatar } from '@/components/comman/ui/Avatar';
import { ArrowRight, ShoppingBag, BookOpen, Download, Store, Monitor, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const FEATURES: { Icon: LucideIcon; title: string; bg: string; desc: string; path: string }[] = [
  { Icon: ShoppingBag, title: 'Marketplace', bg: '#FBECE4', desc: 'Join thousands of buyers discovering your products in the Solvexo marketplace.', path: '/marketplace' },
  { Icon: BookOpen, title: 'Educational Resources', bg: '#EBF7EF', desc: 'Sell lesson plans, courses, worksheets and digital curricula to educators worldwide.', path: '/education' },
  { Icon: Download, title: 'Digital Downloads', bg: '#E6F1FB', desc: 'Sell ebooks, music, software, templates and files with instant delivery.', path: '/marketplace' },
  { Icon: Store, title: 'Your Own Store', bg: '#FEF7E5', desc: 'Launch a branded store with a custom domain, no coding required.', path: '/sellers' },
  { Icon: Monitor, title: 'Point of Sale', bg: '#FBECE4', desc: 'Accept payments in-person with the Solvexo POS app, fully synced to your dashboard.', path: '/sellers' },
  { Icon: Sparkles, title: 'AI Commerce Tools', bg: '#F5F0FB', desc: 'Write listings, optimize pricing, auto-generate descriptions with built-in AI.', path: '/sellers' },
];

const TESTIMONIALS = [
  { name: 'Maria Santos', role: 'Educator & Seller', text: 'I went from zero to $8,000/month selling lesson plans. The AI tools are incredible.' },
  { name: 'James Kowalski', role: 'Physical Goods Seller', text: 'The POS + online store combo is exactly what my boutique needed. Setup took an afternoon.' },
  { name: 'Priya Nair', role: 'Digital Creator', text: 'Solvexo handles everything — my store, downloads, taxes. I just focus on creating.' },
];

const STATS = [
  { value: '50K+', label: 'Active Sellers' },
  { value: '$180M+', label: 'GMV Processed' },
  { value: '4.9★', label: 'Seller Rating' },
];

export function Homepage() {
  const navigate = useNavigate();
  usePageTitle('Home');

  return (
    <div className="bg-white min-h-full">

      {/* ── Hero ─────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-carbon to-charcoal px-12 py-16">

        {/* Decorative circles */}
        <div className="absolute w-[380px] h-[380px] rounded-full bg-[#3A3633] -top-16 -right-16 pointer-events-none" />
        <div className="absolute w-[240px] h-[240px] rounded-full bg-[#2E2B28] -bottom-10 right-[30%] pointer-events-none" />

        {/* Left content column */}
        <div className="relative z-[1] max-w-[520px]">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-[14px] py-[5px] mb-5 border border-[rgba(217,119,87,0.35)] bg-[rgba(217,119,87,0.12)]">
            <Sparkles size={12} className="text-brand-orange shrink-0" />
            <span className="text-[12px] font-medium text-brand-orange">
              AI-powered commerce. One platform.
            </span>
          </div>

          {/* Heading — responsive font so it proportions correctly at 1280px */}
          <h1 className="font-serif text-[36px] leading-[1.18] font-semibold text-white mb-4">
            The Commerce OS for Sellers, Creators &amp; Educators
          </h1>

          {/* Subtext */}
          <p className="text-[14px] text-[#B0AEA8] leading-[1.7] mb-7 max-w-[440px]">
            Sell physical products, digital downloads, and educational resources — with
            AI-powered tools, a built-in marketplace, and point-of-sale. Everything
            commerce, in one place.
          </p>

          {/* CTAs */}
          <div className="flex items-center gap-3 mb-8">
            <Button size="md" onClick={() => navigate('/onboarding')}>
              Start for Free <ArrowRight size={13} className="inline align-middle ml-1" />
            </Button>
            <button
              onClick={() => navigate('/marketplace')}
              className="inline-flex items-center gap-2 px-5 py-[10px] rounded-lg text-[13px] font-medium text-white border border-[rgba(255,255,255,0.25)] bg-transparent hover:bg-[rgba(255,255,255,0.08)] transition-colors cursor-pointer"
            >
              Browse Marketplace
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-7">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="text-[18px] font-bold text-brand-orange">{value}</p>
                <p className="text-[11px] text-slate mt-[2px]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature Categories ────────────────────────────────────────────────── */}
      <div className="px-12 py-14">
        <p className="text-[11px] font-semibold text-brand-orange text-center uppercase tracking-[0.1em] mb-2">
          Built for every type of seller
        </p>
        <h2 className="font-serif text-[28px] font-bold text-carbon text-center mb-10">
          One platform. Infinite possibilities.
        </h2>
        <div className="grid grid-cols-3 gap-4">
          {FEATURES.map(f => (
            <Card key={f.title} hover padding="none" onClick={() => navigate(f.path)}>
              <div className="p-5">
                <div
                  className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3"
                  style={{ background: f.bg }}
                >
                  <f.Icon size={18} className="text-brand-orange" />
                </div>
                <p className="text-[15px] font-bold text-carbon mb-1">{f.title}</p>
                <p className="text-[12px] text-slate leading-[1.6] mb-3">{f.desc}</p>
                <Button variant="secondary" size="sm" onClick={() => navigate('/education')}>
                  Learn More <ArrowRight size={14} className="inline align-middle ml-1" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Social Proof ──────────────────────────────────────────────────────── */}
      <div className="bg-cream border-t border-bone px-12 py-10">
        <p className="text-[11px] font-semibold text-slate text-center uppercase tracking-[0.08em] mb-6">
          Trusted by creators worldwide
        </p>
        <div className="grid grid-cols-3 gap-4">
          {TESTIMONIALS.map(t => (
            <Card key={t.name} padding="none">
              <div className="p-5">
                <p className="text-[13px] text-charcoal leading-[1.7] mb-3 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-[10px]">
                  <Avatar name={t.name} size={30} />
                  <div>
                    <p className="text-[13px] font-semibold text-carbon">{t.name}</p>
                    <p className="text-[11px] text-slate">{t.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────────── */}
      <div className="bg-brand-orange px-12 py-[52px] text-center">
        <h2 className="font-serif text-[28px] font-bold text-white mb-3">
          Ready to start selling?
        </h2>
        <p className="text-[14px] text-[rgba(255,255,255,0.85)] mb-6">
          Join 50,000+ sellers on Solvexo. Free to start, no credit card required.
        </p>
        <Button variant="dark" size="md" onClick={() => navigate('/onboarding')}>
          Create Your Account <ArrowRight size={13} className="inline align-middle ml-1" />
        </Button>
      </div>

    </div>
  );
}
