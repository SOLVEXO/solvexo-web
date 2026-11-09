import type { ReactNode } from 'react';
import { Search, ShoppingBag, User } from 'lucide-react';
import type { Section } from '@/api/services/storefrontTypes';
import { LedupSectionRenderer } from '../sections';
import { ledupTheme as t, applyMerchantThemeOverrides } from '../theme.config';
import { LEDUP_DEMO_STORE } from './ledupDemoData';

const DEMO_PRODUCTS = [
  { name: 'ALCOR Dimável IP65 3CCT', ref: 'LDP-331-010-X', power: '10.5W', cct: '3CCT (3000K/4000K/6500K)', price: '24,50 €' },
  { name: 'ALCOR Dimável IP65 3CCT Slim', ref: 'LDP-331-005-X', power: '6.7W', cct: '3CCT (3000K/4000K/6500K)', price: '19,80 €' },
  { name: 'ALGOR Orientável PRO', ref: 'LDP-332-155-2', power: '20W', cct: '4000K (Branco Neutro)', price: '38,20 €' },
  { name: 'ALZIR 3CCT IP65 Encastrar', ref: 'LDP-331-020-X', power: '6.5W', cct: '3CCT', price: '16,90 €' },
];

function DemoProducts({ heading }: { heading: string }) {
  return (
    <section className="py-12" style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}`, fontFamily: t.fonts.body }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        <h2 className="m-0 mb-6 text-2xl font-bold tracking-tight text-stone-900">{heading}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {DEMO_PRODUCTS.map(p => (
            <article key={p.ref} className="ld-product-card p-5 bg-white flex flex-col justify-between">
              <div className="aspect-square w-full rounded-2xl bg-stone-50 flex items-center justify-center p-4 mb-4">
                <span className="text-xs font-semibold text-stone-400">LEDUP FIXTURE</span>
              </div>
              <div>
                <h3 className="m-0 text-sm font-semibold text-stone-900 leading-snug">{p.name}</h3>
                <p className="mt-1 text-[11px] font-mono text-stone-400">{p.ref}</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded-md border border-stone-200 px-2 py-0.5 text-[10px] font-semibold text-stone-600">{p.power}</span>
                  <span className="rounded-md border border-stone-200 px-2 py-0.5 text-[10px] font-medium text-stone-500">{p.cct}</span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <span className="text-sm font-bold text-stone-900">{p.price}</span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-100 text-stone-700">
                    <ShoppingBag size={13} />
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export function LedupDemoRenderer({ sections }: { sections: Section[] }) {
  return (
    <>
      {sections.map(s =>
        s._id === 'demo-products' ? (
          <DemoProducts key={s._id} heading={String(s.settings?.heading ?? 'Featured products')} />
        ) : (
          <LedupSectionRenderer key={s._id} sections={[s]} />
        ),
      )}
    </>
  );
}

export function LedupDemoChrome({ children }: { children: ReactNode }) {
  applyMerchantThemeOverrides(null);
  return (
    <div className="ld-root min-h-screen flex flex-col bg-white">
      {/* Demo Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-stone-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold tracking-tight text-stone-900">{LEDUP_DEMO_STORE.name}</span>
        <div className="hidden md:flex items-center gap-1 rounded-full bg-[#F4F2EE] px-5 py-2 text-xs font-medium text-stone-700">
          <span className="px-3 py-1 bg-white rounded-full text-stone-900 shadow-xs">Products</span>
          <span className="px-3 py-1">Datasheets</span>
          <span className="px-3 py-1">About</span>
          <span className="px-3 py-1">Where to buy</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700"><Search size={15} /></span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700"><User size={15} /></span>
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-100 text-stone-700"><ShoppingBag size={15} /></span>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      {/* Demo Footer */}
      <footer className="ld-footer-wrapper text-white mt-12 px-8 py-16 text-center">
        <h2 className="ld-footer-title text-3xl font-light mb-4">A confiança que ilumina os seus projetos.</h2>
        <p className="text-xs text-white/60">LEDUP Portugal · Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
