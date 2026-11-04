import type { ReactNode } from 'react';
import { Heart, Search, ShoppingCart, User } from 'lucide-react';
import type { Section } from '@/api/services/storefrontTypes';
import { TechSectionRenderer } from '../sections';
import { techTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import { TechStars } from '../ui/techUi';

/* Static Theme Library demo content: product names, prices and ratings are samples, not a real store. */
const PRODUCTS = [
  { name: 'Gaming laptop 15.6", 16GB RAM, 1TB SSD', price: '$1,499.00', compare: '$1,699.00', rating: 4 },
  { name: 'Compact desktop PC, Core i7, 16GB RAM', price: '$1,099.00', rating: 5 },
  { name: 'Curved gaming monitor 27", 165Hz', price: '$399.00', compare: '$449.00', rating: 4 },
  { name: 'Mechanical keyboard, RGB, hot-swap', price: '$129.00', rating: 5 },
];
const NAV = ['Laptops', 'Desktop PCs', 'Networking', 'PC Parts', 'Repairs'];

function DemoProducts({ heading }: { heading: string }) {
  return (
    <section style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}`, fontFamily: t.fonts.body }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        <h2 className="m-0 mb-5 text-[clamp(20px,2.4vw,26px)] font-semibold">{heading}</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PRODUCTS.map(p => (
            <article key={p.name} className="flex flex-col gap-2 p-3" style={{ color: t.colors.ink }}>
              <span className="text-xs font-medium" style={{ color: t.colors.success }}>In stock</span>
              <div aria-hidden style={{ aspectRatio: '1 / 1', background: t.colors.bgAlt }} />
              <TechStars value={p.rating} />
              <p className="m-0 text-[13px] font-medium leading-snug">{p.name}</p>
              <p className="m-0 flex flex-col leading-tight">{p.compare && <s className="text-[13px]" style={{ color: t.colors.inkMuted }}>{p.compare}</s>}<b className="text-[17px]">{p.price}</b></p>
              <span className="tx-btn tx-btn-sm" style={{ border: `1px solid ${t.colors.accent}`, color: t.colors.accent, borderRadius: t.buttonRadiusPx }}>Add to cart</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Renders the demo sections: real section components for content, a static stand-in for the product row. */
export function TechDemoRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map(s => s._id === 'demo-products'
        ? <DemoProducts key={s._id} heading={String(s.settings.heading ?? 'New products')} />
        : <TechSectionRenderer key={s._id} sections={[s]} />)}
    </>
  );
}

/** Static header + footer for the Theme Library preview (the live theme uses the real, store-aware ones). */
export function TechDemoChrome({ children }: { children: ReactNode }) {
  // The library preview has no store: start from the Tech defaults (this also feeds the bridged shared renderers).
  applyMerchantThemeOverrides(null);
  const icon = 'grid size-10 place-items-center';
  return (
    <div className="tx-root" style={{ background: t.colors.bg, color: t.colors.ink, fontFamily: t.fonts.body }}>
      <div className="px-4 py-2 text-center text-xs font-medium" style={{ background: t.colors.dark, color: t.colors.darkInk }}>Your store message, phone and email appear here</div>
      <header style={{ borderBottom: `1px solid ${t.colors.border}` }}>
        <div className="mx-auto flex items-center gap-6" style={{ maxWidth: t.layout.maxWidth, padding: `12px ${t.layout.containerPadX}` }}>
          <span className="text-xl font-bold" style={{ fontFamily: t.fonts.display }}>Tech Store</span>
          <nav className="hidden flex-1 items-center gap-6 lg:flex" aria-label="Main">{NAV.map(n => <span key={n} className="text-sm font-medium">{n}</span>)}</nav>
          <div className="ms-auto flex items-center"><span className={icon}><Search size={20} /></span><span className={icon}><Heart size={20} /></span><span className={icon}><ShoppingCart size={20} /></span><span className={icon}><User size={20} /></span></div>
        </div>
      </header>
      <main>{children}</main>
      <footer style={{ background: t.colors.dark, color: t.colors.darkInk }}>
        <div className="mx-auto grid gap-8 text-sm sm:grid-cols-2 lg:grid-cols-4" style={{ maxWidth: t.layout.maxWidth, padding: `clamp(28px,4vw,48px) ${t.layout.containerPadX}` }}>
          {[['Information', ['About us', 'Privacy policy', 'Terms', 'Contact us']], ['Laptops', ['Everyday notebooks', 'Gaming notebooks']], ['Desktop PCs', ['Custom PCs', 'All-in-one PCs']], ['Support', ['Orders and returns', 'Warranty']]].map(([h, links]) => (
            <div key={h as string}><p className="m-0 mb-3 font-semibold opacity-70">{h as string}</p><ul className="m-0 flex list-none flex-col gap-2 p-0">{(links as string[]).map(l => <li key={l}>{l}</li>)}</ul></div>
          ))}
        </div>
        <div className="px-4 py-4 text-center text-xs opacity-60" style={{ borderTop: '1px solid rgba(255,255,255,.18)' }}>© {new Date().getFullYear()} Tech Store. Theme preview with sample content.</div>
      </footer>
    </div>
  );
}
