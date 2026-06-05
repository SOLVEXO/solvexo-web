import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ArrowRight } from 'lucide-react';

// ── Design tokens (exact reference C object) ──────────────────────────────────
const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', successBg: '#EBF7EF',
};
const FONT  = "'Poppins', sans-serif";
const SERIF = "'Lora', Georgia, serif";

// ── Exact plan data from reference source ─────────────────────────────────────
const PLANS = [
  {
    name: 'Starter',
    monthly: 0, annual: 0,
    badge: null,
    desc: 'Perfect for trying Solvexo and selling your first products.',
    cta: 'Start Free',
    features: [
      'Up to 10 products',
      'Marketplace listing',
      'Basic store page',
      'Digital product delivery',
      'Standard checkout',
      'Email support',
      '100 AI credits / month',
      '3% transaction fee',
    ],
    missing: ['Custom domain', 'POS', 'Advanced analytics', 'Store Builder themes', 'Priority support'],
  },
  {
    name: 'Professional',
    monthly: 49, annual: 39,
    badge: 'Most Popular',
    desc: 'For growing sellers who need the full commerce toolkit.',
    cta: 'Start Free Trial',
    features: [
      'Unlimited products',
      'Custom domain (.com)',
      'Full Store Builder',
      'POS register',
      'Advanced analytics',
      'AI Studio — 1,000 credits / mo',
      '5 staff accounts',
      'Email campaigns',
      'Abandoned cart recovery',
      'Priority support',
      '1% transaction fee',
      'Marketplace featured badge',
    ],
    missing: [],
  },
  {
    name: 'Business',
    monthly: 99, annual: 79,
    badge: null,
    desc: 'For high-volume sellers, agencies, and multi-location businesses.',
    cta: 'Start Free Trial',
    features: [
      'Everything in Professional',
      'Multi-location POS',
      'Unlimited staff accounts',
      'AI Studio — 5,000 credits / mo',
      'Loyalty & Rewards program',
      'Subscription products',
      'Advanced shipping rules',
      'API access & webhooks',
      'Dedicated account manager',
      '0.5% transaction fee',
      'White-label store option',
      'SLA — 99.9% uptime',
    ],
    missing: [],
  },
  {
    name: 'Enterprise',
    monthly: null, annual: null,
    badge: 'Custom',
    desc: 'For schools, brands, and platforms with custom requirements.',
    cta: 'Contact Sales',
    features: [
      'Everything in Business',
      'Custom AI credits',
      'School purchase accounts',
      'Multi-brand management',
      'Custom integrations',
      'Dedicated infrastructure',
      'SSO & SAML login',
      'Contract billing',
      '0% transaction fee',
      '24/7 dedicated support',
    ],
    missing: [],
  },
];

// ── Add-ons exact from reference ──────────────────────────────────────────────
const ADDONS = [
  { icon: '✨', name: 'Extra AI Credits',              price: '$10',   unit: 'per 500 credits'       },
  { icon: '👤', name: 'Additional Staff Seats',         price: '$5',    unit: 'per seat / month'      },
  { icon: '🔒', name: 'Custom Domain SSL',              price: 'Free',  unit: 'included on Pro+'      },
  { icon: '⭐', name: 'Priority Marketplace Placement', price: '$29',   unit: 'per month'             },
  { icon: '🧾', name: 'Advanced Tax Compliance',        price: '$15',   unit: 'per month'             },
  { icon: '💬', name: 'SMS Notifications',              price: '$0.05', unit: 'per message'           },
];

// ── FAQ exact from reference ───────────────────────────────────────────────────
const FAQS = [
  {
    q: 'Can I switch plans anytime?',
    a: "Yes. You can upgrade or downgrade your plan at any time. Changes take effect immediately and we'll prorate any billing differences.",
  },
  {
    q: 'What counts as a transaction fee?',
    a: 'Transaction fees apply to each sale made through your Solvexo store or marketplace listing. Digital product sales, physical sales, and POS sales all count.',
  },
  {
    q: 'Do you offer discounts for educators or non-profits?',
    a: 'Yes — educators and registered non-profits qualify for a 40% discount on any paid plan. Contact our support team with your credentials.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major credit cards (Visa, Mastercard, Amex), PayPal, Apple Pay, and bank transfer for annual plans.',
  },
  {
    q: 'Is there a free trial on paid plans?',
    a: 'Yes — both Professional and Business plans include a 14-day free trial with full access. No credit card required to start.',
  },
];

// ── Component ─────────────────────────────────────────────────────────────────
export function PricingPage() {
  const navigate  = useNavigate();
  usePageTitle('Pricing');
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  const getPrice = (plan: typeof PLANS[0]) => {
    if (plan.monthly === null) return 'Custom';
    if (plan.monthly === 0)    return 'Free';
    return `$${billing === 'annual' ? plan.annual : plan.monthly}`;
  };

  return (
    <div style={{ background: C.cream, minHeight: '100%', fontFamily: FONT }}>

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div style={{ textAlign: 'center', padding: '64px 48px 48px', maxWidth: 720, margin: '0 auto' }}>
        {/* Top pill badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: C.paleOrange, border: `1px solid rgba(217,119,87,0.3)`,
          borderRadius: 20, padding: '5px 14px', marginBottom: 20,
        }}>
          <span style={{ fontSize: 12, color: C.deepOrange, fontWeight: 500 }}>
            No credit card required • Cancel anytime
          </span>
        </div>

        <h1 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 700, color: C.carbon, lineHeight: 1.2, display: 'block', marginBottom: 14 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 16, color: C.slate, lineHeight: 1.6, display: 'block', marginBottom: 32 }}>
          Start free. Scale as you grow. Every plan includes marketplace access, digital delivery, and AI-powered tools.
        </p>

        {/* Billing toggle — pill selector style (exact reference) */}
        <div style={{
          display: 'inline-flex', background: C.bone,
          borderRadius: 10, padding: 4, marginBottom: 48,
        }}>
          {(['monthly', 'annual'] as const).map(b => (
            <div
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: '8px 24px', borderRadius: 8, cursor: 'pointer',
                background: billing === b ? C.white : 'transparent',
                boxShadow: billing === b ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <span style={{
                fontSize: 13, fontFamily: FONT, textTransform: 'capitalize',
                fontWeight: billing === b ? 600 : 400,
                color: billing === b ? C.carbon : C.slate,
              }}>
                {b}
              </span>
              {b === 'annual' && (
                <span style={{ fontSize: 10, fontWeight: 600, color: C.success }}>Save 20%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan Cards ────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, padding: '0 48px 64px', maxWidth: 1200, margin: '0 auto' }}>
        {PLANS.map(plan => {
          const isPro = plan.name === 'Professional';
          return (
            <div
              key={plan.name}
              style={{
                background: isPro ? C.carbon : C.white,
                borderRadius: 20, padding: 28,
                border: `2px solid ${isPro ? C.orange : C.bone}`,
                position: 'relative',
                boxShadow: isPro
                  ? '0 8px 40px rgba(217,119,87,0.25)'
                  : '0 2px 12px rgba(0,0,0,0.06)',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div style={{
                  position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                  background: C.orange, color: C.white, borderRadius: 20,
                  padding: '4px 14px', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap',
                  fontFamily: FONT,
                }}>
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <p style={{ fontSize: 15, fontWeight: 700, color: isPro ? C.white : C.carbon, fontFamily: FONT, marginBottom: 8 }}>
                {plan.name}
              </p>
              <p style={{ fontSize: 11, color: isPro ? '#B0AEA8' : C.slate, fontFamily: FONT, marginBottom: 20, lineHeight: 1.5 }}>
                {plan.desc}
              </p>

              {/* Price */}
              <div style={{ marginBottom: 24 }}>
                {plan.monthly === null ? (
                  <p style={{ fontSize: 28, fontWeight: 700, color: isPro ? C.white : C.carbon, fontFamily: FONT }}>Custom</p>
                ) : plan.monthly === 0 ? (
                  <p style={{ fontSize: 36, fontWeight: 700, color: isPro ? C.white : C.carbon, fontFamily: FONT }}>Free</p>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                    <span style={{ fontSize: 36, fontWeight: 700, color: isPro ? C.orange : C.carbon, fontFamily: FONT }}>
                      {getPrice(plan)}
                    </span>
                    <span style={{ fontSize: 13, color: isPro ? '#B0AEA8' : C.slate, fontFamily: FONT }}>
                      /month
                    </span>
                  </div>
                )}
                {billing === 'annual' && plan.monthly !== null && plan.monthly > 0 && (
                  <p style={{ fontSize: 11, color: isPro ? C.orange : C.success, marginTop: 4, fontFamily: FONT }}>
                    Billed ${(billing === 'annual' ? plan.annual! : plan.monthly) * 12}/year
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate('/onboarding')}
                style={{
                  width: '100%', padding: '10px', borderRadius: 8, fontSize: 13,
                  fontWeight: 600, fontFamily: FONT, cursor: 'pointer',
                  marginBottom: 24, border: `1px solid ${isPro ? C.orange : C.bone}`,
                  background: isPro ? C.orange : 'transparent',
                  color: isPro ? C.white : C.charcoal,
                  transition: 'all 0.18s',
                  justifyContent: 'center', display: 'flex',
                }}
              >
                {plan.cta}
              </button>

              {/* Divider */}
              <div style={{ height: 1, background: isPro ? 'rgba(255,255,255,0.1)' : C.bone, marginBottom: 20 }} />

              {/* Features */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 13, color: C.success, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ fontSize: 12, color: isPro ? '#D0CEC8' : C.charcoal, lineHeight: 1.5, fontFamily: FONT }}>
                      {f}
                    </span>
                  </div>
                ))}
                {plan.missing.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', opacity: 0.4 }}>
                    <span style={{ fontSize: 13, color: C.slate, flexShrink: 0, marginTop: 1 }}>✗</span>
                    <span style={{ fontSize: 12, color: C.slate, lineHeight: 1.5, fontFamily: FONT }}>
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Add-ons ───────────────────────────────────────────────────────── */}
      <div style={{ padding: '0 48px 64px', maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>
          Add-ons &amp; extras
        </h2>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT, marginBottom: 28 }}>
          Extend your plan with exactly what you need.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {ADDONS.map(a => (
            <div
              key={a.name}
              style={{
                background: C.white, borderRadius: 12, padding: '18px 20px',
                border: `1px solid ${C.bone}`, display: 'flex', gap: 14, alignItems: 'center',
              }}
            >
              <span style={{ fontSize: 28, flexShrink: 0 }}>{a.icon}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 2 }}>{a.name}</p>
                <p style={{ fontSize: 11, color: C.slate, fontFamily: FONT }}>{a.unit}</p>
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: C.orange, fontFamily: FONT, flexShrink: 0 }}>
                {a.price}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div style={{ background: C.white, padding: '64px 48px', borderTop: `1px solid ${C.bone}` }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 700, color: C.carbon, textAlign: 'center', marginBottom: 40 }}>
            Frequently asked questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                style={{ padding: '20px 0', borderBottom: i < FAQS.length - 1 ? `1px solid ${C.bone}` : 'none' }}
              >
                <p style={{ fontSize: 14, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>
                  {faq.q}
                </p>
                <p style={{ fontSize: 13, color: C.slate, fontFamily: FONT, lineHeight: 1.7 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <div style={{ background: C.carbon, padding: '64px 48px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 700, color: C.white, display: 'block', marginBottom: 14 }}>
          Start selling today — it's free
        </h2>
        <p style={{ fontSize: 15, color: '#8C8A82', display: 'block', marginBottom: 32 }}>
          No credit card required. Cancel or upgrade anytime.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/onboarding')}
            style={{
              padding: '13px 24px', borderRadius: 8, fontSize: 15, fontWeight: 500,
              fontFamily: FONT, cursor: 'pointer', background: C.orange,
              color: C.white, border: 'none', transition: 'all 0.18s',
            }}
          >
            Create Free Account <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            style={{
              padding: '13px 24px', borderRadius: 8, fontSize: 15, fontWeight: 500,
              fontFamily: FONT, cursor: 'pointer', background: 'transparent',
              color: C.white, border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.18s',
            }}
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}
