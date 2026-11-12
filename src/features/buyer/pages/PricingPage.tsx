import { useState, useEffect, Fragment } from 'react';
import { clsx } from 'clsx';
import { Check, Minus, Plus, ArrowRight, Store, ScanBarcode, Banknote, Truck, Tag, Lock, Gift, PartyPopper, Star, Palette, LayoutTemplate, FileText, Languages, ShieldCheck, MessageCircle, Rss } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useFaqs } from '@/hooks/useFaqs';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { apiBrowsePlatformPlans, apiGetPublicTrialSettings, type PlatformPlan } from '@/api/services/platformPlans';
import { Reveal } from '@/components/comman/motion/Reveal';
import { Footer } from '@/components/comman/ui/Footer';
import { formatUsd, yearlyMonthlyEquivalent, yearlyTotal, maxYearlySavingsPercent } from '@/utils/planPricing';
import { salesMailto } from '@/utils/contact';
import { displayPrice, gatewayFeeRange, money, planCopy, planFeatures } from './pricing/planFeatures';
import { FeatureHelp } from './pricing/FeatureHelp';
import { formatLocal, useLocalCurrency } from './pricing/localPrice';
import { countryFromPathname } from '@/utils/countryPrefix';
import { ltr } from './pricing/arabicCount';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { useSiteText } from '@/i18n/site/useSiteText';
import { PRICING_TEXT } from './PricingPage.text';

type PricingText = (typeof PRICING_TEXT)['en'];

// Bright pricing page: launch-offer hero, plan cards with the crossed-out "was" price and
// plain-language features, "Included in every plan", a plan picker, what each sale costs,
// the full comparison table and FAQs. Prices, offers and limits are live from the
// admin-managed catalog; nothing here promises more than the backend enforces.

const INK = '#1c1d1b';
const MUTED = '#6f6e69';
const LINE = '#e9e6dc';
const ACCENT = '#d97757';
const GREEN = '#2f8a3e';

// ── Compare table ────────────────────────────────────────────────────────────
type Cell = boolean | string | null;
interface Row { label: string; get: (p: PlatformPlan) => Cell; /** Hidden on the Pakistan site: the card rail is not available to Pakistani stores. */ hideOnPk?: boolean }
interface Group { title: string; rows: Row[] }

const count = (n: number | undefined, t: PricingText) => (n === undefined || n === null ? null : n < 0 ? t.unlimited : `${n}`);
const flag = (v?: boolean) => (v === undefined ? null : !!v);
const num = (n: number | undefined, t: PricingText) => (n === undefined || n === null ? null : n < 0 ? t.unlimited : n.toLocaleString('en-US'));
const pct = (n?: number) => (n === undefined || n === null ? null : `${Number((n * 100).toFixed(2))}%`);

function compareGroups(t: PricingText): Group[] {
  const g = t.groups, r = t.rows;
  const c = (n?: number) => count(n, t);
  return [
    { title: g.pricing, rows: [
      { label: r.payMonthly, get: p => p.isCustomPricing ? t.custom : p.isFree ? t.free : t.usdPerMonth(formatUsd(p.monthlyPriceUSD ?? 0)) },
      { label: r.payYearly, get: p => p.isCustomPricing ? t.custom : p.isFree ? t.free : t.usdPerMonth(formatUsd(yearlyMonthlyEquivalent(p))) },
    ] },
    { title: g.core, rows: [
      { label: r.store, get: () => true },
      { label: r.themes, get: () => true },
      { label: r.products, get: p => c(p.limits.maxProducts) },
      { label: r.inventory, get: () => true },
      { label: r.staff, get: p => c(p.limits.maxStaffAccounts) },
      { label: r.posLocations, get: p => c(p.limits.maxPosLocations) },
      { label: r.reports, get: p => p.limits.advancedAnalyticsAllowed ? t.advanced : t.standard },
      { label: r.support, get: p => p.limits.dedicatedAccountManager ? t.dedicatedManager : p.limits.prioritySupport ? t.prioritySupport : t.standardSupport },
      { label: r.webhooks, get: p => flag(p.limits.apiWebhooksAllowed) },
    ] },
    { title: g.online, rows: [
      { label: r.themesEditor, get: () => true },
      { label: r.headerFooter, get: () => true },
      { label: r.pagesBlog, get: () => true },
      { label: r.translations, get: () => true },
    ] },
    { title: g.ai, rows: [
      { label: r.aiCredits, get: p => (p.limits.seoAiSuggestionsAllowed ? c(p.limits.aiCreditsPerMonth) : false) },
    ] },
    { title: g.hosting, rows: [
      { label: r.hostingSsl, get: () => true },
      { label: r.domain, get: p => flag(p.limits.customDomainAllowed) },
      { label: r.branding, get: p => flag(p.limits.whiteLabelAllowed) },
    ] },
    { title: g.marketing, rows: [
      { label: r.discounts, get: () => true },
      { label: r.giftCards, get: () => true },
      { label: r.emailCampaigns, get: p => flag(p.limits.emailCampaignsAllowed) },
      { label: r.abandoned, get: p => flag(p.limits.abandonedCartRecoveryAllowed) },
      { label: r.emailsPerMonth, get: p => num(p.limits.monthlyEmailSends, t) },
      { label: r.loyalty, get: p => flag(p.limits.loyaltyProgramAllowed) },
    ] },
    { title: g.wholesale, rows: [
      { label: r.b2b, get: p => flag(p.limits.b2bWholesaleAllowed) },
      { label: r.b2bCatalogs, get: p => (p.limits.b2bWholesaleAllowed ? c(p.limits.maxB2BCatalogs) : null) },
      { label: r.memberships, get: p => flag(p.limits.digitalMembershipsAllowed) },
      { label: r.licenseKeys, get: p => flag(p.limits.digitalLicensesAllowed) },
      { label: r.courses, get: p => flag(p.limits.digitalCoursesAllowed) },
    ] },
    { title: g.seo, rows: [
      { label: r.seoBuiltIn, get: () => true },
      { label: r.seoAdvanced, get: p => flag(p.limits.advancedSeoToolsAllowed) },
      { label: r.seoAi, get: p => flag(p.limits.seoAiSuggestionsAllowed) },
      { label: r.searchConsole, get: p => flag(p.limits.searchConsoleIntegrationAllowed) },
      { label: r.redirects, get: p => flag(p.limits.customRedirectsAllowed) },
    ] },
    { title: g.global, rows: [
      { label: r.markets, get: p => c(p.limits.maxMarkets) },
      { label: r.carrierRates, get: p => flag(p.limits.calculatedShippingRatesAllowed) },
    ] },
    { title: g.payments, rows: [
      { label: r.cardPayments, get: () => t.noCommission, hideOnPk: true },
      { label: r.codBank, get: () => t.noFee },
      { label: r.gatewayFee, get: p => pct(p.limits.transactionFeeRate) },
    ] },
  ];
}

function CellView({ v, t }: { v: Cell; t: PricingText }) {
  if (v === true) return <Check size={22} className="text-white rounded-full p-[3px]" style={{ background: GREEN }} aria-label={t.included} />;
  if (v === false || v === null) return <Minus size={18} className="text-[#9a9a94]" aria-label={t.notIncluded} />;
  return <span>{v}</span>;
}

function Tick() {
  return <span className="mt-[2px] size-[18px] shrink-0 rounded-full inline-flex items-center justify-center" style={{ background: '#eaf6ec', color: GREEN }}><Check size={11} strokeWidth={3} aria-hidden /></span>;
}

const EVERY_PLAN_ICONS = [Store, ScanBarcode, Banknote, Truck, Tag, Lock, Palette, LayoutTemplate, FileText, Languages, ShieldCheck, MessageCircle, Rss];

/** "Pick the one that sounds like you" — one line per core plan, built from its live limits (text in PricingPage.text.ts). */
const PICK_KEYS = ['basic', 'grow', 'advanced'] as const;

export function PricingPage() {
  const sellEntry = useSellEntry();
  const t = useSiteText(PRICING_TEXT);
  const { pageLang } = useSiteLang();
  usePageTitle(t.pageTitle);
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');
  const [email, setEmail] = useState('');
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [trialDurationDays, setTrialDurationDays] = useState<number | null>(null);

  useEffect(() => {
    apiBrowsePlatformPlans()
      .then(res => setPlans(res.data ?? []))
      .catch(() => {})
      .finally(() => setPlansLoading(false));
    apiGetPublicTrialSettings()
      .then(res => setTrialDurationDays(res.data.durationDays))
      .catch(() => {});
  }, []);

  // Country sites: the Solvexo Payments card rail is not available to Pakistani stores, so don't advertise it there.
  const isPk = typeof window !== 'undefined' && countryFromPathname(window.location.pathname) === 'pk';
  const { faqs: liveFaqs } = useFaqs('pricing');
  const trialDays = trialDurationDays ?? 7;
  // Admin-managed FAQs are written in English; the Arabic page shows its own translated set.
  const faqs = liveFaqs.length > 0 && pageLang === 'en' ? liveFaqs.map(f => ({ q: f.question, a: f.answer })) : t.faqs(trialDays, isPk);
  const save = maxYearlySavingsPercent(plans);
  const priced = plans.filter(p => !p.isFree && !p.isCustomPricing);
  const offs = priced.map(p => displayPrice(p, 'monthly').percentOff);
  const minOff = offs.length && offs.every(o => o > 0) ? Math.min(...offs) : 0;
  const maxOff = offs.length ? Math.max(...offs) : 0;
  // Country sites (/pk/pricing) show prices in the local currency; billing stays in US$.
  const local = useLocalCurrency();
  // US$ only: English "US$6", Arabic "$6" (the note under the cards says the prices are in US dollars).
  const price = (usd: number) => (local ? formatLocal(usd, local, pageLang) : pageLang === 'ar' ? ltr(money(usd)) : `US${money(usd)}`);
  const introPlan = plans.find(p => p.introOfferEnabled && p.introPriceUSD != null && p.introDurationCycles != null);
  const introText = introPlan ? t.introText(price(introPlan.introPriceUSD!), introPlan.introDurationCycles!) : null;
  const feeRangeRaw = gatewayFeeRange(plans);
  const feeRange = feeRangeRaw && pageLang === 'ar' ? ltr(feeRangeRaw) : feeRangeRaw;
  const trialCta = t.trialCta(trialDurationDays);
  const groups = compareGroups(t);
  const copy = (p: PlatformPlan) => planCopy(p, pageLang);

  const onCta = (plan: PlatformPlan) => plan.isCustomPricing
    ? window.location.assign(salesMailto(`${plan.name} Plan Inquiry`))
    : sellEntry.goWithPlan(plan._id, billing);
  const ctaLabel = (p: PlatformPlan) => (p.isCustomPricing ? t.contactSales : trialCta);
  const cols = { gridTemplateColumns: `minmax(0,1.5fr) repeat(${Math.max(plans.length, 1)}, minmax(0,1fr))` };

  return (
    <div className="min-h-screen bg-[#faf9f5]" style={{ color: INK }}>
      {/* Hero */}
      <section className="px-4 md:px-8 pt-[104px] md:pt-[128px] pb-6 max-w-[1240px] mx-auto text-center">
        {maxOff > 0 && (
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full px-4 py-[7px] text-[13px] font-semibold text-white" style={{ background: ACCENT, boxShadow: '0 6px 18px rgba(217,119,87,.3)' }}>
              <PartyPopper size={15} aria-hidden /> {t.launchOffer(minOff, maxOff)}
            </span>
          </Reveal>
        )}
        <Reveal delay={0.05}>
          <h1 className="mt-5 mb-4 text-[34px] md:text-[52px] leading-[1.1] font-semibold tracking-[-0.03em]">
            {t.heroTitle}{maxOff > 0 && <><br /><span style={{ color: ACCENT }}>{t.heroOff(minOff, maxOff)}</span></>}
          </h1>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto max-w-[660px] text-[16px] md:text-[17px] leading-[1.65]" style={{ color: MUTED }}>
            {t.tryPre}<strong className="font-semibold" style={{ color: INK }}>{t.tryStrong(trialDays)}</strong>{t.tryPost}
            {introText && <>{t.thenPre}<strong className="font-semibold" style={{ color: INK }}>{introText}</strong>{t.thenPost}</>}
            {' '}{t.noCodCommission}
          </p>
        </Reveal>

        <div role="radiogroup" aria-label={t.billingPeriod} className="mt-7 inline-flex gap-1 rounded-full bg-white p-[5px]" style={{ border: `1px solid ${LINE}` }}>
          {([['monthly', t.payMonthly], ['annual', t.payYearly]] as const).map(([b, label]) => (
            <button key={b} type="button" role="radio" aria-checked={billing === b} onClick={() => setBilling(b)}
              className={clsx('whitespace-nowrap rounded-full px-4 sm:px-5 py-[9px] text-[14px] font-medium cursor-pointer border-0 transition-colors', billing === b ? 'text-white' : 'bg-transparent')}
              style={billing === b ? { background: INK } : { color: MUTED }}>
              {label}
              {b === 'annual' && save > 0 && <span className="ms-1.5 font-semibold" style={{ color: billing === b ? '#9be0a6' : GREEN }}><span className="hidden sm:inline">{t.saveUpTo(save)}</span><span className="sm:hidden">{t.saveShort(save)}</span></span>}
            </button>
          ))}
        </div>

        <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2.5 list-none p-0 text-[13.5px] text-[#3d3c39]">
          {t.perks(trialDays).map(perk => (
            <li key={perk} className="inline-flex items-center gap-2"><Tick />{perk}</li>
          ))}
        </ul>
      </section>

      {/* Plan cards */}
      <section className="px-4 md:px-8 pt-8 max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4 items-stretch">
          {plansLoading
            ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="rounded-[18px] h-[560px] animate-pulse bg-white" style={{ border: `1px solid ${LINE}` }} />)
            : plans.length === 0
              ? <p className="col-span-full text-center py-10" style={{ color: MUTED }}>{t.emptyPre}<a className="underline" style={{ color: ACCENT }} href={salesMailto()}>{t.emptyLink}</a>{t.emptyPost}</p>
              : plans.map((plan, i) => {
                const popular = !!plan.badge;
                const { now, was, percentOff } = displayPrice(plan, billing);
                const prev = i > 0 ? plans[i - 1] : null;
                const features = planFeatures(plan, prev, pageLang);
                const { name, description, badge } = copy(plan);
                const intro = billing === 'monthly' && plan.introOfferEnabled && plan.introPriceUSD != null && plan.introDurationCycles != null;
                const fee = plan.limits?.transactionFeeRate;
                return (
                  <div key={plan._id} className={clsx('relative flex flex-col rounded-[18px] bg-white px-5 py-6', popular && 'lg:-translate-y-2')}
                    style={popular ? { border: `2px solid ${ACCENT}`, boxShadow: '0 18px 40px rgba(217,119,87,.16)' } : { border: `1px solid ${LINE}` }}>
                    {popular && (
                      <span className="absolute -top-[13px] left-1/2 -translate-x-1/2 inline-flex items-center gap-1 whitespace-nowrap rounded-full px-3 py-1 text-[11.5px] font-semibold text-white" style={{ background: ACCENT }}>
                        <Star size={11} fill="currentColor" aria-hidden /> {badge}
                      </span>
                    )}
                    <h2 className="text-[20px] font-semibold">{name}</h2>
                    <p className="mt-1 mb-4 text-[13px] leading-[1.5] lg:min-h-[40px]" style={{ color: MUTED }}>{description ?? ' '}</p>

                    {plan.isCustomPricing || plan.isFree ? (
                      <p className="text-[36px] font-bold tracking-[-0.03em]">{plan.isFree ? t.free : t.custom}</p>
                    ) : (
                      <>
                        <div className="min-h-[24px] flex items-center gap-2 text-[14px] text-[#9a988f]">
                          {was != null && <><s>{price(was)}</s><span className="rounded-md px-2 py-[2px] text-[11.5px] font-bold" style={{ background: '#eaf6ec', color: GREEN }}>{t.percentOff(percentOff)}</span></>}
                        </div>
                        <p className="mt-1 flex items-baseline gap-1">
                          <span className="text-[38px] font-bold tracking-[-0.03em] tabular-nums">{price(now)}</span>
                          <span className="text-[14px]" style={{ color: MUTED }}>{t.perMonth}</span>
                        </p>
                        <p className="min-h-[19px] text-[12.5px] font-semibold" style={{ color: GREEN }}>
                          {billing === 'annual' ? t.billedYearly(price(yearlyTotal(plan))) : was != null ? t.youSave(price(Math.round((was - now) * 100) / 100)) : ''}
                        </p>
                        {local && (
                          <p className="mt-0.5 text-[11.5px]" style={{ color: MUTED }}>
                            {t.billedInUsd(money(billing === 'annual' ? yearlyTotal(plan) : now), billing === 'annual')}
                          </p>
                        )}
                      </>
                    )}

                    {intro && (
                      <div className="mt-3.5 rounded-[10px] px-3 py-2.5 text-[12.5px] leading-[1.5]" style={{ background: '#fdf0ea', color: '#7a3f2a' }}>
                        <span className="inline-flex items-center gap-1.5 font-bold"><Gift size={13} aria-hidden /> {t.introFirst(plan.introDurationCycles!, price(plan.introPriceUSD!))}</span>
                        <br />{t.introThen(price(plan.monthlyPriceUSD ?? 0))}
                      </div>
                    )}

                    <button type="button" onClick={() => onCta(plan)}
                      className={clsx('mt-3.5 w-full rounded-[10px] py-3 text-[14px] font-semibold cursor-pointer transition-opacity hover:opacity-90', popular ? 'text-white' : 'bg-white')}
                      style={popular ? { background: ACCENT, border: `1.5px solid ${ACCENT}` } : { border: `1.5px solid ${INK}`, color: INK }}>
                      {ctaLabel(plan)}
                    </button>
                    {!plan.isCustomPricing && <p className="mt-1.5 text-center text-[11.5px]" style={{ color: MUTED }}>{t.noCardNeeded}</p>}

                    <ul className="mt-4 list-none p-0 pt-4" style={{ borderTop: `1px solid ${LINE}` }}>
                      {prev && <li className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em]" style={{ color: MUTED }}>{t.everythingIn(copy(prev).name)}</li>}
                      {features.map(f => (
                        <li key={f.title} className="flex gap-2.5 py-[7px] text-[13.5px] leading-[1.45]">
                          <Tick />
                          <span>{f.title}</span>
                          {f.hint && <FeatureHelp text={f.hint} label={f.title} />}
                        </li>
                      ))}
                    </ul>

                    {typeof fee === 'number' && (
                      <p className="mt-auto pt-3.5 text-[12px] leading-[1.6]" style={{ color: MUTED, borderTop: `1px dashed ${LINE}` }}>
                        {t.otherGateways}<strong className="font-semibold" style={{ color: INK }}>{pct(fee)}</strong><br />
                        {isPk ? t.codAndBank : t.codAndPayments}<strong className="font-semibold" style={{ color: INK }}>0%</strong>
                      </p>
                    )}
                  </div>
                );
              })}
        </div>
        <p className="mt-6 text-center text-[13px]" style={{ color: MUTED }}>
          {local
            ? t.localNote(local.code, local.ratePerUSD.toFixed(2))
            : t.usdNote}
          <a href="#compare" className="underline underline-offset-4" style={{ color: INK }}>{t.compareAll}</a>
        </p>
      </section>

      {/* Included in every plan */}
      <section className="px-4 md:px-8 pt-20 max-w-[1240px] mx-auto">
        <p className="text-center text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>{t.everyKicker}</p>
        <h2 className="mt-2.5 mb-2 text-center text-[28px] md:text-[32px] font-semibold tracking-[-0.02em]">{t.everyTitle}</h2>
        <p className="mb-8 text-center" style={{ color: MUTED }}>{t.everySub(plans[0] ? copy(plans[0]).name : t.basicFallback)}</p>
        <ul className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3.5 list-none p-0">
          {t.everyPlan.map(({ title, body }, i) => { const Icon = EVERY_PLAN_ICONS[i] ?? Store; return (
            <li key={title} className="rounded-[14px] bg-white p-[18px]" style={{ border: `1px solid ${LINE}` }}>
              <span className="size-10 rounded-[10px] inline-flex items-center justify-center" style={{ background: '#fdf0ea', color: ACCENT }}><Icon size={20} aria-hidden /></span>
              <p className="mt-3 mb-1 text-[14.5px] font-semibold">{title}</p>
              <p className="text-[12.5px] leading-[1.55]" style={{ color: MUTED }}>{body}</p>
            </li>
          ); })}
        </ul>
      </section>

      {/* Everything else every plan includes */}
      <section className="px-4 md:px-8 pt-10 max-w-[1240px] mx-auto" aria-labelledby="also-included-h">
        <h3 id="also-included-h" className="mb-4 text-center text-[18px] font-semibold">{t.alsoTitle}</h3>
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {t.alsoIncluded.map(g => (
            <div key={g.title} className="rounded-[14px] bg-white p-[18px]" style={{ border: `1px solid ${LINE}` }}>
              <p className="mb-2 text-[14.5px] font-semibold">{g.title}</p>
              <ul className="list-none m-0 p-0">
                {g.items.map(item => (
                  <li key={item} className="flex gap-2.5 py-[5px] text-[13px] leading-[1.45]"><Tick /><span>{item}</span></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Plan picker */}
      {PICK_KEYS.some(k => plans.some(p => p.key === k)) && (
        <section className="px-4 md:px-8 pt-20 max-w-[1240px] mx-auto">
          <p className="text-center text-[13px] font-semibold uppercase tracking-[0.14em]" style={{ color: ACCENT }}>{t.pickKicker}</p>
          <h2 className="mt-2.5 mb-2 text-center text-[28px] md:text-[32px] font-semibold tracking-[-0.02em]">{t.pickTitle}</h2>
          <p className="mb-8 text-center" style={{ color: MUTED }}>{t.pickSub}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {PICK_KEYS.map(key => {
              const plan = plans.find(p => p.key === key);
              if (!plan) return null;
              const k = t.picks[key];
              return (
                <div key={key} className="flex flex-col rounded-[16px] bg-white p-[22px]" style={{ border: `1px solid ${LINE}` }}>
                  <p className="text-[16px] font-semibold leading-[1.4]">{t.quoteOpen}{k.quote}{t.quoteClose}</p>
                  <p className="mt-2 mb-4 flex-1 text-[13px] leading-[1.6]" style={{ color: MUTED }}>{k.body(plan.limits)}</p>
                  <button type="button" onClick={() => onCta(plan)} className="self-start inline-flex items-center gap-1 bg-transparent border-0 p-0 text-[14px] font-semibold cursor-pointer" style={{ color: ACCENT }}>
                    {t.pickCta(copy(plan).name, price(displayPrice(plan, 'monthly').now))} <ArrowRight size={14} className="rtl:-scale-x-100" aria-hidden />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* What each sale costs */}
      <section className="px-4 md:px-8 pt-20 max-w-[1240px] mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.1fr_1fr_1fr_1fr] items-center gap-5 rounded-[20px] bg-white p-7" style={{ border: `1px solid ${LINE}` }}>
          <h2 className="text-[21px] font-semibold leading-[1.35]">{t.eachSaleTitle}</h2>
          <div><p className="text-[26px] font-bold" style={{ color: GREEN }}>0%</p><p className="mt-1 text-[13px] leading-[1.55]" style={{ color: MUTED }}>{t.codPre}<strong style={{ color: INK }}>{t.codStrong}</strong>{t.codPost}</p></div>
          {!isPk && <div><p className="text-[26px] font-bold" style={{ color: GREEN }}>0%</p><p className="mt-1 text-[13px] leading-[1.55]" style={{ color: MUTED }}>{t.cardPre}<strong style={{ color: INK }}>{t.cardStrong}</strong>{t.cardPost}</p></div>}
          {feeRange && <div><p className="text-[26px] font-bold">{feeRange}</p><p className="mt-1 text-[13px] leading-[1.55]" style={{ color: MUTED }}>{t.gatewayPre}<strong style={{ color: INK }}>{t.gatewayStrong}</strong>{t.gatewayPost}</p></div>}
        </div>
      </section>

      {/* Compare all features */}
      <section id="compare" className="pt-20 pb-6 scroll-mt-20">
        <div className="px-4 md:px-8 max-w-[1240px] mx-auto">
          <div className="rounded-[20px] bg-white px-4 md:px-8 max-md:overflow-x-auto" style={{ border: `1px solid ${LINE}` }}>
            <div className="min-w-[760px]">
              <div className="sticky top-[72px] z-10 bg-white grid items-end gap-4 py-5" style={{ ...cols, borderBottom: `1px solid ${LINE}` }}>
                <h2 className="text-[24px] md:text-[28px] font-semibold">{t.compareAll}</h2>
                {plans.map(p => (
                  <div key={p._id}>
                    <p className="text-[20px] md:text-[22px] font-semibold mb-3">{copy(p).name}</p>
                    <button type="button" onClick={() => onCta(p)}
                      className="rounded-full px-4 py-2 text-[13px] font-semibold bg-white cursor-pointer transition-colors duration-200 hover:bg-[#1c1d1b] hover:text-white"
                      style={{ border: `1.5px solid ${INK}`, color: INK }}>{p.isCustomPricing ? t.contactSales : t.startFreeTrial}</button>
                  </div>
                ))}
              </div>
              {groups.map(g => (
                <Fragment key={g.title}>
                  <h3 className="text-[20px] md:text-[22px] font-semibold pt-10 pb-3">{g.title}</h3>
                  {g.rows.filter(r => !(isPk && r.hideOnPk)).map(r => (
                    <div key={r.label} className="grid items-center gap-4 py-4 text-[14.5px]" style={{ ...cols, borderTop: `1px solid ${LINE}` }}>
                      <span>{r.label}</span>
                      {plans.map(p => <div key={p._id} className="min-h-[24px] flex items-center"><CellView v={r.get(p)} t={t} /></div>)}
                    </div>
                  ))}
                </Fragment>
              ))}
              <div className="pb-6" />
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="px-4 md:px-8 pt-16 max-w-[900px] mx-auto">
        <h2 className="mb-6 text-center text-[28px] md:text-[32px] font-semibold tracking-[-0.02em]">{t.faqTitle}</h2>
        {faqs.map((faq, i) => {
          const isOpen = openFaq === i;
          return (
            <div key={faq.q} style={{ borderTop: `1px solid ${LINE}`, borderBottom: i === faqs.length - 1 ? `1px solid ${LINE}` : undefined }}>
              <button type="button" aria-expanded={isOpen} onClick={() => setOpenFaq(isOpen ? null : i)}
                className="w-full flex items-center justify-between gap-6 py-5 text-start bg-transparent border-0 cursor-pointer" style={{ color: INK }}>
                <span className="text-[16px] md:text-[18px] font-semibold">{faq.q}</span>
                <span className="shrink-0 size-9 rounded-full inline-flex items-center justify-center bg-white" style={{ border: `1px solid ${LINE}` }}>
                  <Plus size={18} className={clsx('transition-transform duration-300', isOpen && 'rotate-45')} />
                </span>
              </button>
              <div className="grid transition-[grid-template-rows] duration-300 ease-out" style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}>
                <div className="overflow-hidden"><p className="pb-5 text-[15px] leading-[1.7]" style={{ color: MUTED }}>{faq.a}</p></div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Closing CTA */}
      <section className="px-4 md:px-8 pt-16 pb-20 max-w-[1240px] mx-auto">
        <div className="rounded-[22px] px-6 py-11 text-center text-white" style={{ background: ACCENT }}>
          <h2 className="text-[28px] md:text-[34px] font-semibold tracking-[-0.02em]">{t.closingTitle}</h2>
          <p className="mt-2 mb-6 text-[15px] opacity-95">
            {t.closingSub(trialDays, introText)}
          </p>
          <form onSubmit={e => { e.preventDefault(); sellEntry.goWithEmail(email.trim()); }} className="mx-auto flex max-w-[520px] flex-col sm:flex-row gap-3">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder={t.emailPlaceholder} aria-label={t.emailLabel} autoComplete="email"
              className="flex-1 min-w-0 rounded-[10px] bg-white px-5 py-3.5 text-[15px] outline-none border-0" style={{ color: INK }} />
            <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-[10px] px-6 py-3.5 text-[15px] font-semibold text-white cursor-pointer border-0 hover:opacity-90" style={{ background: INK }}>
              {t.closingCta} <ArrowRight size={15} className="rtl:-scale-x-100" aria-hidden />
            </button>
          </form>
          <p className="mt-3 text-[12px] opacity-85">{t.consent}</p>
        </div>
      </section>
      <Footer />
    </div>
  );
}
