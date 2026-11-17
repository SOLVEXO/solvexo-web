/* eslint-disable @typescript-eslint/no-explicit-any, react-refresh/only-export-components -- section settings are seller-authored JSON */
import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { apiSubmitContactMessage } from '@/api/services/storeContact';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { ts } from '@/utils/tStatic';
import { featureIcon } from '../../featureIcons';
import { PreviewBlock } from '../../previewInspector';
import { LinkOrDiv, clamp01, reducedMotion, txt, useScrollTick } from './ledupSignature';
import '../ledup-signature.css';

// ───────────────────────── About: scroll collage hero ─────────────────────────
// Photos around the headline; while the page scrolls they drift outward and fade, and the headline grows.
const SLOTS: [number, number][] = [[23, -4], [10.5, 36], [72, 24], [72, 44], [37, 73], [53, 73]];

export function Collage({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const root = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const imgs = useRef<(HTMLImageElement | null)[]>([]);
  const photos = blocks.filter(b => txt((b.settings as any)?.imageUrl)).slice(0, SLOTS.length);
  const tick = useCallback(() => {
    const el = root.current; if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = reducedMotion() ? 0 : clamp01(-r.top / Math.max(1, r.height - vh));
    const e = p * p * (3 - 2 * p);
    if (title.current) title.current.style.fontSize = `${5 + 3.6 * e}vw`;
    imgs.current.forEach((img, i) => {
      if (!img) return;
      const [x, y] = SLOTS[i];
      const dx = (x + 8.7 - 50) * 1.15 * e; const dy = (y + 15 - 50) * 1.15 * e;
      img.style.transform = `translate(${dx}vw, ${dy}vh) scale(${1 - 0.15 * e})`;
      img.style.opacity = String(1 - clamp01(e * 1.4));
    });
  }, []);
  useScrollTick(tick, [tick, photos.length]);
  const heading = txt(settings.heading);
  if (!heading && photos.length === 0) return null;
  return (
    <section className="lds lds-collage" ref={root} style={{ height: reducedMotion() ? 'auto' : undefined, minHeight: reducedMotion() ? '100vh' : undefined }}>
      <div className="lds-collage-stick">
        {photos.map((b, i) => {
          const s = b.settings as Record<string, any>;
          return <PreviewBlock key={String(b._id ?? i)} blockId={String(b._id ?? i)}><img ref={el => { imgs.current[i] = el; }} className="lds-collage-img" src={txt(s.imageUrl)} alt="" loading="lazy" style={{ left: `${SLOTS[i][0]}vw`, top: `${SLOTS[i][1]}vh` }} /></PreviewBlock>;
        })}
        {heading && <h1 ref={title} style={{ fontSize: '5vw', maxWidth: '78vw' }}>{heading}</h1>}
      </div>
    </section>
  );
}

// ───────────────────────── About: mission / vision / values around a tilted oval ─────────────────────────
export function Mission({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  if (blocks.length === 0) return null;
  return (
    <section className="lds" style={{ padding: '0 17px' }}>
      <div className="lds-mission">
        <div className="lds-mission-stage">
          {txt(settings.imageUrl) && <div className="lds-oval"><img src={txt(settings.imageUrl)} alt="" loading="lazy" /></div>}
          {blocks.slice(0, 3).map((b, i) => {
            const s = (b.settings ?? {}) as Record<string, any>;
            const Icon = featureIcon(s.icon);
            return (
              <PreviewBlock key={String(b._id ?? i)} blockId={String(b._id ?? i)}>
                <article className={`lds-glass lds-glass--${i}`}>
                  <div className="lds-glass-ico"><Icon size={26} strokeWidth={1.4} aria-hidden /></div>
                  {txt(s.eyebrow) && <small>{txt(s.eyebrow)}</small>}
                  {txt(s.title) && <h3>{txt(s.title)}</h3>}
                  {txt(s.text) && <p>{txt(s.text)}</p>}
                </article>
              </PreviewBlock>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────── About: timeline carousel ─────────────────────────
export function TimelineCarousel({ blocks }: { settings?: Record<string, any>; blocks: Block[] }) {
  const [i, setI] = useState(0);
  if (blocks.length === 0) return null;
  const cur = Math.min(i, blocks.length - 1);
  const s = (blocks[cur].settings ?? {}) as Record<string, any>;
  const year = txt(s.year);
  return (
    <section className="lds" style={{ padding: '17px 0 0' }}>
      <div className="lds-time">
        {year && <div className="lds-time-mark" aria-hidden><bdi>{year.slice(-2)}</bdi></div>}
        <div className="lds-time-inner">
          <div className="lds-time-line"><span className="lds-time-dot" /><span className="lds-time-dot lds-time-dot--end" />{year && <span className="lds-time-year"><bdi>{year}</bdi></span>}</div>
          <PreviewBlock blockId={String(blocks[cur]._id ?? cur)}>
            <div className="lds-time-body" aria-live="polite">
              {txt(s.title) && <h3>{txt(s.title)}</h3>}
              {txt(s.text) && <p>{txt(s.text)}</p>}
            </div>
          </PreviewBlock>
        </div>
        {blocks.length > 1 && (
          <div className="lds-time-nav">
            <button type="button" aria-label={ts('sections.prevSlide', 'Previous slide')} disabled={cur === 0} onClick={() => setI(cur - 1)}><ChevronLeft size={22} aria-hidden /></button>
            <span>{cur + 1} / {blocks.length}</span>
            <button type="button" aria-label={ts('sections.nextSlide', 'Next slide')} disabled={cur === blocks.length - 1} onClick={() => setI(cur + 1)}><ChevronRight size={22} aria-hidden /></button>
          </div>
        )}
      </div>
    </section>
  );
}

// ───────────────────────── Resellers: district carousel ─────────────────────────
type Shop = { district: string; town: string; name: string; phone: string; email: string; address: string; website: string; id: string; lat: number | null; lng: number | null };

/** Free OpenStreetMap embed (no package, no key): a small box around the shop with a pin. */
function ShopMap({ lat, lng, title }: { lat: number; lng: number; title: string }) {
  const d = 0.01;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - d},${lat - d},${lng + d},${lat + d}&layer=mapnik&marker=${lat},${lng}`;
  return <iframe title={title} src={src} loading="lazy" referrerPolicy="no-referrer" className="lds-map" />;
}

export function Districts({ settings, blocks }: { settings: Record<string, any>; blocks: Block[] }) {
  const shops: Shop[] = useMemo(() => blocks.map((b, i) => {
    const s = (b.settings ?? {}) as Record<string, any>;
    const lat = parseFloat(txt(s.lat)); const lng = parseFloat(txt(s.lng));
    return { id: String(b._id ?? i), district: txt(s.district), town: txt(s.town), name: txt(s.title), phone: txt(s.phone), email: txt(s.email), address: txt(s.address), website: txt(s.website), lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : null, lng: Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : null };
  }).filter(s => s.district || s.name), [blocks]);
  const [query, setQuery] = useState('');
  const [di, setDi] = useState(0);
  const [town, setTown] = useState('');
  const all = useMemo(() => Array.from(new Set(shops.map(s => s.district || '—'))), [shops]);
  const districts = all.filter(d => d.toLowerCase().includes(query.trim().toLowerCase()));
  if (shops.length === 0) return null;
  const cur = Math.min(di, Math.max(0, districts.length - 1));
  const district = districts[cur] ?? '';
  const inDistrict = shops.filter(s => (s.district || '—') === district);
  const towns = Array.from(new Set(inDistrict.map(s => s.town).filter(Boolean)));
  const activeTown = towns.includes(town) ? town : towns[0] ?? '';
  const matches = inDistrict.filter(s => !activeTown || s.town === activeTown);
  const go = (d: number) => { setDi((cur + d + districts.length) % districts.length); setTown(''); };
  const around = [-1, 0, 1].map(o => districts[cur + o]).filter((d): d is string => typeof d === 'string');
  return (
    <section className="lds" style={{ background: '#fff', borderRadius: '50px 50px 0 0', marginTop: -50, position: 'relative' }}>
      <div className="lds-find" style={{ background: 'transparent' }}>
        <label className="lds-search">
          <input value={query} onChange={e => { setQuery(e.target.value); setDi(0); setTown(''); }} placeholder={txt(settings.searchPlaceholder) || 'Procurar distrito...'} aria-label={txt(settings.searchPlaceholder) || 'Procurar distrito...'} />
          <Search size={18} color="#8c847e" aria-hidden />
        </label>
        <p className="lds-count">{districts.length ? cur + 1 : 0} DE {districts.length} DISTRITOS</p>
        <div className="lds-dist">
          {districts.length > 1 && <button type="button" className="lds-arrow lds-arrow--l" aria-label={ts('sections.prevSlide', 'Previous slide')} onClick={() => go(-1)}><ChevronLeft size={26} strokeWidth={1.2} aria-hidden /></button>}
          <div className="lds-dist-row">
            {around.map((d, k) => <button key={`${d}-${k}`} type="button" aria-pressed={d === district} onClick={() => { const idx = districts.indexOf(d); if (idx >= 0) { setDi(idx); setTown(''); } }}>{d}</button>)}
          </div>
          {districts.length > 1 && <button type="button" className="lds-arrow lds-arrow--r" aria-label={ts('sections.nextSlide', 'Next slide')} onClick={() => go(1)}><ChevronRight size={26} strokeWidth={1.2} aria-hidden /></button>}
        </div>
        {towns.length > 0 && <><p className="lds-sub">{txt(settings.townsLabel) || 'Concelhos'}</p><div className="lds-towns">{towns.map(t => <button key={t} type="button" aria-pressed={t === activeTown} onClick={() => setTown(t)}>{t}</button>)}</div></>}
        {matches.map(m => (
          <PreviewBlock key={m.id} blockId={m.id}>
            <article className="lds-shop">
              <h3>{m.name}</h3>
              {(m.phone || m.email) && <p><bdi>{m.phone}</bdi>{m.phone && m.email && <br />}{m.email}</p>}
              {m.address && <p>{m.address}</p>}
              <div className="lds-shop-acts">
                {m.website && <a className="lds-pill lds-pill--solid" href={/^https?:/.test(m.website) ? m.website : `https://${m.website}`} target="_blank" rel="noopener noreferrer">{txt(settings.websiteLabel) || 'Ver Website'} <ArrowUpRight size={14} aria-hidden /></a>}
                {m.email && <a className="lds-pill lds-pill--solid" href={`mailto:${m.email}`}>{txt(settings.emailLabel) || 'Enviar Email'} <ArrowUpRight size={14} aria-hidden /></a>}
              </div>
            </article>
          </PreviewBlock>
        ))}
      </div>
      {matches.find(m => m.lat != null && m.lng != null) && (() => { const m = matches.find(x => x.lat != null && x.lng != null)!; return <ShopMap lat={m.lat!} lng={m.lng!} title={m.name} />; })()}
    </section>
  );
}

// ───────────────────────── Contact: spotlight hero + glass form ─────────────────────────
function ContactModal({ section, onClose }: { section: Section; onClose: () => void }) {
  const { store } = useStorefront();
  const s = section.settings as Record<string, any>;
  const reasons = String(s.reasons || 'Questão de Produto, Ficha Técnica, Informação Geral, Ser Revendedor').split(',').map(r => r.trim()).filter(Boolean);
  const [reason, setReason] = useState('');
  const [v, setV] = useState({ name: '', email: '', phone: '', website: '', message: '', trap: '' });
  const [agree, setAgree] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV(p => ({ ...p, [k]: e.target.value }));
  const ready = !!(v.name.trim() && v.email.trim() && v.phone.trim() && v.message.trim() && agree);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || status === 'sending') return;
    setStatus('sending');
    try {
      const body = [reason && `[${reason}]`, v.website && `Website: ${v.website}`, v.message.trim()].filter(Boolean).join('\n');
      await apiSubmitContactMessage(store.storeId, {
        sectionId: section._id,
        answers: [{ fieldId: 'name', value: v.name.trim() }, { fieldId: 'email', value: v.email.trim() }, { fieldId: 'phone', value: v.phone.trim() }, { fieldId: 'message', value: body }],
        website: v.trap,
      });
      setStatus('done');
    } catch { setStatus('error'); }
  }
  return createPortal(
    <div className="lds-modal" role="dialog" aria-modal="true" aria-label={txt(s.formTitle) || 'Fale Connosco'} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <form className="lds-modal-card" onSubmit={send}>
        <button type="button" className="lds-close" aria-label={ts('common.close', 'Close')} onClick={onClose}><X size={32} strokeWidth={1} aria-hidden /></button>
        <h2>{txt(s.formTitle) || 'Fale Connosco'}</h2>
        {status === 'done' ? (
          <p role="status" style={{ fontSize: 15, lineHeight: 1.6 }}>{txt(s.successMessage) || ts('pg.thanks_we_got_your_message_and_will', 'Thanks — we got your message and will reply soon.')}</p>
        ) : (
          <>
            <h4>1. {txt(s.reasonLabel) || 'Motivo do contacto'}</h4>
            <div className="lds-reasons">{reasons.map(r => <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(reason === r ? '' : r)}>{r}</button>)}</div>
            <h4>2. {txt(s.basicLabel) || 'Informação básica'}</h4>
            <div className="lds-fields">
              <div><label htmlFor="lds-n">{ts('pg.name', 'Nome')}*</label><input id="lds-n" value={v.name} onChange={set('name')} placeholder="Como o devemos tratar?" required /></div>
              <div><label htmlFor="lds-e">Email*</label><input id="lds-e" type="email" value={v.email} onChange={set('email')} placeholder="Qual o endereço de email?" required /></div>
              <div><label htmlFor="lds-p">Telefone*</label><input id="lds-p" value={v.phone} onChange={set('phone')} placeholder="Qual o contato telefónico?" required /></div>
              <div><label htmlFor="lds-w">Website</label><input id="lds-w" value={v.website} onChange={set('website')} placeholder="Tem algum website?" /></div>
            </div>
            <h4>3. {txt(s.helpLabel) || 'Como podemos ajudar'}</h4>
            <div className="lds-fields"><div className="full"><label htmlFor="lds-m">Detalhes*</label><textarea id="lds-m" rows={2} value={v.message} onChange={set('message')} placeholder="Descreva a situação para podermos esclarecer" required /></div></div>
            <input value={v.trap} onChange={set('trap')} tabIndex={-1} autoComplete="off" aria-hidden style={{ position: 'absolute', left: -9999, width: 1, height: 1, opacity: 0 }} />
            <label className="lds-agree"><input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} />{txt(s.agreeText) || 'Ao enviar este formulário, afirmo que estou de acordo com os termos e condições.'}</label>
            {status === 'error' && <p role="alert" style={{ fontSize: 13, margin: '0 0 12px' }}>{ts('pg.we_could_not_send_your_message_please', 'We could not send your message. Please try again.')}</p>}
            <button type="submit" className="lds-send" disabled={!ready || status === 'sending'} aria-label={ts('pg.send', 'Send')}><ArrowUpRight size={26} strokeWidth={1.2} aria-hidden /></button>
          </>
        )}
      </form>
    </div>,
    document.body,
  );
}

export function ContactReveal({ section }: { section: Section }) {
  const s = section.settings as Record<string, any>;
  const root = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  // A soft spotlight follows the pointer: text under it is bright, the rest fades (viewport coordinates).
  const move = (e: React.PointerEvent) => {
    root.current?.querySelectorAll<HTMLElement>('[data-spot]').forEach(n => {
      const r = n.getBoundingClientRect();
      n.style.setProperty('--mx', `${e.clientX - r.left}px`);
      n.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  };
  const spot = { backgroundImage: 'radial-gradient(circle 320px at var(--mx, 40%) var(--my, 50%), #ffffff 0%, rgba(255,255,255,.26) 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent', color: 'transparent' } as React.CSSProperties;
  return (
    <section ref={root} className="lds lds-reveal" onPointerMove={move}>
      <div className="lds-wrap">
        {txt(s.eyebrow) && <small>{txt(s.eyebrow)}</small>}
        {txt(s.heading) && <h1 data-spot style={spot}>{txt(s.heading)}</h1>}
        {txt(s.text) && <p className="lds-p" data-spot style={spot}>{txt(s.text)}</p>}
        <button type="button" className="lds-pill lds-pill--light" onClick={() => setOpen(true)}>{txt(s.ctaText) || 'Preencher Formulário'}</button>
      </div>
      {open && <ContactModal section={section} onClose={() => setOpen(false)} />}
    </section>
  );
}

export { LinkOrDiv };
