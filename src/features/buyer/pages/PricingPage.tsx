import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ArrowRight, Sparkles, User, Lock, Star, Receipt, MessageSquare, Check, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';

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
const ADDONS: { Icon: LucideIcon; name: string; price: string; unit: string }[] = [
  { Icon: Sparkles,       name: 'Extra AI Credits',              price: '$10',   unit: 'per 500 credits'       },
  { Icon: User,           name: 'Additional Staff Seats',         price: '$5',    unit: 'per seat / month'      },
  { Icon: Lock,           name: 'Custom Domain SSL',              price: 'Free',  unit: 'included on Pro+'      },
  { Icon: Star,           name: 'Priority Marketplace Placement', price: '$29',   unit: 'per month'             },
  { Icon: Receipt,        name: 'Advanced Tax Compliance',        price: '$15',   unit: 'per month'             },
  { Icon: MessageSquare,  name: 'SMS Notifications',              price: '$0.05', unit: 'per message'           },
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
    <div className="bg-cream min-h-full">

      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <div className="text-center px-12 pt-16 pb-12 max-w-[720px] mx-auto">
        {/* Top pill badge */}
        <div className="inline-flex items-center gap-2 bg-brand-pale-orange border border-[rgba(217,119,87,0.3)] rounded-[20px] px-[14px] py-[5px] mb-5">
          <span className="text-[12px] text-[#B95A3A] font-medium">
            No credit card required • Cancel anytime
          </span>
        </div>

        <h1 className="block text-[42px] font-bold text-[#141413] leading-[1.2] mb-[14px]" style={{ fontFamily: SERIF }}>
          Simple, transparent pricing
        </h1>
        <p className="block text-[16px] text-[#8C8A82] leading-[1.6] mb-8">
          Start free. Scale as you grow. Every plan includes marketplace access, digital delivery, and AI-powered tools.
        </p>

        {/* Billing toggle — pill selector style (exact reference) */}
        <div className="inline-flex bg-bone rounded-[10px] p-1 mb-12">
          {(['monthly', 'annual'] as const).map(b => (
            <div
              key={b}
              onClick={() => setBilling(b)}
              className={clsx(
                'px-6 py-2 rounded-lg cursor-pointer flex items-center gap-[6px] transition-all duration-200',
                billing === b ? 'bg-white shadow-[0_1px_4px_rgba(0,0,0,0.1)]' : 'bg-transparent',
              )}
            >
              <span className={clsx('text-[13px] capitalize', billing === b ? 'font-semibold text-carbon' : 'font-normal text-slate')}>
                {b}
              </span>
              {b === 'annual' && (
                <span className="text-[10px] font-semibold text-success">Save 20%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Plan Cards ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 px-12 pb-16 max-w-[1200px] mx-auto">
        {PLANS.map(plan => {
          const isPro = plan.name === 'Professional';
          return (
            <div
              key={plan.name}
              className={clsx(
                'rounded-[20px] p-7 relative border-2',
                isPro
                  ? 'bg-carbon border-brand-orange shadow-[0_8px_40px_rgba(217,119,87,0.25)]'
                  : 'bg-white border-bone shadow-[0_2px_12px_rgba(0,0,0,0.06)]',
              )}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  className="absolute top-[-12px] left-1/2 -translate-x-1/2 bg-brand-orange text-white rounded-[20px] px-[14px] py-1 text-[11px] font-bold whitespace-nowrap"
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name */}
              <p className={clsx('text-[15px] font-bold mb-2', isPro ? 'text-white' : 'text-carbon')}>
                {plan.name}
              </p>
              <p className={clsx('text-[11px] mb-5 leading-[1.5]', isPro ? 'text-[#B0AEA8]' : 'text-slate')}>
                {plan.desc}
              </p>

              {/* Price */}
              <div className="mb-6">
                {plan.monthly === null ? (
                  <p className={clsx('text-[28px] font-bold', isPro ? 'text-white' : 'text-carbon')}>Custom</p>
                ) : plan.monthly === 0 ? (
                  <p className={clsx('text-[36px] font-bold', isPro ? 'text-white' : 'text-carbon')}>Free</p>
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className={clsx('text-[36px] font-bold', isPro ? 'text-brand-orange' : 'text-carbon')}>
                      {getPrice(plan)}
                    </span>
                    <span className={clsx('text-[13px]', isPro ? 'text-[#B0AEA8]' : 'text-slate')}>
                      /month
                    </span>
                  </div>
                )}
                {billing === 'annual' && plan.monthly !== null && plan.monthly > 0 && (
                  <p className={clsx('text-[11px] mt-1', isPro ? 'text-brand-orange' : 'text-success')}>
                    Billed ${(billing === 'annual' ? plan.annual! : plan.monthly) * 12}/year
                  </p>
                )}
              </div>

              {/* CTA Button */}
              <button
                onClick={() => navigate('/onboarding')}
                className={clsx(
                  'w-full py-[10px] rounded-lg text-[13px] font-semibold cursor-pointer mb-6 flex justify-center transition-all duration-[180ms] border',
                  isPro ? 'border-brand-orange bg-brand-orange text-white' : 'border-bone bg-transparent text-charcoal',
                )}
              >
                {plan.cta}
              </button>

              {/* Divider */}
              <div className={clsx('h-px mb-5', isPro ? 'bg-[rgba(255,255,255,0.1)]' : 'bg-bone')} />

              {/* Features */}
              <div className="flex flex-col gap-[10px]">
                {plan.features.map(f => (
                  <div key={f} className="flex gap-2 items-start">
                    <Check size={13} className="text-success flex-shrink-0 mt-[1px]" />
                    <span className={clsx('text-[12px] leading-[1.5]', isPro ? 'text-[#D0CEC8]' : 'text-charcoal')}>
                      {f}
                    </span>
                  </div>
                ))}
                {plan.missing.map(f => (
                  <div key={f} className="flex gap-2 items-start opacity-40">
                    <X size={13} className="text-[#8C8A82] flex-shrink-0 mt-[1px]" />
                    <span className="text-[12px] text-[#8C8A82] leading-[1.5]">
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
      <div className="px-12 pb-16 max-w-[1200px] mx-auto">
        <h2 className="text-[24px] font-bold text-[#141413] mb-2">
          Add-ons &amp; extras
        </h2>
        <p className="text-[14px] text-[#8C8A82] mb-7">
          Extend your plan with exactly what you need.
        </p>
        <div className="grid grid-cols-3 gap-[14px]">
          {ADDONS.map(a => (
            <div
              key={a.name}
              className="bg-white rounded-[12px] px-5 py-[18px] border border-bone flex gap-[14px] items-center"
            >
              <a.Icon size={28} className="text-brand-orange flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-[#141413] mb-[2px]">{a.name}</p>
                <p className="text-[11px] text-[#8C8A82]">{a.unit}</p>
              </div>
              <span className="text-[14px] font-bold text-brand-orange flex-shrink-0">
                {a.price}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────────── */}
      <div className="bg-white px-12 py-16 border-t border-bone">
        <div className="max-w-[720px] mx-auto">
          <h2 className="text-[28px] font-bold text-[#141413] text-center mb-10" style={{ fontFamily: SERIF }}>
            Frequently asked questions
          </h2>
          <div className="flex flex-col gap-0">
            {FAQS.map((faq, i) => (
              <div
                key={faq.q}
                className={clsx('py-5', i < FAQS.length - 1 && 'border-b border-bone')}
              >
                <p className="text-[14px] font-semibold text-[#141413] mb-2">
                  {faq.q}
                </p>
                <p className="text-[13px] text-[#8C8A82] leading-[1.7]">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <div className="bg-carbon px-12 py-16 text-center">
        <h2 className="block text-[32px] font-bold text-white mb-[14px]" style={{ fontFamily: SERIF }}>
          Start selling today — it's free
        </h2>
        <p className="block text-[15px] text-[#8C8A82] mb-8">
          No credit card required. Cancel or upgrade anytime.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate('/onboarding')}
            className="px-6 py-[13px] rounded-lg text-[15px] font-medium cursor-pointer bg-brand-orange text-white border-none transition-all duration-[180ms]"
          >
            Create Free Account <ArrowRight size={14} className="inline align-middle ml-1" />
          </button>
          <button
            onClick={() => navigate('/marketplace')}
            className="px-6 py-[13px] rounded-lg text-[15px] font-medium cursor-pointer bg-transparent text-white border border-[rgba(255,255,255,0.2)] transition-all duration-[180ms]"
          >
            Browse Marketplace
          </button>
        </div>
      </div>
    </div>
  );
}
