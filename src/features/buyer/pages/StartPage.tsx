import { useEffect, useState, type FormEvent } from 'react';
import { useLocation } from 'react-router-dom';
import { ArrowRight, Banknote, Boxes, Check, MessageCircle, PhoneCall, ScanBarcode, Share2, Store, Truck } from 'lucide-react';
import { Footer } from '@/components/comman/ui/Footer';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { apiBrowsePlatformPlans, apiGetPublicTrialSettings, type PlatformPlan } from '@/api/services/platformPlans';
import { apiChatConfig, apiDemoRequest } from '@/api/services/salesOps';
import { campaignTags } from '@/utils/campaignTags';
import { getPartnerCode } from '@/utils/sellerAcquisitionAttribution';
import { whatsappHref } from '@/utils/whatsapp';
import { displayPrice, money } from './pricing/planFeatures';
import { formatLocal, useLocalCurrency } from './pricing/localPrice';

const WHATSAPP_TEXT = 'Assalam o Alaikum, I want to start my online store on Solvexo.';

const STEPS = [
  { title: 'Create your account', ur: 'اکاؤنٹ بنائیں', body: 'Sign up with Google in one tap. No card needed.' },
  { title: 'Add your products', ur: 'اپنی چیزیں شامل کریں', body: 'Take photos on your phone, add a price, done.' },
  { title: 'Share your store link', ur: 'لنک شیئر کریں', body: 'Post it on WhatsApp, Facebook and Instagram and take orders.' },
];

const FEATURES = [
  { Icon: Store, title: 'Your own online store', body: 'Your shop name, your products, your own web link.' },
  { Icon: Banknote, title: 'Cash on delivery', body: 'Take COD and card payments at checkout.' },
  { Icon: Truck, title: 'Delivery charges by city', body: 'Set delivery areas and charges once.' },
  { Icon: ScanBarcode, title: 'POS for your shop counter', body: 'Sell in the shop from a phone or tablet.' },
  { Icon: Boxes, title: 'One stock list', body: 'Shop and online sales take stock from the same count.' },
  { Icon: Share2, title: 'Easy to share', body: 'Send your store link to customers in seconds.' },
];

const FAQ = [
  { q: 'Do I need a website or a developer?', a: 'No. Solvexo gives you a ready-made store you set up from your phone.' },
  { q: 'Can customers pay cash on delivery?', a: 'Yes. Cash on delivery and card payments are both available at checkout.' },
  { q: 'Do I need a card to start?', a: 'No. Every new store starts with a free trial and no card is needed.' },
  { q: 'Is there help in Urdu?', a: 'You can message us in Urdu or English, and every chapter of the user manuals has an Urdu summary.' },
];

/**
 * www.solvexo.store/start (and /pk/start) — the landing page for paid social ads. Phone-first, Urdu + English,
 * prices in the visitor's currency, one sign-up button, a WhatsApp button when Solvexo's WhatsApp line is connected,
 * and a call-back form that lands in the sales pipeline. Kept out of search results (ads only).
 */
export function StartPage() {
  const sellEntry = useSellEntry();
  const { search } = useLocation();
  const local = useLocalCurrency();
  const [plans, setPlans] = useState<PlatformPlan[]>([]);
  const [trialDays, setTrialDays] = useState<number | null>(null);
  const [whatsapp, setWhatsapp] = useState<string | null>(null);

  useEffect(() => {
    apiBrowsePlatformPlans().then(r => setPlans(r.data ?? [])).catch(() => {});
    apiGetPublicTrialSettings().then(r => setTrialDays(r.data.durationDays)).catch(() => {});
    apiChatConfig().then(r => setWhatsapp(r.data.whatsappNumber ?? null)).catch(() => {});
  }, []);

  const price = (usd: number) => (local ? formatLocal(usd, local) : `US${money(usd)}`);
  const cheapest = plans.filter(p => !p.isFree && !p.isCustomPricing && (p.monthlyPriceUSD ?? 0) > 0)
    .sort((a, b) => (a.monthlyPriceUSD ?? 0) - (b.monthlyPriceUSD ?? 0))[0];
  const intro = plans.find(p => p.introOfferEnabled && p.introPriceUSD != null && p.introDurationCycles != null);
  const from = cheapest ? displayPrice(cheapest, 'monthly') : null;
  const days = trialDays ?? 7;
  const waHref = whatsapp ? whatsappHref(whatsapp, WHATSAPP_TEXT) : null;

  const startButton = (
    <button type="button" onClick={sellEntry.go}
      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-orange px-6 py-4 text-[16px] font-semibold text-white border-0 cursor-pointer hover:opacity-90">
      Start free for {days} days <ArrowRight size={18} aria-hidden />
    </button>
  );

  return (
    <div className="bg-[#faf9f5] min-h-full text-[#1c1d1b]">
      {/* Hero */}
      <section className="px-4 pt-8 sm:pt-14 pb-10 max-w-[720px] mx-auto text-center">
        <p className="inline-flex items-center gap-2 rounded-full bg-[#eaf6ec] px-3 py-1 text-[12.5px] font-semibold text-[#2f7d3c]">
          <Check size={14} aria-hidden /> {days}-day free trial · No card needed
        </p>
        <h1 className="mt-5 text-[32px] sm:text-[44px] font-semibold leading-[1.15] tracking-[-0.03em]">Take your shop online</h1>
        <p dir="rtl" lang="ur" className="mt-2 text-[24px] sm:text-[28px] leading-[1.9] text-brand-orange" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>
          اپنی دکان آن لائن لے آئیں
        </p>
        <p className="mt-3 text-[16px] leading-[1.65] text-[#5f5d58]">
          Your own online store with cash on delivery, plus a POS for your shop counter. Orders, stock and bills in one place.
        </p>
        {from && (
          <p className="mt-4 text-[15px]">
            Plans from <strong className="text-[18px]">{price(from.now)}</strong> a month
            {from.was != null && <> <s className="text-[#9a988f]">{price(from.was)}</s> <span className="font-semibold text-[#2f7d3c]">{from.percentOff}% off</span></>}
            {intro && <span className="block text-[13.5px] text-[#5f5d58] mt-1">First {intro.introDurationCycles} months: {price(intro.introPriceUSD!)} a month</span>}
          </p>
        )}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {startButton}
          {waHref && (
            <a href={waHref} target="_blank" rel="noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[#25d366] bg-white px-6 py-[14px] text-[16px] font-semibold text-[#128c4a] hover:bg-[#f1fbf4]">
              <MessageCircle size={18} aria-hidden /> Ask on WhatsApp
            </a>
          )}
        </div>
      </section>

      {/* 3 steps */}
      <section className="px-4 pb-12 max-w-[960px] mx-auto">
        <h2 className="text-center text-[22px] font-semibold">Live in 3 steps</h2>
        <ol className="mt-5 grid sm:grid-cols-3 gap-3 list-none p-0">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl bg-white border border-[#e9e6dc] p-5">
              <span className="inline-flex size-8 items-center justify-center rounded-full bg-[#fdf0ea] text-brand-orange font-bold">{i + 1}</span>
              <p className="mt-3 font-semibold">{s.title}</p>
              <p dir="rtl" lang="ur" className="text-[16px] leading-[1.9] text-[#7a3f2a]" style={{ fontFamily: "'Noto Nastaliq Urdu', serif" }}>{s.ur}</p>
              <p className="mt-1 text-[14px] text-[#5f5d58]">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* What you get */}
      <section className="px-4 pb-12 max-w-[960px] mx-auto">
        <h2 className="text-center text-[22px] font-semibold">Everything you need to sell</h2>
        <ul className="mt-5 grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-3 list-none p-0">
          {FEATURES.map(({ Icon, title, body }) => (
            <li key={title} className="flex gap-3 rounded-2xl bg-white border border-[#e9e6dc] p-4">
              <span className="size-10 shrink-0 rounded-xl bg-[#fdf0ea] text-brand-orange inline-flex items-center justify-center"><Icon size={20} aria-hidden /></span>
              <span><span className="block font-semibold">{title}</span><span className="text-[13.5px] text-[#5f5d58]">{body}</span></span>
            </li>
          ))}
        </ul>
        <p className="mt-5 text-center text-[14px]">
          <a href="/pricing" className="font-semibold text-brand-orange hover:underline">See all plans and prices</a>
        </p>
      </section>

      {/* Call back */}
      <section className="px-4 pb-12 max-w-[560px] mx-auto">
        <CallBackForm search={search} />
      </section>

      {/* FAQ */}
      <section className="px-4 pb-16 max-w-[720px] mx-auto">
        <h2 className="text-center text-[22px] font-semibold">Questions</h2>
        <div className="mt-4 divide-y divide-[#e9e6dc] border-y border-[#e9e6dc]">
          {FAQ.map(f => (
            <details key={f.q} className="py-3">
              <summary className="cursor-pointer font-semibold text-[15px]">{f.q}</summary>
              <p className="mt-2 text-[14px] text-[#5f5d58]">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">{startButton}</div>
      </section>

      {/* Sticky action bar on phones */}
      <div className="sm:hidden fixed inset-x-0 bottom-0 z-40 border-t border-[#e9e6dc] bg-white/95 backdrop-blur px-4 pt-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="flex gap-2">
          <button type="button" onClick={sellEntry.go} className="flex-1 rounded-xl bg-brand-orange py-3 text-[15px] font-semibold text-white border-0 cursor-pointer">
            Start free
          </button>
          {waHref && (
            <a href={waHref} target="_blank" rel="noreferrer" aria-label="Ask on WhatsApp"
              className="inline-flex items-center justify-center rounded-xl border-2 border-[#25d366] px-4 text-[#128c4a]">
              <MessageCircle size={20} aria-hidden />
            </a>
          )}
        </div>
      </div>
      <div className="sm:hidden h-20" aria-hidden />
      <Footer />
    </div>
  );
}

function CallBackForm({ search }: { search: string }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError('Enter your name.'); return; }
    if (phone.replace(/\D/g, '').length < 10) { setError('Enter your mobile number, for example 0300 1234567.'); return; }
    setError(''); setState('sending');
    try {
      await apiDemoRequest({
        name: name.trim(), phone: phone.trim(), city: city.trim() || undefined,
        message: 'Asked for a call back from the ad landing page.',
        page: '/start', ...campaignTags(search), partnerCode: getPartnerCode() ?? undefined,
      });
      setState('sent');
    } catch {
      setState('error');
      setError('Could not send. Please try again, or start free above.');
    }
  };

  if (state === 'sent') {
    return (
      <div className="rounded-2xl bg-white border border-[#e9e6dc] p-6 text-center">
        <PhoneCall size={24} className="mx-auto text-[#2f7d3c]" aria-hidden />
        <p className="mt-2 font-semibold">Thank you, {name.trim().split(' ')[0]}.</p>
        <p className="mt-1 text-[14px] text-[#5f5d58]">Our team will call you soon to help set up your store.</p>
      </div>
    );
  }
  return (
    <form onSubmit={submit} className="rounded-2xl bg-white border border-[#e9e6dc] p-6" noValidate>
      <h2 className="text-[20px] font-semibold">Want help setting up?</h2>
      <p className="mt-1 text-[14px] text-[#5f5d58]">Leave your number and our team will call you to set up your store with you.</p>
      <div className="mt-4 grid gap-3">
        <label className="grid gap-1 text-[13px] font-medium" htmlFor="cb-name">Your name
          <input id="cb-name" value={name} onChange={e => setName(e.target.value)} autoComplete="name"
            className="rounded-xl border border-[#d9d5ca] px-4 py-3 text-[15px] font-normal outline-none focus:border-brand-orange" />
        </label>
        <label className="grid gap-1 text-[13px] font-medium" htmlFor="cb-phone">Mobile number
          <input id="cb-phone" value={phone} onChange={e => setPhone(e.target.value)} inputMode="tel" autoComplete="tel" placeholder="0300 1234567"
            className="rounded-xl border border-[#d9d5ca] px-4 py-3 text-[15px] font-normal outline-none focus:border-brand-orange" />
        </label>
        <label className="grid gap-1 text-[13px] font-medium" htmlFor="cb-city">City (optional)
          <input id="cb-city" value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" placeholder="Karachi"
            className="rounded-xl border border-[#d9d5ca] px-4 py-3 text-[15px] font-normal outline-none focus:border-brand-orange" />
        </label>
      </div>
      {error && <p role="alert" className="mt-3 text-[13.5px] text-[#b42318]">{error}</p>}
      <button type="submit" disabled={state === 'sending'}
        className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#1c1d1b] py-3.5 text-[15px] font-semibold text-white border-0 cursor-pointer disabled:opacity-60">
        <PhoneCall size={17} aria-hidden /> {state === 'sending' ? 'Sending…' : 'Call me back'}
      </button>
    </form>
  );
}
