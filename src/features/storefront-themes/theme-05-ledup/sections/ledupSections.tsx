/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON; this file registers renderers, it exports none */
import { useState } from 'react';
import { Download, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { renderRichText } from '@/utils/richText';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { featureIcon } from '../../featureIcons';
import { PreviewBlock } from '../../previewInspector';
import { LedupHeroCategoryBanner } from '../components/LedupHeroCategoryBanner';
import { LedupBox } from '../ui/ledupUi';
import { baseTheme as t } from '../theme.base';
import { registerLedupSection } from './ledupSectionRegistry';
import { Bento, LinkOrDiv, Projects, Simulation, Stacked, Statement } from './ledupSignature';
import { Collage, ContactReveal, Districts, Mission, TimelineCarousel } from './ledupSignature2';

const text = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : '');

/** Seller's own "link" setting -> an in-app or external anchor. */
function Cta({ label, link, className }: { label?: string; link?: any; className: string }) {
  const { resolveLink } = useStorefront();
  if (!label || !link) return null;
  const target = resolveLink(link);
  if (target.to) return <Link to={target.to} className={className}>{label} <ArrowUpRight size={14} aria-hidden /></Link>;
  return <a href={target.href ?? '#'} className={className} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{label} <ArrowUpRight size={14} aria-hidden /></a>;
}

const solidCta = 'inline-flex items-center gap-2 rounded-full bg-[var(--ld-accent)] px-6 py-3 text-sm font-medium text-white no-underline transition hover:bg-[var(--ld-accent-hover)]';

// ── Rich text ───────────────────────────────────────────────────────────────
function RichText({ settings, blocks, dynamic }: { settings: Record<string, any>; blocks: Block[]; dynamic: Record<string, string> }) {
  const align = settings.alignment === 'center' || settings.alignment === 'right' ? settings.alignment : 'left';
  const heading = (settings.dynamicSourceKey && dynamic[settings.dynamicSourceKey]) || text(settings.heading);
  const parts = blocks.map((b, i) => {
    const bs = (b.settings ?? {}) as Record<string, any>;
    const body = String((bs.dynamicSourceKey && dynamic[bs.dynamicSourceKey]) || bs.text || '');
    if (!body) return null;
    const id = String(b._id ?? i);
    if (b.type === 'heading') {
      const Tag = bs.level === 'h2' ? 'h2' : bs.level === 'h4' ? 'h4' : 'h3';
      return <PreviewBlock key={id} blockId={id}><Tag className="m-0 mt-4 text-2xl font-bold text-stone-900">{body}</Tag></PreviewBlock>;
    }
    if (b.type === 'paragraph' || b.type === 'text') {
      return <PreviewBlock key={id} blockId={id}><p className="m-0 whitespace-pre-line text-base leading-8 text-stone-600">{renderRichText(body)}</p></PreviewBlock>;
    }
    if (b.type === 'button') return <PreviewBlock key={id} blockId={id}><div><Cta label={text(bs.label) || body} link={bs.link} className={solidCta} /></div></PreviewBlock>;
    return null;
  }).filter(Boolean);
  const intro = text(settings.text);
  if (!heading && !intro && parts.length === 0) return null;
  return (
    <section className="border-y border-stone-100 bg-white py-16">
      <LedupBox narrow padY={false}>
        <div className="flex flex-col gap-4" style={{ textAlign: align }}>
          {heading && <h2 className="m-0 text-3xl font-light tracking-tight text-stone-900 md:text-4xl" style={{ fontFamily: t.fonts.display }}>{heading}</h2>}
          {intro && <p className="m-0 whitespace-pre-line text-base leading-8 text-stone-600">{renderRichText(intro)}</p>}
          {parts}
        </div>
      </LedupBox>
    </section>
  );
}

// ── Feature list / highlights ───────────────────────────────────────────────
function FeatureList({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  if (blocks.length === 0) return null;
  const heading = text(settings.heading);
  const eyebrow = text(settings.eyebrow);
  return (
    <section className="bg-[#F9F8F6] py-16">
      <LedupBox padY={false}>
        {(heading || eyebrow) && (
          <div className="mx-auto mb-10 max-w-2xl text-center">
            {eyebrow && <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ld-accent)]">{eyebrow}</span>}
            {heading && <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 md:text-4xl" style={{ fontFamily: t.fonts.display }}>{heading}</h2>}
            {text(settings.text) && <p className="mt-3 text-sm leading-relaxed text-stone-600">{text(settings.text)}</p>}
          </div>
        )}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const Icon = featureIcon(s.icon);
            const id = String(b._id ?? i);
            return (
              <PreviewBlock key={id} blockId={id}>
                <div className="h-full rounded-3xl border border-stone-200/60 bg-white p-8 shadow-sm transition hover:shadow-md">
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--ld-accent)]/10 text-[var(--ld-accent)]"><Icon size={24} aria-hidden /></div>
                  {text(s.title) && <h3 className="mb-2 text-lg font-bold text-stone-900">{s.title}</h3>}
                  {text(s.description) && <p className="mb-4 text-sm leading-relaxed text-stone-500">{renderRichText(s.description)}</p>}
                  <Cta label={text(s.linkText)} link={s.link} className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--ld-accent)] no-underline hover:underline" />
                </div>
              </PreviewBlock>
            );
          })}
        </div>
      </LedupBox>
    </section>
  );
}

// ── Photo switcher: one big photo with toggle buttons ──
function Switcher({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const [on, setOn] = useState(0);
  if (blocks.length === 0) return null;
  const cur = Math.min(on, blocks.length - 1);
  return (
    <section className="lds" style={{ padding: '40px 0' }}>
      <div className="lds-sim-frame" style={{ borderRadius: 50 }}>
        <div className="lds-sim-scene" style={{ width: '100%', borderRadius: 0, aspectRatio: '16 / 8' }}>
          {blocks.map((b, i) => {
            const img = text(((b.settings ?? {}) as Record<string, any>).imageUrl);
            return img ? <img key={String(b._id ?? i)} src={img} alt="" loading="lazy" style={{ opacity: i === cur ? 1 : 0, transition: 'opacity .7s ease' }} /> : null;
          })}
        </div>
        {text(settings.label) && <p className="lds-sim-label">{text(settings.label)}</p>}
        <div className="lds-sim-row">
          {blocks.map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const id = String(b._id ?? i);
            return (
              <PreviewBlock key={id} blockId={id}>
                <button type="button" aria-pressed={i === cur} onClick={() => setOn(i)} className="lds-pill" style={i === cur ? { background: '#4b423b', color: '#fff' } : undefined}>{text(s.title) || String(i + 1)}</button>
              </PreviewBlock>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Documents: brochure cards (photo + circle arrow) and a searchable datasheet table ──
function Documents({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const { resolveLink } = useStorefront();
  const [q, setQ] = useState('');
  if (blocks.length === 0) return null;
  const cards = blocks.filter(b => text((b.settings as any)?.imageUrl));
  const rows = blocks.filter(b => !text((b.settings as any)?.imageUrl)).filter(b => {
    const s = (b.settings ?? {}) as Record<string, any>;
    return `${text(s.title)} ${text(s.kind)}`.toLowerCase().includes(q.trim().toLowerCase());
  });
  const hrefOf = (s: Record<string, any>) => { const target = s.link ? resolveLink(s.link) : null; return { href: target?.href ?? target?.to ?? '#', blank: target?.newTab !== false }; };
  return (
    <section className="lds" style={{ padding: '110px 0 40px' }}>
      <div className="lds-wrap" style={{ maxWidth: 1430 }}>
        <div style={{ background: '#fff', borderRadius: 50, padding: '40px 44px 56px' }}>
          {text(settings.heading) && <h2 className="lds-h2" style={{ marginBottom: 40 }}>{text(settings.heading)}</h2>}
          {cards.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 28 }}>
              {cards.map((b, i) => {
                const s = (b.settings ?? {}) as Record<string, any>;
                const id = String(b._id ?? i);
                return (
                  <PreviewBlock key={id} blockId={id}>
                    <LinkOrDiv link={s.link} className="lds-tile lds-tile--photo" style={{ height: 260, gridColumn: 'auto' }}>
                      <img src={text(s.imageUrl)} alt="" loading="lazy" />
                      <div className="lds-tile-foot"><span className="lds-tile-title" style={{ fontSize: 18 }}>{text(s.title)}</span><span className="lds-circ" aria-hidden><ArrowUpRight size={22} strokeWidth={1.4} /></span></div>
                    </LinkOrDiv>
                  </PreviewBlock>
                );
              })}
            </div>
          )}
          {blocks.length > cards.length && (
            <div style={{ marginTop: cards.length ? 64 : 0 }}>
              <label className="lds-search" style={{ marginBottom: 28 }}>
                <input value={q} onChange={e => setQ(e.target.value)} placeholder={text(settings.searchPlaceholder) || 'Search by name or reference'} aria-label={text(settings.searchPlaceholder) || 'Search by name or reference'} />
                <Search size={18} color="#8c847e" aria-hidden />
              </label>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead><tr style={{ textAlign: 'left', color: '#4b423b' }}><th style={{ padding: '14px 8px', fontWeight: 400, background: 'transparent' }}>{text(settings.nameLabel) || 'Name'}</th><th style={{ padding: '14px 8px', fontWeight: 400, background: 'transparent', textAlign: 'center' }}>{text(settings.refLabel) || 'Reference'}</th><th style={{ background: 'transparent' }} /></tr></thead>
                <tbody>
                  {rows.map((b, i) => {
                    const s = (b.settings ?? {}) as Record<string, any>;
                    const id = String(b._id ?? i);
                    const h = hrefOf(s);
                    return (
                      <PreviewBlock key={id} blockId={id}>
                        <tr style={{ borderTop: '1px solid #4b423b' }}>
                          <td style={{ padding: '14px 8px' }}>{text(s.title)}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}><bdi>{text(s.kind)}</bdi></td>
                          <td style={{ padding: '10px 8px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            <a href={h.href} {...(h.blank ? { target: '_blank', rel: 'noopener noreferrer' } : {})} className="lds-pill lds-pill--solid" style={{ padding: '6px 18px', marginRight: 8 }}>Download <Download size={14} aria-hidden /></a>
                          </td>
                        </tr>
                      </PreviewBlock>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Registration ────────────────────────────────────────────────────────────
const categoryTabs = () => <section className="pb-6 pt-2"><LedupHeroCategoryBanner /></section>;

registerLedupSection('hero_banner', categoryTabs);

// Theme-defined sections (namespace `ledup.`): the same renderers, driven by the seller's own fields.
registerLedupSection('theme_section', (sec, blocks, col, dynamic) => {
  const key = String(sec.settings?.sectionKey || '');
  if (key === 'ledup.category_tabs') return categoryTabs();
  if (key === 'ledup.projects') return <Projects settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.switcher') return <Switcher settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.stacked') return <Stacked settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.bento') return <Bento settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.simulation') return <Simulation settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.timeline') return <TimelineCarousel settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.documents') return <Documents settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.highlights') return <FeatureList settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.statement') return <Statement settings={sec.settings} />;
  if (key === 'ledup.collage') return <Collage settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.mission') return <Mission settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.districts') return <Districts settings={sec.settings} blocks={blocks} />;
  if (key === 'ledup.contact') return <ContactReveal section={sec} />;
  void col; void dynamic;
  return null;
});

// kept for sections that still render rich text through this module
export { RichText };
