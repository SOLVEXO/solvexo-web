import { useState, useEffect, useLayoutEffect, useRef, Fragment, type CSSProperties, type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Check, Minus, Plus, Sparkles, Headphones, Globe2, ArrowRight, Store, ShoppingBag, MessageCircle, CreditCard, Truck, Package } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useFaqs } from '@/hooks/useFaqs';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { apiBrowsePlatformPlans, apiGetPublicTrialSettings, type PlatformPlan } from '@/api/services/platformPlans';
import { unsplashUrl } from '@/assets/stockPhotos';
import { apiGetTestimonials, type Testimonial } from '@/api/services/testimonials';
import { Reveal } from '@/components/comman/motion/Reveal';
import { Footer } from '@/components/comman/ui/Footer';
import { formatUsd, yearlyMonthlyEquivalent, yearlyTotal, maxYearlySavingsPercent } from '@/utils/planPricing';

// Shopify-style pricing page (structure/UX), Solvexo colours: dark hero with a
// billing dropdown + plan cards, "Always included", white "Compare all
// features" table with sticky plan header, dark FAQ panel, email CTA, footer.
// Plans/limits are live from the admin-managed catalog; the table only states
// things Solvexo really provides.

const BG = '#141413';
const PANEL = '#1f1f1d';
const LINE = 'rgba(255,255,255,0.14)';
const ACCENT = '#d97757';

// ── Compare table ────────────────────────────────────────────────────────────
type Cell = boolean | string | null;
interface Row { label: string; get: (p: PlatformPlan) => Cell }
interface Group { title: string; rows: Row[] }

const count = (n?: number) => (n === undefined || n === null ? null : n < 0 ? 'Unlimited' : `${n}`);
const flag = (v?: boolean) => (v === undefined ? null : !!v);
const pct = (n?: number) => (n === undefined || n === null ? null : `${Number((n * 100).toFixed(2))}%`);

const GROUPS: Group[] = [
  { title: 'Pricing', rows: [
    { label: 'Pay monthly', get: p => p.isCustomPricing ? 'Custom' : p.isFree ? 'Free' : `${formatUsd(p.monthlyPriceUSD ?? 0)} USD/month` },
    { label: 'Pay yearly', get: p => p.isCustomPricing ? 'Custom' : p.isFree ? 'Free' : `${formatUsd(yearlyMonthlyEquivalent(p))} USD/month` },
  ] },
  { title: 'Core features', rows: [
    { label: 'Online store', get: () => true },
    { label: 'Themes and templates', get: () => true },
    { label: 'Products', get: p => count(p.limits.maxProducts) },
    { label: 'Inventory management', get: () => true },
    { label: 'Additional staff accounts', get: p => count(p.limits.maxStaffAccounts) },
    { label: 'POS locations', get: p => count(p.limits.maxPosLocations) },
    { label: 'Reports and analytics', get: p => p.limits.advancedAnalyticsAllowed ? 'Advanced' : 'Standard' },
    { label: 'Support', get: p => p.limits.dedicatedAccountManager ? 'Dedicated manager' : p.limits.prioritySupport ? 'Priority support' : 'Standard support' },
  ] },
  { title: 'AI features', rows: [
    { label: 'AI credits per month', get: p => count(p.limits.aiCreditsPerMonth) },
  ] },
  { title: 'Hosting', rows: [
    { label: 'Hosting and free SSL', get: () => true },
    { label: 'Custom domain', get: p => flag(p.limits.customDomainAllowed) },
    { label: 'Remove Solvexo branding', get: p => flag(p.limits.whiteLabelAllowed) },
  ] },
  { title: 'Marketing', rows: [
    { label: 'Discount codes', get: () => true },
    { label: 'Gift cards', get: () => true },
    { label: 'Email campaigns', get: p => flag(p.limits.emailCampaignsAllowed) },
    { label: 'Abandoned cart recovery', get: p => flag(p.limits.abandonedCartRecoveryAllowed) },
    { label: 'Active promotions', get: p => count(p.limits.maxActivePromotions) },
    { label: 'Active store banners', get: p => count(p.limits.maxActiveStoreBanners) },
  ] },
  { title: 'SEO', rows: [
    { label: 'Built-in SEO features', get: () => true },
    { label: 'Advanced SEO tools', get: p => flag(p.limits.advancedSeoToolsAllowed) },
    { label: 'AI SEO suggestions', get: p => flag(p.limits.seoAiSuggestionsAllowed) },
    { label: 'Search Console integration', get: p => flag(p.limits.searchConsoleIntegrationAllowed) },
    { label: 'Custom redirects', get: p => flag(p.limits.customRedirectsAllowed) },
  ] },
  { title: 'Sell globally', rows: [
    { label: 'Selling currencies (markets)', get: p => count(p.limits.maxMarkets) },
    { label: 'Live carrier shipping rates', get: p => flag(p.limits.calculatedShippingRatesAllowed) },
  ] },
  { title: 'Payments', rows: [
    { label: 'Card payments via Solvexo Payments', get: () => 'No commission' },
    { label: 'Cash on delivery / bank transfer', get: () => 'No fee' },
    { label: 'Third-party gateway fee', get: p => pct(p.limits.transactionFeeRate) },
  ] },
];

function CellView({ v }: { v: Cell }) {
  if (v === true) return <Check size={22} className="text-white rounded-full p-[3px]" style={{ background: '#4a9d1c' }} aria-label="Included" />;
  if (v === false || v === null) return <Minus size={18} className="text-[#9a9a94]" aria-label="Not included" />;
  return <span>{v}</span>;
}

// ── FAQ fallback (until admin adds FAQs under the pricing category) ──────────
function getFallbackFaqs(trialDurationDays: number) { return [
  { q: 'Can I switch plans anytime?', a: "Yes. You can upgrade or downgrade your plan at any time. Upgrades take effect immediately and we'll prorate the difference; downgrades start at your next renewal." },
  { q: 'Does Solvexo take a commission on my sales?', a: 'No. There is no commission on card payments processed through Solvexo Payments — you only pay the card processing fee — and no fee on cash on delivery, bank transfer or in-person sales. A small third-party transaction fee (lower on bigger plans — see the comparison above) applies only if you accept payments through another payment gateway such as SafePay.' },
  { q: 'Is there a free trial?', a: `Yes — every new store gets a free ${trialDurationDays}-day trial with full platform access the moment it's created, no credit card required. Choose a plan whenever you're ready.` },
  { q: 'What payment methods do you accept?', a: 'We accept all major credit and debit cards. Payments are processed securely by Stripe — we never see or store your card number.' },
  { q: 'Do you offer discounts for educators or non-profits?', a: 'Yes — educators and registered non-profits qualify for a 40% discount on any paid plan. Contact our support team with your credentials.' },
]; }

// Shopify's stacking scroll: a section scrolls normally until its bottom edge
// reaches the viewport bottom, then stays pinned while the next (rounded-top,
// higher z-index) section slides up over it. `top` is therefore negative for
// sections taller than the screen, so it is measured instead of fixed.
function StackSection({ z, className, style, children }: { z: number; className?: string; style?: CSSProperties; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [top, setTop] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setTop(Math.min(0, window.innerHeight - el.offsetHeight));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  return <div ref={ref} className={className} style={{ position: 'sticky', top, zIndex: z, ...style }}>{children}</div>;
}

export function PricingPage() {
  const sellEntry = useSellEntry();
  usePageTitle('Pricing');
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');
  const [email, setEmail] = useState('');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [trialDurationDays, setTrialDurationDays] = useState(3);
  const [testimonial, setTestimonial] = useState<Testimonial | null>(null);

  useEffect(() => {
    apiBrowsePlatformPlans()
      .then(res => setPlans(res.data ?? []))
      .catch(() => {})
      .finally(() => setPlansLoading(false));
    apiGetTestimonials(1)
      .then(res => setTestimonial(res.data?.[0] ?? null))
      .catch(() => {});
    apiGetPublicTrialSettings()
      .then(res => setTrialDurationDays(res.data.durationDays))
      .catch(() => {});
  }, []);

  const { faqs: liveFaqs } = useFaqs();
  const faqs = liveFaqs.length > 0 ? liveFaqs.map(f => ({ q: f.question, a: f.answer })) : getFallbackFaqs(trialDurationDays);
  const save = maxYearlySavingsPercent(plans);
  const introPlan = plans.find(p => p.introOfferEnabled && p.introPriceUSD != null && p.introDurationCycles != null);
  const trialLine = introPlan
    ? `Try free for ${trialDurationDays} days, then US$${introPlan.introPriceUSD}/month for ${introPlan.introDurationCycles} month${introPlan.introDurationCycles === 1 ? '' : 's'}.`
    : `Try free for ${trialDurationDays} days — no credit card required.`;

  const onCta = (plan: PlatformPlan) => plan.isCustomPricing
    ? (window.location.href = `mailto:support@solvexo.com?subject=${encodeURIComponent(`${plan.name} Plan Inquiry`)}`)
    : sellEntry.goWithPlan(plan._id, billing);
  const ctaLabel = (p: PlatformPlan) => (p.isCustomPricing ? 'Contact sales' : 'Start for free');
  const cols = { gridTemplateColumns: `minmax(0,1.5fr) repeat(${Math.max(plans.length, 1)}, minmax(0,1fr))` };

  return (
    <div style={{ background: BG, color: '#fff' }} className="min-h-screen">
      <StackSection z={1} style={{ background: BG }}>
      {/* Hero */}
      <section className="px-4 md:px-8 pt-[112px] md:pt-[136px] pb-12 max-w-[1320px] mx-auto text-center">
        <Reveal>
          <h1 className="text-[40px] md:text-[64px] leading-[1.05] font-medium tracking-[-0.02em] mb-5">You&apos;ve got plans. Us too.</h1>
        </Reveal>
        <Reveal delay={0.08}>
          <p className="text-[16px] md:text-[18px] text-[#b6bfc3]">{trialLine}</p>
        </Reveal>
      </section>

      {/* Toolbar + plan cards */}
      <section className="px-4 md:px-8 pb-6 max-w-[1320px] mx-auto">
        <div className="relative flex items-center justify-center mb-6">
          <button type="button" role="switch" aria-checked={billing === 'annual'} aria-label="Pay yearly"
            onClick={() => setBilling(b => (b === 'annual' ? 'monthly' : 'annual'))}
            className="inline-flex items-center gap-4 rounded-full pl-7 pr-5 py-3 text-[18px] font-medium text-white bg-transparent cursor-pointer" style={{ border: `1px solid ${LINE}` }}>
            <span>{billing === 'annual' ? 'Pay yearly' : 'Pay monthly'}</span>
            {save > 0 && <span className="text-[15px]" style={{ color: ACCENT }}>Save {save}%</span>}
            <span className="relative inline-block h-6 w-11 rounded-full transition-colors duration-200" style={{ background: billing === 'annual' ? ACCENT : 'rgba(255,255,255,0.25)' }}>
              <span className="absolute top-[2px] left-[2px] size-5 rounded-full bg-white transition-transform duration-200" style={{ transform: billing === 'annual' ? 'translateX(20px)' : 'none' }} />
            </span>
          </button>
          <a href="#compare" className="absolute right-0 hidden md:block text-[14px] text-white underline underline-offset-4 decoration-white/40 hover:decoration-white">Compare all features</a>
        </div>

        <div className="grid grid-cols-1 min-[640px]:grid-cols-4 gap-2 lg:gap-3">
          {plansLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-2xl h-[380px] animate-pulse" style={{ background: PANEL }} />)
            : plans.length === 0
              ? <p className="col-span-full text-center text-[#b6bfc3] py-10">Pricing is being updated — check back shortly, or <a className="underline" style={{ color: ACCENT }} href="mailto:support@solvexo.com">contact sales</a>.</p>
              : plans.map(plan => {
                const price = billing === 'annual' ? yearlyMonthlyEquivalent(plan) : (plan.monthlyPriceUSD ?? 0);
                return (
                  <div key={plan._id} className="relative rounded-2xl p-3 lg:p-5 flex flex-col min-w-0" style={{ background: PANEL, border: plan.badge ? `1px solid ${ACCENT}` : '1px solid transparent' }}>
                    {plan.badge && <span className="absolute -top-3 left-5 rounded-full px-3 py-[3px] text-[11px] font-semibold text-white" style={{ background: ACCENT }}>{plan.badge}</span>}
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="text-[16px] lg:text-[20px] font-medium">{plan.name}</h2>
                      <div className="text-right leading-tight">
                        {plan.isCustomPricing ? <span className="text-[20px] font-medium">Custom</span>
                          : plan.isFree ? <span className="text-[20px] font-medium">Free</span>
                            : (<><span className="text-[22px] font-medium tabular-nums">US${Number.isInteger(price) ? price : price.toFixed(2)}</span><span className="text-[13px] text-[#b6bfc3]">/mo</span></>)}
                      </div>
                    </div>
                    <p className="text-[#a8a8a2] text-[12px] lg:text-[14px] mt-1 mb-5 min-h-[40px]">{plan.description ?? ' '}</p>
                    <button type="button" onClick={() => onCta(plan)}
                      className="w-full rounded-full py-[11px] text-[15px] font-medium bg-transparent text-white cursor-pointer transition-colors duration-200 hover:bg-white hover:text-black"
                      style={{ border: '1.5px solid #fff' }}>
                      {ctaLabel(plan)}
                    </button>
                    <p className="text-[12px] text-[#a8a8a2] text-center mt-2 mb-3 min-h-[16px]">
                      {billing === 'annual' && !plan.isFree && !plan.isCustomPricing && `Billed ${formatUsd(yearlyTotal(plan))} yearly`}
                      {billing === 'monthly' && plan.introOfferEnabled && plan.introPriceUSD != null && plan.introDurationCycles != null &&
                        `US$${plan.introPriceUSD}/mo for ${plan.introDurationCycles} month${plan.introDurationCycles === 1 ? '' : 's'}, then US$${plan.monthlyPriceUSD}/mo`}
                    </p>
                    <ul className="flex flex-col list-none p-0 m-0">
                      {(plan.featureBullets ?? []).map(f => (
                        <li key={f} className="py-3 text-[12px] lg:text-[14px] text-[#e8e6df]" style={{ borderTop: `1px solid ${LINE}` }}>{f}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
        </div>
        <p className="text-center text-[14px] text-[#b6bfc3] mt-8 pb-24">{trialLine}</p>
      </section>
      </StackSection>

      {/* Always included / But wait, there's more / Word on the street */}
      <StackSection z={2} className="rounded-t-[48px] md:rounded-t-[72px]" style={{ background: '#1c1c1a' }}>
        <div className="px-4 md:px-8 pt-16 md:pt-24 pb-24 max-w-[1320px] mx-auto">
          <h2 className="text-[28px] md:text-[40px] font-medium mb-10">Always included</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-14">
            <Reveal>
              <div className="rounded-[28px] overflow-hidden h-[420px] md:h-[600px] relative" style={{ background: '#f4f4f2' }}>
                {/* phone */}
                <div className="absolute left-1/2 -translate-x-1/2 top-16 w-[300px] md:w-[340px] h-[640px] rounded-[44px] bg-white" style={{ border: '8px solid #d9d9d4', boxShadow: '0 30px 60px rgba(0,0,0,0.12)' }}>
                  <div className="mx-auto mt-3 h-6 w-28 rounded-full bg-black" />
                  <div className="px-5 pt-5 text-[#141413]">
                    <p className="text-[14px] font-semibold mb-1">Payment</p>
                    <p className="text-[10px] text-[#7a7a74] mb-3">All transactions are secure and encrypted.</p>
                    {[['Credit card', false], ['Cash on delivery', false], ['Bank transfer', true]].map(([m, on]) => (
                      <div key={String(m)} className="flex items-center gap-3 rounded-lg px-3 py-3 mb-2 text-[12px]" style={{ border: `1px solid ${on ? '#1a73e8' : '#e0e0da'}`, background: on ? '#eef4fe' : '#fff' }}>
                        <span className="size-3.5 rounded-full" style={{ border: `4px solid ${on ? '#1a73e8' : '#cfcfc8'}` }} />{m}
                      </div>
                    ))}
                    <p className="text-[14px] font-semibold mt-5 mb-3">Order summary</p>
                    {[['Subtotal · 4 items', '$160.00'], ['Shipping', '$10.00'], ['Estimated taxes', '$5.00']].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[11px] text-[#55554f] py-1"><span>{k}</span><span>{v}</span></div>
                    ))}
                    <div className="flex justify-between text-[15px] font-semibold pt-3"><span>Total</span><span>$175.00</span></div>
                    <div className="mt-4 rounded-lg py-3 text-center text-[13px] font-semibold text-white" style={{ background: ACCENT }}>Pay now</div>
                  </div>
                </div>
                {/* product photo, top-left */}
                <div className="absolute left-5 md:left-12 top-24 w-[120px] md:w-[170px] h-[150px] md:h-[210px] rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                  <img src={unsplashUrl('sneakers', 360)} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
                {/* origin tag + photo, bottom-left */}
                <div className="absolute left-5 md:left-9 bottom-24 hidden sm:block">
                  <span className="inline-block rounded-md bg-black text-white text-[11px] font-medium px-2.5 py-1.5 mb-2">Origin · Store warehouse</span>
                  <div className="w-[130px] h-[130px] rounded-xl overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
                    <img src={unsplashUrl('watch', 300)} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                </div>
                {/* shipping method card */}
                <div className="absolute right-4 md:right-8 top-36 w-[220px] md:w-[250px] rounded-2xl bg-white p-4 text-[#141413] shadow-[0_18px_40px_rgba(0,0,0,0.15)] hidden sm:block">
                  <p className="text-[12px] font-semibold mb-1">Shipping method</p>
                  <p className="text-[10px] text-[#7a7a74] mb-3">Your order will arrive in 2 shipments</p>
                  {[['Standard', '5 to 8 business days', '$10.00', true], ['Express', '3 to 4 business days', '$15.00', false]].map(([n, d, p, on]) => (
                    <div key={String(n)} className="flex items-start justify-between rounded-lg px-3 py-2 mb-2 text-[11px]" style={{ border: `1px solid ${on ? '#1a73e8' : '#e0e0da'}`, background: on ? '#eef4fe' : '#fff' }}>
                      <div><p className="font-semibold">{n}</p><p className="text-[#7a7a74] text-[10px]">{d}</p></div><span className="font-semibold">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
              <h3 className="text-[24px] md:text-[28px] font-medium mt-6 mb-2">Secure, high-converting checkout</h3>
              <p className="text-[16px] text-[#a8a8a2]">Guest checkout, cards, cash on delivery and bank transfer — card payments settle straight to your own account.</p>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="rounded-[28px] overflow-hidden h-[420px] md:h-[600px] relative" style={{ background: '#f4f4f2' }}>
                <div className="absolute inset-0 flex items-center" style={{ perspective: '1400px' }}>
                  <div className="flex gap-3 w-[135%] -ml-[6%]" style={{ transform: 'rotateY(-28deg) rotateZ(-6deg) skewY(2deg)', transformOrigin: 'center' }}>
                    {(['fashionRack', 'skincare', 'homeInterior', 'headphones', 'coffeeShop', 'cameraGear', 'watch', 'plateOfFood'] as const).map((k, i) => (
                      <div key={k} className="shrink-0 w-[150px] md:w-[190px] h-[330px] md:h-[420px] rounded-xl overflow-hidden bg-white shadow-[0_14px_34px_rgba(0,0,0,0.16)] flex flex-col" style={{ marginTop: i % 2 ? 24 : 0 }}>
                        <div className="h-5 bg-[#f1f0ea] flex items-center gap-1 px-2"><span className="size-1.5 rounded-full bg-[#cfcfc8]" /><span className="size-1.5 rounded-full bg-[#cfcfc8]" /></div>
                        <img src={unsplashUrl(k, 400)} alt="" className="w-full flex-1 min-h-0 object-cover" loading="lazy" />
                        <div className="p-2"><div className="h-2 w-2/3 rounded bg-[#e6e4dc] mb-1.5" /><div className="h-2 w-1/3 rounded" style={{ background: ACCENT }} /></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <h3 className="text-[24px] md:text-[28px] font-medium mt-6 mb-2">Stunning store design</h3>
              <p className="text-[16px] text-[#a8a8a2]">Start from a ready-made theme and shape every section in the visual editor.</p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-24">
            <Reveal>
              <div className="rounded-[28px] h-[340px] md:h-[400px] relative overflow-hidden flex items-center justify-center" style={{ background: '#fff' }}>
                <div className="absolute size-[300px] rounded-full blur-3xl opacity-60" style={{ background: 'radial-gradient(circle, #ffd9c9, #f3d4ff 60%, transparent)' }} />
                <div className="relative rounded-2xl bg-white shadow-[0_10px_40px_rgba(0,0,0,0.1)] w-[250px] h-[250px] flex flex-col items-center justify-center text-center text-[#141413]">
                  <Sparkles size={34} style={{ color: ACCENT }} className="mb-3" />
                  <p className="text-[20px] font-medium">Hi there!</p>
                  <p className="text-[20px] font-medium" style={{ color: ACCENT }}>How can I help?</p>
                </div>
              </div>
              <h3 className="text-[24px] md:text-[28px] font-medium mt-6 mb-2">Built-in AI assistant</h3>
              <p className="text-[16px] text-[#a8a8a2]">Write product copy, improve SEO and get ideas — AI tools live right inside your admin.</p>
            </Reveal>
            <Reveal delay={0.06}>
              <div className="rounded-[28px] h-[340px] md:h-[400px] relative overflow-hidden flex items-center justify-center" style={{ background: '#f4f4f2' }}>
                {[220, 330, 440].map(s => <span key={s} className="absolute rounded-full border border-dashed border-[#cfcfc8]" style={{ width: s, height: s, top: 'calc(50% - ' + s / 2 + 'px + 70px)', left: 'calc(50% - ' + s / 2 + 'px)' }} />)}
                {[['18%', '20%'], ['50%', '8%'], ['80%', '20%'], ['12%', '52%'], ['88%', '52%']].map(([l, t], i) => (
                  <span key={i} className="absolute size-11 rounded-full bg-white shadow-md flex items-center justify-center" style={{ left: l, top: t, transform: 'translateX(-50%)' }}>
                    {i % 2 ? <Globe2 size={18} className="text-[#6b6a64]" /> : <Headphones size={18} className="text-[#6b6a64]" />}
                  </span>
                ))}
                <span className="relative mt-24 size-[84px] rounded-full bg-white flex items-center justify-center" style={{ border: `2px solid ${ACCENT}` }}><Headphones size={34} style={{ color: ACCENT }} /></span>
              </div>
              <h3 className="text-[24px] md:text-[28px] font-medium mt-6 mb-2">Support when you need it</h3>
              <p className="text-[16px] text-[#a8a8a2]">Our support team and help center are here whenever you get stuck.</p>
            </Reveal>
            <Reveal delay={0.12}>
              <div className="rounded-[28px] h-[340px] md:h-[400px] relative overflow-hidden flex flex-col items-center pt-8" style={{ background: '#f4f4f2' }}>
                <span className="size-[72px] rounded-2xl flex items-center justify-center text-white text-[40px] font-bold" style={{ background: ACCENT }}>S</span>
                <div className="w-[70%] h-8 mt-1 rounded-b-3xl border-x border-b border-[#cfcfc8]" />
                <div className="grid grid-cols-4 gap-3 mt-1">
                  {[Store, ShoppingBag, MessageCircle, Globe2].map((I, i) => (
                    <span key={i} className="size-12 rounded-xl bg-white shadow-md flex items-center justify-center"><I size={20} className="text-[#6b6a64]" /></span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-3 mt-4">
                  {[CreditCard, Truck, Package].map((I, i) => (
                    <span key={i} className="size-12 rounded-xl bg-white shadow-md flex items-center justify-center"><I size={20} className="text-[#6b6a64]" /></span>
                  ))}
                </div>
              </div>
              <h3 className="text-[24px] md:text-[28px] font-medium mt-6 mb-2">Every channel, one platform</h3>
              <p className="text-[16px] text-[#a8a8a2]">Online store, POS and marketplace — one catalog, one inventory, one place to manage it all.</p>
            </Reveal>
          </div>

          <h2 className="text-[28px] md:text-[40px] font-medium mb-8">But wait, there&apos;s more</h2>
          <Reveal>
            <div className="rounded-[28px] p-5 md:p-10 grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 md:gap-10 md:max-w-[828px] mb-24" style={{ background: '#0d0d0c' }}>
              <div className="rounded-2xl overflow-hidden h-[260px] md:h-[400px]">
                <img src={unsplashUrl('smallCafeCounter', 700)} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[24px] font-medium">Solvexo POS</span>
                      <span className="rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide" style={{ border: `1px solid ${ACCENT}`, color: ACCENT }}>ADD ON</span>
                    </div>
                    <p className="text-[#a8a8a2] text-[15px] mt-1">For physical storefronts</p>
                  </div>
                </div>
                <a href="/products" className="mt-8 block text-center rounded-full py-3 text-[16px] font-medium text-white no-underline transition-colors hover:bg-white hover:text-black" style={{ border: '1.5px solid #fff' }}>Learn more</a>
                <p className="text-[15px] text-[#a8a8a2] mt-8 mb-3">Level up your stores with:</p>
                {['Staff roles & permissions', 'In-store inventory management', 'In-store pickup & flexible delivery'].map(f => (
                  <p key={f} className="py-3 text-[15px] text-[#e8e6df]" style={{ borderTop: `1px solid ${LINE}` }}>{f}</p>
                ))}
              </div>
            </div>
          </Reveal>

          <h2 className="text-[24px] md:text-[32px] font-medium mb-8">Word on the street</h2>
          {testimonial && (
            <Reveal>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center mb-5">
                <div className="rounded-[28px] overflow-hidden h-[300px] md:h-[490px]">
                  <img src={unsplashUrl('businessHandshake', 900)} alt="" className="w-full h-full object-cover" loading="lazy" />
                </div>
                <div>
                  <p className="text-[24px] md:text-[40px] leading-[1.2] font-normal">&ldquo;{testimonial.text}&rdquo;</p>
                  <p className="text-[#a8a8a2] text-[16px] md:text-[20px] mt-10">—{testimonial.name}{testimonial.storeName ? `, ${testimonial.storeName}` : ''}</p>
                </div>
              </div>
            </Reveal>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { big: '0%', body: 'Commission Solvexo takes on card payments — they settle straight to your own account.' },
              { big: `${trialDurationDays} days`, body: 'Free trial on every new store, with full platform access and no credit card required.' },
            ].map(s => (
              <div key={s.big} className="rounded-[28px] p-8 md:p-9 flex flex-col justify-between min-h-[280px]" style={{ background: '#0d0d0c' }}>
                <p className="text-[56px] md:text-[96px] leading-none font-medium tracking-[-0.03em]">{s.big}</p>
                <p className="text-[16px] md:text-[18px] text-[#d4d2ca] mt-10">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </StackSection>

      {/* Compare all features */}
      <StackSection z={3} className="rounded-t-[48px] md:rounded-t-[72px]" style={{ background: '#fff' }}>
      <section id="compare" className="text-[#141413] pt-14 pb-24">
        <div className="px-4 md:px-8 max-w-[1320px] mx-auto max-md:overflow-x-auto">
          <div className="min-w-[760px]">
            <div className="sticky top-[72px] z-10 bg-white grid items-end gap-4 py-5" style={{ ...cols, borderBottom: '1px solid #e3e3e0' }}>
              <h2 className="text-[26px] md:text-[32px] font-medium">Compare all features</h2>
              {plans.map(p => (
                <div key={p._id}>
                  <p className="text-[22px] md:text-[26px] font-medium mb-3">{p.name}</p>
                  <button type="button" onClick={() => onCta(p)}
                    className="rounded-full px-5 py-2 text-[14px] font-medium bg-white text-black cursor-pointer transition-colors duration-200 hover:bg-black hover:text-white"
                    style={{ border: '1.5px solid #000' }}>{ctaLabel(p)}</button>
                </div>
              ))}
            </div>

            {GROUPS.map(g => (
              <Fragment key={g.title}>
                <h3 className="text-[24px] md:text-[28px] font-medium pt-12 pb-4">{g.title}</h3>
                {g.rows.map(r => (
                  <div key={r.label} className="grid items-center gap-4 py-5 text-[15px]" style={{ ...cols, borderTop: '1px solid #e3e3e0' }}>
                    <span>{r.label}</span>
                    {plans.map(p => <div key={p._id} className="min-h-[24px] flex items-center"><CellView v={r.get(p)} /></div>)}
                  </div>
                ))}
              </Fragment>
            ))}
          </div>
        </div>
      </section>
      </StackSection>

      {/* FAQs + closing CTA — slides up over the pinned table */}
      <div className="relative" style={{ zIndex: 4 }}>
        <section className="rounded-t-[48px] md:rounded-t-[72px] pt-20" style={{ background: BG }}>
          <div className="px-4 md:px-8 max-w-[1320px] mx-auto pb-20">
            <h2 className="text-[36px] md:text-[56px] font-medium mb-10">FAQs</h2>
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={faq.q} style={{ borderTop: `1px solid ${LINE}`, borderBottom: i === faqs.length - 1 ? `1px solid ${LINE}` : undefined }}>
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-6 py-8 text-left bg-transparent border-0 text-white cursor-pointer">
                    <span className="text-[20px] md:text-[26px] font-medium">{faq.q}</span>
                    <span className="shrink-0 size-11 rounded-full bg-white text-black flex items-center justify-center">
                      <Plus size={20} className={clsx('transition-transform duration-300', isOpen && 'rotate-45')} />
                    </span>
                  </button>
                  <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                    <div className="overflow-hidden"><p className="text-[16px] text-[#b6bfc3] leading-[1.7] pb-8 max-w-[860px]">{faq.a}</p></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-4 md:px-8 pb-24 max-w-[1320px] mx-auto text-center">
            <h2 className="text-[36px] md:text-[56px] font-medium mb-4">Turn plans into progress</h2>
            <p className="text-[#b6bfc3] text-[16px] mb-8">{trialDurationDays} days free. No credit card required. Cancel or upgrade anytime.</p>
            <form onSubmit={e => { e.preventDefault(); sellEntry.goWithEmail(email.trim()); }}
              className="mx-auto flex max-w-[560px] flex-col sm:flex-row gap-3">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email address" aria-label="Email address" autoComplete="email"
                className="flex-1 min-w-0 rounded-full px-6 py-4 text-[15px] text-white placeholder:text-[#8d8c86] bg-transparent outline-none focus:border-white" style={{ border: `1px solid ${LINE}` }} />
              <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-4 text-[15px] font-medium text-white cursor-pointer border-0 transition-opacity duration-200 hover:opacity-90" style={{ background: ACCENT }}>
                Start for free <ArrowRight size={15} />
              </button>
            </form>
            <p className="text-[12px] text-[#8d8c86] mt-4">By entering your email, you agree to receive marketing emails from Solvexo.</p>
          </div>
        </section>
        <Footer />
      </div>
    </div>
  );
}
