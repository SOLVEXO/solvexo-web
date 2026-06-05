import { useNavigate } from 'react-router-dom';
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

  return (
    <div style={{ background: '#FFFFFF', minHeight: '100%' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, #141413 0%, #2C2A28 100%)',
          padding: '80px 48px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: '#D97757', opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 300, height: 300, borderRadius: '50%', background: '#B95A3A', opacity: 0.06 }} />

        <div style={{ maxWidth: 680, position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(217,119,87,0.15)', border: '1px solid rgba(217,119,87,0.3)', borderRadius: 20, padding: '5px 14px', marginBottom: 24 }}>
            <Sparkles size={12} style={{ color: '#D97757' }} />
            <span style={{ fontSize: 12, fontWeight: 500, color: '#D97757' }}>AI-powered commerce. One platform.</span>
          </div>

          {/* Heading */}
          <h1 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 52, fontWeight: 600, color: '#FFFFFF', lineHeight: 1.15, marginBottom: 20, display: 'block' }}>
            The Commerce OS for Sellers, Creators &amp; Educators
          </h1>

          {/* Subtext */}
          <p style={{ fontSize: 16, color: '#B0AEA8', lineHeight: 1.7, marginBottom: 36, maxWidth: 560, display: 'block' }}>
            Sell physical products, digital downloads, and educational resources — with AI-powered tools, a built-in marketplace, and point-of-sale. Everything commerce, in one place.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 0 }}>
            <Button size="lg" onClick={() => navigate('/onboarding')} style={{ fontSize: 15 }}>
              Start for Free <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
            </Button>
            <Button
              size="lg"
              variant="ghost"
              onClick={() => navigate('/marketplace')}
              style={{ fontSize: 15, color: '#FFFFFF', borderColor: 'rgba(255,255,255,0.2)', background: 'transparent' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
              }}
            >
              Browse Marketplace
            </Button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p style={{ fontSize: 20, fontWeight: 700, color: '#D97757', display: 'block' }}>{value}</p>
                <p style={{ fontSize: 12, color: '#8C8A82' }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature Categories ────────────────────────────────────────────── */}
      <div style={{ padding: '64px 48px' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#D97757', display: 'block', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
          Built for every type of seller
        </p>
        <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 32, fontWeight: 700, color: '#141413', display: 'block', textAlign: 'center', marginBottom: 48 }}>
          One platform. Infinite possibilities.
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {FEATURES.map(f => (
            <Card key={f.title} hover padding="none" onClick={() => navigate(f.path)}>
              <div style={{ padding: 24 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <f.Icon size={20} style={{ color: '#D97757' }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 700, color: '#141413', display: 'block', marginBottom: 8 }}>{f.title}</p>
                <p style={{ fontSize: 13, color: '#8C8A82', display: 'block', lineHeight: 1.6, marginBottom: 14 }}>{f.desc}</p>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#D97757', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>Learn more <ArrowRight size={12} /></span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── Social Proof ──────────────────────────────────────────────────── */}
      <div style={{ background: '#FAF9F5', padding: '48px', borderTop: '1px solid #E8E6DC' }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: '#8C8A82', display: 'block', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 28 }}>
          Trusted by creators worldwide
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
          {TESTIMONIALS.map(t => (
            <Card key={t.name} padding="none">
              <div style={{ padding: 24 }}>
                <p style={{ fontSize: 13, color: '#2C2A28', display: 'block', lineHeight: 1.7, marginBottom: 16, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={t.name} size={32} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', display: 'block' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: '#8C8A82' }}>{t.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div style={{ background: '#D97757', padding: '60px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: "'Lora', Georgia, serif", fontSize: 32, fontWeight: 700, color: '#FFFFFF', display: 'block', marginBottom: 14 }}>
          Ready to start selling?
        </h2>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', display: 'block', marginBottom: 28 }}>
          Join 50,000+ sellers on Solvexo. Free to start, no credit card required.
        </p>
        <Button variant="dark" size="lg" onClick={() => navigate('/onboarding')} style={{ fontSize: 15 }}>
          Create Your Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
        </Button>
      </div>

    </div>
  );
}
