import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Avatar } from '@/components/ui/Avatar';
import { ArrowRight } from 'lucide-react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E',
};
const FONT    = "'Poppins', sans-serif";
const SERIF   = "'Lora', Georgia, serif";

// ── Shared button (matching reference Btn exactly) ────────────────────────────
function Btn({
  children, variant = 'primary', size = 'lg',
  onClick, style = {},
}: {
  children: React.ReactNode; variant?: string; size?: string;
  onClick?: () => void; style?: React.CSSProperties;
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    borderRadius: 8, fontFamily: FONT, fontWeight: 500,
    cursor: 'pointer', border: 'none', transition: 'all 0.18s ease',
  };
  const sizes: Record<string, React.CSSProperties> = {
    sm: { padding: '6px 12px',  fontSize: 12 },
    md: { padding: '10px 18px', fontSize: 13 },
    lg: { padding: '13px 24px', fontSize: 15 },
  };
  const variants: Record<string, React.CSSProperties> = {
    primary:   { background: C.orange, color: C.white },
    secondary: { background: C.paleOrange, color: C.deepOrange },
    ghost:     { background: 'transparent', color: C.slate, border: `1px solid ${C.bone}` },
    dark:      { background: C.charcoal, color: C.white },
  };
  return (
    <button
      onClick={onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ── Data ─────────────────────────────────────────────────────────────────────
const SELLER_TYPES = [
  { emoji: '🎓', title: 'Educators',         desc: 'Sell lesson plans, worksheets, bundles, and courses to teachers and students worldwide.',    cta: 'Sell as Educator'   },
  { emoji: '🎨', title: 'Creators & Designers', desc: 'Digital downloads, templates, fonts, and design assets with instant delivery.',          cta: 'Start Creating'     },
  { emoji: '🏪', title: 'Retailers',          desc: 'Launch your online store and sell physical products to customers everywhere.',              cta: 'Open Your Store'    },
  { emoji: '🏺', title: 'Handmade Sellers',   desc: 'Showcase your handcrafted goods on the Solvexo marketplace and your own store.',           cta: 'List Your Craft'    },
  { emoji: '💼', title: 'Brands & Agencies',  desc: 'White-label storefronts, multi-seat management, and advanced analytics.',                  cta: 'Go Enterprise'      },
  { emoji: '🏫', title: 'Schools & Districts',desc: 'Institutional accounts with volume pricing and centralized resource management.',           cta: 'Contact Us'         },
];

const FEATURES = [
  { emoji: '🛍️', title: 'Marketplace Listings', desc: 'Reach buyers already shopping on Solvexo.'             },
  { emoji: '🏗️', title: 'Custom Storefront',     desc: 'Your brand, your domain, your store.'                 },
  { emoji: '💾', title: 'Digital Delivery',      desc: 'Instant file delivery for digital products.'           },
  { emoji: '✨', title: 'AI Tools',              desc: 'AI-powered listing optimization and pricing.'           },
  { emoji: '📊', title: 'Analytics',             desc: 'Real-time sales data and customer insights.'           },
  { emoji: '🖥️', title: 'Point of Sale',        desc: 'Accept payments in person with our mobile POS.'        },
  { emoji: '💳', title: 'Fast Payouts',          desc: 'Get paid within 2 business days, every time.'          },
  { emoji: '🔒', title: 'Seller Protection',     desc: 'Fraud protection and dispute resolution support.'      },
];

const STATS = [
  { value: '50,000+', label: 'Active Sellers'  },
  { value: '$180M+',  label: 'GMV Processed'   },
  { value: '4.9 ★',  label: 'Average Rating'   },
  { value: '135+',    label: 'Countries'        },
];

const TESTIMONIALS = [
  { name: 'Maria Santos',   role: 'Educator & Seller',      text: 'Solvexo made it so easy to launch my teaching resource shop. Within 3 months I was earning enough to quit my second job.' },
  { name: 'James Kowalski', role: 'Physical Goods Seller',  text: 'The AI tools alone are worth the price. My product descriptions convert so much better now and I spend half the time on admin.' },
  { name: 'Priya Nair',     role: 'Digital Creator',        text: "I've tried every platform out there. Solvexo is the only one that actually understands what digital creators need." },
];

// ── Component ────────────────────────────────────────────────────────────────
export function ForSellersPage() {
  const navigate = useNavigate();
  usePageTitle('For Sellers');

  return (
    <div style={{ background: C.white, minHeight: '100%', fontFamily: FONT }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${C.carbon} 0%, ${C.charcoal} 100%)`,
        padding: '80px 48px 64px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: C.orange, opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: -60, left: '40%', width: 300, height: 300, borderRadius: '50%', background: C.deepOrange, opacity: 0.06 }} />

        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(217,119,87,0.15)', border: '1px solid rgba(217,119,87,0.3)',
            borderRadius: 20, padding: '5px 14px', marginBottom: 24,
          }}>
            <span style={{ fontSize: 12, color: C.orange, fontWeight: 500 }}>Trusted by 50,000+ sellers worldwide</span>
          </div>

          {/* Heading — "o" in Solvexo is orange (brand rule) */}
          <h1 style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 700, color: C.white, lineHeight: 1.15, marginBottom: 20, display: 'block' }}>
            Sell more. Do less.<br />
            With Solvex<span style={{ color: C.orange }}>o</span>.
          </h1>

          <p style={{ fontSize: 17, color: '#B0AEA8', lineHeight: 1.7, marginBottom: 36, maxWidth: 580, margin: '0 auto 36px' }}>
            The all-in-one commerce platform for educators, creators, and independent sellers.
            Get your store live in minutes. Start selling today.
          </p>

          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <Btn onClick={() => navigate('/onboarding')}>Start for Free <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></Btn>
            <Btn
              variant="ghost"
              onClick={() => navigate('/pricing')}
              style={{ color: C.white, borderColor: 'rgba(255,255,255,0.2)' }}
            >
              See Pricing
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Seller Types ──────────────────────────────────────────────────── */}
      <div style={{ padding: '72px 48px', background: C.cream }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: C.orange, textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>
            Built for you
          </p>
          <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 48 }}>
            Whatever you sell, we've got you covered
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {SELLER_TYPES.map(s => (
              <div key={s.title} style={{ background: C.white, borderRadius: 16, padding: 28, border: `1px solid ${C.bone}` }}>
                <span style={{ fontSize: 36, display: 'block', marginBottom: 16 }}>{s.emoji}</span>
                <p style={{ fontSize: 17, fontWeight: 700, color: C.carbon, marginBottom: 8 }}>{s.title}</p>
                <p style={{ fontSize: 13, color: C.slate, lineHeight: 1.7, marginBottom: 20 }}>{s.desc}</p>
                <Btn variant="secondary" size="sm" onClick={() => navigate('/onboarding')}>
                  {s.cta} <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
                </Btn>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Feature Highlights ────────────────────────────────────────────── */}
      <div style={{ padding: '72px 48px', background: C.white }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 10 }}>
            Everything you need to run your business
          </h2>
          <p style={{ fontSize: 15, color: C.slate, textAlign: 'center', marginBottom: 48 }}>
            One subscription. Every tool. Zero technical headaches.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.title} style={{ background: C.cream, borderRadius: 12, padding: '20px 18px' }}>
                <span style={{ fontSize: 28, display: 'block', marginBottom: 12 }}>{f.emoji}</span>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.carbon, marginBottom: 6 }}>{f.title}</p>
                <p style={{ fontSize: 12, color: C.slate, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Social Proof ──────────────────────────────────────────────────── */}
      <div style={{ padding: '72px 48px', background: C.cream, borderTop: `1px solid ${C.bone}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 32, justifyContent: 'center', marginBottom: 48 }}>
            {STATS.map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 32, fontWeight: 700, color: C.orange, display: 'block' }}>{s.value}</p>
                <p style={{ fontSize: 13, color: C.slate }}>{s.label}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TESTIMONIALS.map(t => (
              <div key={t.name} style={{ background: C.white, borderRadius: 16, padding: 28, border: `1px solid ${C.bone}` }}>
                <p style={{ fontSize: 22, color: C.orange, display: 'block', marginBottom: 12 }}>★★★★★</p>
                <p style={{ fontSize: 13, color: C.charcoal, lineHeight: 1.8, marginBottom: 20, fontStyle: 'italic' }}>
                  "{t.text}"
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={t.name} size={36} />
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: C.carbon, display: 'block' }}>{t.name}</p>
                    <p style={{ fontSize: 11, color: C.slate }}>{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div style={{ background: C.carbon, padding: '72px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 36, fontWeight: 700, color: C.white, display: 'block', marginBottom: 14 }}>
          Start selling for free today
        </h2>
        <p style={{ fontSize: 15, color: '#8C8A82', display: 'block', marginBottom: 36 }}>
          No credit card required. Get your store live in minutes. Upgrade when you're ready.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Btn onClick={() => navigate('/onboarding')}>Create Free Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></Btn>
          <Btn
            variant="ghost"
            onClick={() => navigate('/pricing')}
            style={{ color: C.white, borderColor: 'rgba(255,255,255,0.2)' }}
          >
            See All Plans
          </Btn>
        </div>
      </div>
    </div>
  );
}
