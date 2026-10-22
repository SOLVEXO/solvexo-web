/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this module registers renderers as a side effect */
import { ts } from '@/utils/tStatic';
import { useState, type FormEvent } from 'react';
import { Check, Gift, Headphones, Lock, RefreshCw, ShieldCheck, Star, Truck } from 'lucide-react';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiSubscribeNewsletter } from '@/api/services/newsletter';
import { renderRichText } from '@/utils/richText';
import { PreviewBlock } from '../../previewInspector';
import { copyText, showEyebrow } from '../../sectionCopy';
import { imageFit } from '../../imageFit';
import { fashionTheme as t, type FashionColors } from '../theme.config';
import { registerFashionSection } from './sectionRegistry';
import { LinkButton, SectionShell } from './SectionShell';

const bid = (b: Block, i: number) => b._id ?? String(i);

// ── Image with text ───────────────────────────────────────────────────────────
registerFashionSection('image_with_text', (section, blocks, colors) => {
  const pairs = blocks.filter(b => b.type === 'image_text_pair');
  if (pairs.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={section.settings.heading}>
      <div className="flex flex-col gap-16 md:gap-24">
        {pairs.map((b, i) => {
          const s = b.settings;
          const right = s.imagePosition === 'right';
          const fit = imageFit(s.imageRatio, '4 / 5', s.focalPoint);
          const eyebrow = showEyebrow(s) && typeof s.eyebrow === 'string' && s.eyebrow.trim() ? s.eyebrow : '';
          return (
            <PreviewBlock key={bid(b, i)} blockId={bid(b, i)}>
              <div className={`grid items-center gap-8 md:grid-cols-2 md:gap-16 ${right ? 'md:[&>*:first-child]:order-2' : ''}`}>
                <div className="overflow-hidden" style={{ ...fit.box, background: colors.bgAlt, borderRadius: t.imageRadiusPx }}>
                  {s.imageUrl && <img src={s.imageUrl} alt={s.heading ?? ''} loading="lazy" style={fit.img} />}
                </div>
                <div className="max-w-[480px]">
                  {eyebrow && <p className="m-0 mb-3 text-sm font-medium" style={{ color: colors.inkMuted, fontFamily: t.fonts.body }}>{eyebrow}</p>}
                  {s.heading && <h3 className="m-0 mb-5 text-[clamp(28px,3.2vw,42px)] leading-[1.1]" style={{ fontFamily: t.fonts.display, fontWeight: t.headingWeight }}>{s.heading}</h3>}
                  {s.body && <div className="mb-8 text-[15px] leading-[1.8]" style={{ color: colors.inkMuted }}>{renderRichText(s.body)}</div>}
                  <LinkButton text={s.ctaText} link={s.ctaLink ?? { linkType: 'home' }} variant="outline" />
                </div>
              </div>
            </PreviewBlock>
          );
        })}
      </div>
    </SectionShell>
  );
});

// ── Rich text ─────────────────────────────────────────────────────────────────
registerFashionSection('rich_text', (section, blocks, colors, dynamic) => {
  const s = section.settings;
  const align = s.alignment === 'center' || s.alignment === 'right' ? s.alignment : 'left';
  const heading = (s.dynamicSourceKey && dynamic[s.dynamicSourceKey]) || s.heading;
  return (
    <SectionShell colors={colors}>
      <div className="mx-auto max-w-[760px]" style={{ textAlign: align }}>
        {heading && <h2 className="m-0 mb-6 text-[clamp(28px,3.4vw,44px)] leading-[1.12]" style={{ fontFamily: t.fonts.display, fontWeight: t.headingWeight }}>{heading}</h2>}
        {blocks.map((b, i) => {
          const bs = b.settings;
          const text = (bs.dynamicSourceKey && dynamic[bs.dynamicSourceKey]) || bs.text;
          let node = null;
          if (b.type === 'heading') {
            // Large / Medium (default) / Small — the seller's "Size" choice.
            const Tag = bs.level === 'h2' ? 'h2' : bs.level === 'h4' ? 'h4' : 'h3';
            const size = Tag === 'h2' ? 'text-4xl' : Tag === 'h4' ? 'text-xl' : 'text-2xl';
            node = <Tag className={`m-0 mt-8 mb-3 ${size}`} style={{ fontFamily: t.fonts.display, fontWeight: 500 }}>{text}</Tag>;
          }
          else if (b.type === 'paragraph') node = <div className="mb-4 text-base leading-[1.85]" style={{ color: colors.inkMuted }}>{renderRichText(text)}</div>;
          else if (b.type === 'quote') node = (
            <blockquote className="my-8 border-l-2 pl-6 text-xl italic" style={{ fontFamily: t.fonts.display, borderColor: colors.ink }}>
              {text}
              {bs.author && <footer className="mt-3 text-sm not-italic" style={{ fontFamily: t.fonts.body, color: colors.inkMuted }}>— {bs.author}</footer>}
            </blockquote>
          );
          else if (b.type === 'image' && bs.imageUrl) node = (
            <figure className="m-0 my-6">
              <img src={bs.imageUrl} alt={bs.alt ?? ''} loading="lazy" className="h-auto w-full" />
              {bs.caption && <figcaption className="mt-2 text-center text-sm" style={{ color: colors.inkMuted }}>{bs.caption}</figcaption>}
            </figure>
          );
          else if (b.type === 'list') {
            const items: string[] = Array.isArray(bs.items) ? (bs.items as string[]) : String(text ?? '').split('\n').filter(Boolean);
            const List = bs.style === 'numbered' ? 'ol' : 'ul';
            node = <List className={`my-4 pl-6 leading-[1.85] ${List === 'ol' ? 'list-decimal' : 'list-disc'}`} style={{ color: colors.inkMuted }}>{items.map((x, k) => <li key={k}>{x}</li>)}</List>;
          } else if (b.type === 'divider') node = <hr className="my-8 border-0 border-t" style={{ borderColor: colors.border }} />;
          return node ? <PreviewBlock key={bid(b, i)} blockId={bid(b, i)}>{node}</PreviewBlock> : null;
        })}
      </div>
    </SectionShell>
  );
});

// ── Testimonials ──────────────────────────────────────────────────────────────
registerFashionSection('testimonials', (section, blocks, colors) => {
  const items = blocks.filter(b => b.type === 'testimonial');
  if (items.length === 0) return null;
  return (
    <SectionShell colors={colors} heading={section.settings.heading} align="center">
      <ul className="m-0 grid list-none gap-6 p-0 md:grid-cols-3">
        {items.map((b, i) => {
          const s = b.settings;
          const rating = Math.min(5, Math.max(0, Number(s.rating) || 0));
          return (
            <li key={bid(b, i)}>
              <PreviewBlock blockId={bid(b, i)}>
                <figure className="m-0 flex h-full flex-col gap-5 p-8" style={{ background: colors.bgAlt }}>
                  {rating > 0 && <div className="flex gap-0.5" aria-label={ts('reviews.outOf5', '{{value}} out of 5 stars', { value: rating })}>{Array.from({ length: 5 }).map((_, k) => <Star key={k} size={15} fill={k < rating ? colors.ink : 'none'} stroke={colors.ink} />)}</div>}
                  <blockquote className="m-0 flex-1 text-[19px] leading-[1.5]" style={{ fontFamily: t.fonts.display }}>“{s.quote}”</blockquote>
                  <figcaption className="flex items-center gap-3 text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: colors.inkMuted }}>
                    {s.avatarUrl && <img src={s.avatarUrl} alt="" loading="lazy" className="h-9 w-9 shrink-0 rounded-full object-cover" />}
                    <span>{s.authorName}{(s.authorRole || s.role) ? ` · ${s.authorRole || s.role}` : ''}</span>
                  </figcaption>
                </figure>
              </PreviewBlock>
            </li>
          );
        })}
      </ul>
    </SectionShell>
  );
});

// ── Trust badges ──────────────────────────────────────────────────────────────
const ICONS: Record<string, typeof Truck> = { truck: Truck, shipping: Truck, shield: ShieldCheck, secure: ShieldCheck, refresh: RefreshCw, returns: RefreshCw, headphones: Headphones, headset: Headphones, support: Headphones, lock: Lock, gift: Gift, star: Star };

registerFashionSection('trust_badges', (_section, blocks, colors) => {
  const items = blocks.filter(b => b.type === 'trust_badge_item' && b.settings.text);
  if (items.length === 0) return null;
  return (
    <section style={{ padding: `32px ${t.layout.containerPadX}`, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}`, background: colors.bg }}>
      <ul className="mx-auto m-0 grid list-none grid-cols-2 gap-6 p-0 md:grid-cols-4" style={{ maxWidth: t.layout.maxWidth }}>
        {items.map((b, i) => {
          const Icon = ICONS[String(b.settings.icon)] ?? Check;
          return (
            <li key={bid(b, i)}><PreviewBlock blockId={bid(b, i)}>
              <div className="flex items-center justify-center gap-3 text-[12px] font-semibold uppercase tracking-[0.12em] md:justify-start"><Icon size={20} strokeWidth={1.5} />{b.settings.text}</div>
            </PreviewBlock></li>
          );
        })}
      </ul>
    </section>
  );
});

// ── Newsletter ────────────────────────────────────────────────────────────────
function Newsletter({ settings: s, colors }: { settings: Record<string, any>; colors: FashionColors }) {
  const { store } = useStorefront();
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || state === 'loading') return;
    setState('loading');
    try {
      const res = await apiSubscribeNewsletter(email.trim(), { storeId: store.storeId, source: 'store_section' });
      setMessage(res.data?.pendingConfirmation ? (res.message || ts('pg.almost_done_check_your_inbox_to_confirm', 'Almost done - check your inbox to confirm.')) : copyText(s, 'successMessage', "Thank you — you're subscribed."));
      setState('done');
    } catch { setState('error'); }
  };
  return (
    <section style={{ background: colors.bgAlt, padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto max-w-[620px] text-center">
        {showEyebrow(s) && <p className="m-0 mb-3 text-[11px] font-semibold uppercase tracking-[0.2em]" style={{ color: colors.inkMuted }}>{copyText(s, 'eyebrow', 'Private notes')}</p>}
        <h2 className="m-0 mb-4 text-[clamp(28px,3.6vw,44px)] leading-[1.1]" style={{ fontFamily: t.fonts.display, fontWeight: t.headingWeight }}>{s.heading || ts('pg.stay_in_the_loop', 'Stay in the loop')}</h2>
        {s.subtext && <p className="m-0 mb-8 text-[15px] leading-[1.7]" style={{ color: colors.inkMuted }}>{s.subtext}</p>}
        {state === 'done' ? <p role="status" className="m-0 text-[15px]" style={{ color: t.colors.success }}>{message}</p> : (
          <form onSubmit={submit} className="mt-8 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="fx-nl" className="sr-only">{ts('auth.email', 'Email')}</label>
            <input id="fx-nl" type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder={copyText(s, 'placeholder', 'Your email')}
              className="min-w-0 flex-1 bg-transparent px-4 py-3.5 text-sm outline-none" style={{ border: `1px solid ${colors.ink}`, color: colors.ink, borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body }} />
            <button type="submit" disabled={state === 'loading'} className="cursor-pointer px-8 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] disabled:opacity-60"
              style={{ background: colors.ink, color: colors.bg, border: `1px solid ${colors.ink}`, borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body }}>
              {state === 'loading' ? ts('pg.word_subscribing', 'Subscribing…') : copyText(s, 'buttonLabel', 'Subscribe')}
            </button>
          </form>
        )}
        {state === 'error' && <p role="alert" className="mt-3 text-xs" style={{ color: t.colors.danger }}>{ts('pg.something_went_wrong_please_try_again', 'Something went wrong. Please try again.')}</p>}
      </div>
    </section>
  );
}
registerFashionSection('newsletter', (section, _b, colors) => <Newsletter settings={section.settings} colors={colors} />);
