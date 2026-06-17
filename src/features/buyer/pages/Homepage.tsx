import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowRight, ShoppingBag, BookOpen, Download, Store, Monitor, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Exact data from reference site ───────────────────────────────────────────
const FEATURES: { Icon: LucideIcon; title: string; bg: string; desc: string; path: string }[] = [
  { Icon: ShoppingBag, title: 'Marketplace',            bg: '#FBECE4', desc: 'Join thousands of buyers discovering your products in the Solvexo marketplace.',          path: '/marketplace' },
  { Icon: BookOpen,    title: 'Educational Resources',   bg: '#EBF7EF', desc: 'Sell lesson plans, courses, worksheets and digital curricula to educators worldwide.',      path: '/education'   },
  { Icon: Download,    title: 'Digital Downloads',        bg: '#E6F1FB', desc: 'Sell ebooks, music, software, templates and files with instant delivery.',                  path: '/marketplace' },
  { Icon: Store,       title: 'Your Own Store',           bg: '#FEF7E5', desc: 'Launch a branded store with a custom domain, no coding required.',                          path: '/sellers'     },
  { Icon: Monitor,     title: 'Point of Sale',           bg: '#FBECE4', desc: 'Accept payments in-person with the Solvexo POS app, fully synced to your dashboard.',       path: '/sellers'     },
  { Icon: Sparkles,    title: 'AI Commerce Tools',        bg: '#F5F0FB', desc: 'Write listings, optimize pricing, auto-generate descriptions with built-in AI.',             path: '/sellers'     },
];

const TESTIMONIALS = [
  { name: 'Maria Santos',   role: 'Educator & Seller',      text: 'I went from zero to $8,000/month selling lesson plans. The AI tools are incredible.' },
  { name: 'James Kowalski', role: 'Physical Goods Seller',  text: 'The POS + online store combo is exactly what my boutique needed. Setup took an afternoon.' },
  { name: 'Priya Nair',     role: 'Digital Creator',        text: 'Solvexo handles everything — my store, downloads, taxes. I just focus on creating.' },
];

const STATS = [
  { value: '50K+',  label: 'Active Sellers'  },
  { value: '$180M+',label: 'GMV Processed'   },
  { value: '4.9★',  label: 'Seller Rating'   },
];

export function Homepage() {
  const navigate = useNavigate();
  usePageTitle('Home');

  return (
    <div className="bg-white min-h-full">

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden px-12 py-20"
        style={{ background: 'linear-gradient(135deg, #141413 0%, #2C2A28 100%)' }}
      >
        {/* Decorative circles */}
        <div className="absolute rounded-full w-[400px] h-[400px] bg-brand-orange opacity-[0.08] -top-[80px] -right-[80px]" />
        <div className="absolute rounded-full w-[300px] h-[300px] bg-[#B95A3A] opacity-[0.06] -bottom-[60px] left-[40%]" />

        <div className="max-w-[680px] relative z-[1]">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-[20px] px-[14px] py-[5px] mb-6 border border-[rgba(217,119,87,0.3)] bg-[rgba(217,119,87,0.15)]">
            <Sparkles size={12} className="text-brand-orange" />
            <span className="text-[12px] font-medium text-brand-orange">AI-powered commerce. One platform.</span>
          </div>

          {/* Heading */}
          <h1 className="block text-[52px] font-semibold text-white leading-[1.15] mb-5" style={{ fontFamily: "'Lora', Georgia, serif" }}>
            The Commerce OS for Sellers, Creators &amp; Educators
          </h1>

          {/* Subtext */}
          <p className="block text-[16px] text-[#B0AEA8] leading-[1.7] mb-9 max-w-[560px]">
            Sell physical products, digital downloads, and educational resources — with AI-powered tools, a built-in marketplace, and point-of-sale. Everything commerce, in one place.
          </p>

          {/* CTAs */}
          <div className="flex gap-3 flex-wrap mb-0">
            <Button size="lg" onClick={() => navigate('/onboarding')}>
              Start for Free <ArrowRight size={14} className="inline align-middle ml-1" />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate('/marketplace')}
              className="text-white border-[rgba(255,255,255,0.2)] bg-transparent hover:bg-[rgba(255,255,255,0.1)]"
            >
              Browse Marketplace
            </Button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-10">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="block text-[20px] font-bold text-brand-orange">{value}</p>
                <p className="text-[12px] text-[#8C8A82]">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature Categories ────────────────────────────────────────────── */}
      <div className="px-12 py-16">
        <p className="block text-[13px] font-semibold text-brand-orange text-center uppercase tracking-[0.1em] mb-3">
          Built for every type of seller
        </p>
        <h2 className="block text-[32px] font-bold text-carbon text-center mb-12" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          One platform. Infinite possibilities.
        </h2>
        <div className="grid grid-cols-3 gap-5">
          {FEATURES.map(f => (
            <Card key={f.title} hover padding="none" onClick={() => navigate(f.path)}>
              <div className="p-6">
                <div
                  className="w-11 h-11 rounded-[10px] flex items-center justify-center mb-[14px]"
                  style={{ background: f.bg }}
                >
                  <f.Icon size={20} className="text-brand-orange" />
                </div>
                <p className="block text-[16px] font-bold text-[#141413] mb-2">{f.title}</p>
                <p className="block text-[13px] text-[#8C8A82] leading-[1.6] mb-[14px]">{f.desc}</p>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-brand-orange cursor-pointer">Learn more <ArrowRight size={12} /></span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Social Proof ──────────────────────────────────────────────────── */}
      <div className="bg-[#FAF9F5] px-12 py-12 border-t border-bone">
        <p className="block text-[13px] font-semibold text-[#8C8A82] text-center uppercase tracking-[0.08em] mb-7">
          Trusted by creators worldwide
        </p>
        <div className="grid grid-cols-3 gap-5">
          {TESTIMONIALS.map(t => (
            <Card key={t.name} padding="none">
              <div className="p-6">
                <p className="block text-[13px] text-charcoal leading-[1.7] mb-4 italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-[10px]">
                  <Avatar name={t.name} size={32} />
                  <div>
                    <p className="block text-[13px] font-semibold text-[#141413]">{t.name}</p>
                    <p className="text-[11px] text-[#8C8A82]">{t.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div className="bg-brand-orange px-12 py-[60px] text-center">
        <h2 className="block text-[32px] font-bold text-white mb-[14px]" style={{ fontFamily: "'Lora', Georgia, serif" }}>
          Ready to start selling?
        </h2>
        <p className="block text-[15px] text-[rgba(255,255,255,0.85)] mb-7">
          Join 50,000+ sellers on Solvexo. Free to start, no credit card required.
        </p>
        <Button variant="dark" size="lg" onClick={() => navigate('/onboarding')}>
          Create Your Account <ArrowRight size={14} className="inline align-middle ml-1" />
        </Button>
      </div>

    </div>
  );
}
