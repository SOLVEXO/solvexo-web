import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search, ShoppingBag, User } from 'lucide-react';
import type { Section } from '@/api/services/storefrontTypes';
import { FashionSectionRenderer } from '../sections';
import { FashionProductCardView } from '../components/FashionProductCardView';
import { fashionTheme as t } from '../theme.config';

/* Everything in this file is static Theme Library demo content (photos, names and prices are samples, not a real store).
   A seller who installs the theme sees their own products, categories and menus instead. */
const IMG = '/theme-demo/maison';

const PRODUCTS = [
  { name: 'Belted trench coat', tag: 'outerwear', price: '$189', compare: '$240', off: 21, rating: 4.8, image: `${IMG}/trench-2.jpg`, second: `${IMG}/trench-1.jpg` },
  { name: 'Tailored wool trousers', tag: 'trousers', price: '$98', rating: 4.6, image: `${IMG}/trouser-1.jpg` },
  { name: 'Leather tote bag', tag: 'bags', price: '$215', rating: 4.9, image: `${IMG}/bag-1.jpg` },
  { name: 'Black crossbody bag', tag: 'bags', price: '$132', compare: '$165', off: 20, rating: 4.7, image: `${IMG}/bag-2.jpg` },
  { name: 'Automatic leather watch', tag: 'accessories', price: '$280', rating: 4.8, image: `${IMG}/watch-1.jpg` },
  { name: 'Gold solitaire pendant', tag: 'jewellery', price: '$74', rating: 4.9, image: `${IMG}/necklace-1.jpg` },
  { name: 'Hammered gold cuff', tag: 'jewellery', price: '$58', rating: 4.5, image: `${IMG}/bracelet-1.jpg` },
  { name: 'Textured wool coat', tag: 'outerwear', price: '$245', rating: 4.7, soldOut: true, image: `${IMG}/trench-1.jpg` },
];
const CATEGORIES = [
  { name: 'Apparel', count: 48, image: `${IMG}/cat-apparel.jpg` },
  { name: 'Bags', count: 22, image: `${IMG}/cat-bags.jpg` },
  { name: 'Accessories', count: 36, image: `${IMG}/cat-accessories.jpg` },
  { name: 'Watches', count: 14, image: `${IMG}/watch-1.jpg` },
];
const NAV = ['New in', 'Women', 'Men', 'Accessories', 'Journal'];

function Shell({ heading, eyebrow, action, children }: { heading: string; eyebrow?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4 md:mb-10">
          <div>
            {eyebrow && <p className="m-0 mb-2 text-sm font-medium" style={{ color: t.colors.inkMuted }}>{eyebrow}</p>}
            <h2 className="m-0 text-[clamp(26px,3.2vw,40px)] font-semibold leading-[1.15] tracking-tight">{heading}</h2>
          </div>
          {action}
        </header>
        {children}
      </div>
    </section>
  );
}

function DemoCategories({ heading }: { heading: string }) {
  return (
    <Shell heading={heading} eyebrow="Browse">
      <ul className="fx-hide-scroll m-0 flex list-none gap-5 overflow-x-auto p-0 pb-1">
        {CATEGORIES.map(c => (
          <li key={c.name} className="w-[270px] max-w-[80vw] shrink-0">
            <Link to="#" className="flex items-center overflow-hidden no-underline" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 16, color: t.colors.ink }}>
              <img src={c.image} alt="" loading="lazy" className="size-24 shrink-0 object-cover" style={{ borderRight: `1px solid ${t.colors.border}` }} />
              <div className="min-w-0 flex-1 p-5"><p className="m-0 truncate text-base font-medium">{c.name}</p><p className="m-0 mt-0.5 text-sm" style={{ color: t.colors.inkMuted }}>{c.count} items</p></div>
            </Link>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function DemoProducts({ heading }: { heading: string }) {
  return (
    <Shell heading={heading} eyebrow="The edit"
      action={<span className="fx-cta" style={{ height: 40, padding: '4px 48px 4px 18px', background: t.colors.ink, color: t.colors.bg, borderRadius: t.buttonRadiusPx, fontFamily: t.fonts.body }}>View all<span className="fx-cta-icon" style={{ width: 32, height: 32, background: t.colors.bg, color: t.colors.ink }}>↗</span></span>}>
      <div className="grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
        {PRODUCTS.map((p, i) => (
          <FashionProductCardView key={p.name} to="#" name={p.name} image={p.image} secondImage={t.productImageHover === 'second-image' ? p.second : undefined} tag={p.tag} rating={p.rating}
            price={p.price} comparePrice={p.compare} percentOff={p.off} soldOut={p.soldOut} wished={i === 2} onAdd={p.soldOut ? undefined : () => undefined} />
        ))}
      </div>
    </Shell>
  );
}

/** Renders the demo sections: real section components for content, static stand-ins for product-driven ones. */
export function FashionDemoRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map(s => {
        if (s._id === 'demo-categories') return <DemoCategories key={s._id} heading={String(s.settings.heading ?? 'Shop by category')} />;
        if (s._id === 'demo-products') return <DemoProducts key={s._id} heading={String(s.settings.heading ?? 'New arrivals')} />;
        return <FashionSectionRenderer key={s._id} sections={[s]} />;
      })}
    </>
  );
}

/** Static header + footer for the Theme Library preview (the live theme uses the real, store-aware ones). */
export function FashionDemoChrome({ children }: { children: ReactNode }) {
  const icon = 'relative grid size-10 place-items-center rounded-full';
  return (
    <div style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
      <div className="px-4 py-2 text-center text-xs font-medium" style={{ background: t.colors.ink, color: t.colors.bg }}>Free shipping on orders over $75</div>
      <header style={{ borderBottom: `1px solid ${t.colors.border}`, background: t.colors.bg }}>
        <div className="mx-auto grid items-center" style={{ maxWidth: t.layout.maxWidth, padding: `18px ${t.layout.containerPadX}`, gridTemplateColumns: '1fr auto 1fr', columnGap: 16 }}>
          <span className="text-xl font-semibold tracking-tight md:text-2xl" style={{ fontFamily: t.fonts.display }}>Maison</span>
          <div className="flex justify-center"><nav className="hidden items-center gap-1 lg:flex" aria-label="Main">{NAV.map(n => <span key={n} className="rounded-full px-4 py-2 text-sm font-medium">{n}</span>)}</nav></div>
          <div className="flex items-center justify-end gap-0.5">
            <span className={icon}><Search size={20} /></span><span className={`${icon} hidden sm:grid`}><User size={20} /></span><span className={`${icon} hidden sm:grid`}><Heart size={20} /></span>
            <span className={icon}><ShoppingBag size={20} /><span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full px-1 text-[10px] font-semibold" style={{ background: t.colors.accent, color: t.colors.accentInk }}>2</span></span>
          </div>
        </div>
      </header>
      <main>{children}</main>
      <footer style={{ padding: `0 ${t.layout.containerPadX} 24px`, background: t.colors.bg }}>
        <div className="mx-auto overflow-hidden" style={{ maxWidth: t.layout.maxWidth, background: t.colors.ink, color: t.colors.bg, borderRadius: 28 }}>
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4" style={{ padding: 'clamp(28px, 4vw, 56px)' }}>
            <div><p className="m-0 mb-3 text-xl font-semibold">Maison</p><p className="m-0 text-sm leading-relaxed opacity-70">Modern pieces, made to last. Free returns within 30 days.</p></div>
            {[['Shop', ['New in', 'Women', 'Men', 'Accessories']], ['Help', ['Shipping', 'Returns', 'Size guide', 'Contact']], ['Company', ['About', 'Journal', 'Stockists', 'Careers']]].map(([h, links]) => (
              <div key={h as string}><p className="m-0 mb-4 text-sm font-semibold">{h as string}</p><ul className="m-0 flex list-none flex-col gap-2.5 p-0 text-sm opacity-75">{(links as string[]).map(l => <li key={l}>{l}</li>)}</ul></div>
            ))}
          </div>
          <div className="flex flex-col items-center justify-between gap-2 px-[clamp(28px,4vw,56px)] py-5 text-[13px] opacity-60 md:flex-row" style={{ borderTop: `1px solid color-mix(in srgb, ${t.colors.bg} 16%, transparent)` }}>
            <span>© {new Date().getFullYear()} Maison. Theme preview with sample content.</span><span>Privacy policy · Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
