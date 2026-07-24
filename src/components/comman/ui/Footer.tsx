import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  ShieldCheck, Lock, BadgeCheck, CreditCard, Banknote,
  Truck, Store, ChevronDown, Send, Check,
} from 'lucide-react';
import { SolvexoLogo } from './SolvexoLogo';
import { apiSubscribeNewsletter } from '../../../api/services/newsletter';

interface FooterLink {
  label: string;
  path?: string; // omit for links to pages that don't exist yet (rendered inert)
}

const FOOTER_COLUMNS: { heading: string; links: FooterLink[] }[] = [
  {
    heading: 'Shop',
    links: [
      { label: 'Marketplace', path: '/marketplace' },
      { label: 'Education',   path: '/EducationMarketplace' },
      { label: 'My Orders',   path: '/account/orders' },
      { label: 'Wishlist',    path: '/account/wishlist' },
    ],
  },
  {
    heading: 'Sell',
    links: [
      { label: 'Start Selling', path: '/onboard' },
      { label: 'Pricing',       path: '/pricing' },
      { label: 'For Sellers',   path: '/sellers' },
    ],
  },
  {
    heading: 'Support',
    links: [
      { label: 'FAQ',              path: '/faq' },
      { label: 'Contact Us',       path: '/contact-us' },
      { label: 'Shipping Info' },
      { label: 'Returns & Refunds' },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { label: 'Privacy Policy', path: '/privacy-policy' },
      { label: 'Terms of Service', path: '/terms-of-service' },
      { label: 'Cookie Policy', path: '/cookie-policy' },
    ],
  },
];

const PAYMENT_METHODS = [
  { label: 'Card',    Icon: CreditCard },
  { label: 'COD',     Icon: Banknote   },
];

const SHIPPING_CAPABILITIES = [
  { label: 'Nationwide Delivery', Icon: Truck },
  { label: 'Store Pickup',        Icon: Store },
];

const SECURITY_BADGES = [
  { label: 'SSL Secured',       Icon: Lock },
  { label: 'Secure Checkout',   Icon: ShieldCheck },
  { label: 'Verified Sellers',  Icon: BadgeCheck },
];

const CURRENCIES = ['USD $', 'PKR ₨', 'EUR €'];

/* ── Minimal inline social glyphs — abstract, not brand logo assets ─────────── */
function FacebookGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}
function InstagramGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}
function XGlyph() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}
function LinkedinGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
      <path d="M10 21v-7a3 3 0 0 1 6 0v7M13 12v9" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'Facebook',  Glyph: FacebookGlyph },
  { label: 'Instagram', Glyph: InstagramGlyph },
  { label: 'X',         Glyph: XGlyph },
  { label: 'LinkedIn',  Glyph: LinkedinGlyph },
];

function PillSelector({ options }: { options: string[] }) {
  const [open, setOpen]     = useState(false);
  const [value, setValue]   = useState(options[0]);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-[6px] px-3 py-[7px] rounded-lg border border-white/15 bg-white/[0.04] text-[12px] text-white/85 cursor-pointer hover:bg-white/[0.08] transition-colors"
      >
        {value}
        <ChevronDown size={12} className={clsx('transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute bottom-[calc(100%+6px)] left-0 w-[160px] bg-charcoal border border-white/15 rounded-lg overflow-hidden z-10">
          {options.map(o => (
            <button
              key={o}
              onClick={() => { setValue(o); setOpen(false); }}
              className="w-full flex items-center justify-between px-3 py-[8px] text-[12px] text-white/85 hover:bg-white/[0.06] cursor-pointer bg-transparent border-none text-left"
            >
              {o}
              {o === value && <Check size={12} className="text-brand-orange" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Newsletter() {
  const [email, setEmail]     = useState('');
  const [subscribed, setSub]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiSubscribeNewsletter(email.trim());
      setSub(true);
      void res;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (subscribed) {
    return (
      <div className="flex items-center gap-2 text-[12.5px] text-white bg-white/[0.06] border border-white/15 rounded-lg px-3.5 py-[10px]">
        <Check size={14} className="text-brand-orange shrink-0" />
        You're subscribed — welcome aboard!
      </div>
    );
  }

  return (
    <div className="max-w-[360px]">
      <form onSubmit={submit} className="flex items-stretch gap-2">
        <input
          value={email}
          onChange={e => setEmail(e.target.value)}
          type="email"
          required
          placeholder="Your email address"
          aria-label="Email address"
          disabled={loading}
          className="flex-1 min-w-0 px-3.5 py-[10px] rounded-lg border border-white/15 bg-white/[0.04] text-[12.5px] text-white placeholder:text-[#8B8985] outline-none focus:border-brand-orange transition-colors disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-[6px] px-4 rounded-lg bg-brand-orange text-white text-[12.5px] font-semibold border-none cursor-pointer hover:bg-brand-deep-orange transition-colors shrink-0 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          <Send size={13} /> <span className="hidden sm:inline">{loading ? 'Subscribing…' : 'Subscribe'}</span>
        </button>
      </form>
      {error && <p className="mt-1.5 text-[11.5px] text-red-400">{error}</p>}
    </div>
  );
}

export function Footer() {
  const navigate = useNavigate();

  return (
    <footer className="bg-carbon text-[#B0AEA8]">

      {/* ── Newsletter ─────────────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 bg-gradient-to-r from-white/[0.03] to-transparent">
        <div className="px-4 sm:px-6 lg:px-12 py-8 sm:py-9 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div>
            <p className="font-serif text-[17px] sm:text-[19px] font-bold text-white leading-tight">Get deals before anyone else</p>
            <p className="text-[12.5px] text-[#8B8985] mt-[6px]">Sign up for exclusive offers, new arrivals and price-drop alerts.</p>
          </div>
          <Newsletter />
        </div>
      </div>

      {/* ── Link columns ─────────────────────────────────────────────────────── */}
      <div className="px-4 sm:px-6 lg:px-12 py-10 sm:py-12 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-6 gap-y-8">
        <div className="col-span-2 sm:col-span-3 lg:col-span-1">
          <SolvexoLogo size={26} variant="light" />
          <p className="text-[12px] mt-3 leading-relaxed max-w-[240px]">
            The commerce OS for sellers, creators and educators — one marketplace for physical goods, digital downloads and learning resources.
          </p>
          <div className="flex items-center gap-2 mt-4">
            {SOCIALS.map(({ label, Glyph }) => (
              <button
                key={label}
                aria-label={label}
                title={label}
                className="w-8 h-8 rounded-full border border-white/15 bg-white/[0.04] flex items-center justify-center text-[#B0AEA8] hover:text-white hover:border-white/30 hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Glyph />
              </button>
            ))}
          </div>
        </div>

        {FOOTER_COLUMNS.map(col => (
          <div key={col.heading}>
            <p className="relative inline-block text-[11px] font-bold text-white uppercase tracking-[0.08em] mb-4 pb-2">
              {col.heading}
              <span className="absolute left-0 bottom-0 w-5 h-[2px] rounded-full bg-brand-orange" />
            </p>
            <ul className="flex flex-col gap-[11px]">
              {col.links.map(link => (
                <li key={link.label}>
                  {link.path ? (
                    <button
                      onClick={() => navigate(link.path!)}
                      className="group inline-flex items-center gap-[6px] text-[12px] text-[#B0AEA8] hover:text-white transition-colors bg-transparent border-none p-0 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40 rounded-sm"
                    >
                      <span className="w-0 group-hover:w-[6px] h-px bg-brand-orange transition-all duration-200 overflow-hidden" />
                      {link.label}
                    </button>
                  ) : (
                    <span className="text-[12px] text-[#6E6C68] cursor-default">{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* ── Trust row: payments, shipping, security ─────────────────────────── */}
      <div className="border-t border-white/10 bg-black/[0.15]">
        <div className="px-4 sm:px-6 lg:px-12 py-6">
          <p className="text-[10px] font-bold text-[#8B8985] uppercase tracking-[0.1em] mb-3">Trusted &amp; Secure Shopping</p>
          <div className="flex flex-wrap items-center gap-2.5">
            {[...PAYMENT_METHODS, ...SHIPPING_CAPABILITIES, ...SECURITY_BADGES].map(({ label, Icon }) => (
              <div
                key={label}
                className="flex items-center gap-[7px] text-[11.5px] font-medium text-[#C9C7C2] bg-white/[0.04] border border-white/10 rounded-full pl-3 pr-3.5 py-[7px] transition-colors hover:bg-white/[0.08] hover:border-white/20 hover:text-white cursor-default"
              >
                <Icon size={13} className="text-brand-orange shrink-0" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ───────────────────────────────────────────────────────── */}
      <div className="border-t border-white/10 px-4 sm:px-6 lg:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px]">© {new Date().getFullYear()} Solvexo. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <PillSelector options={CURRENCIES} />
        </div>
      </div>
    </footer>
  );
}
