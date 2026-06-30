import { useState, useEffect, useCallback, useRef, type ReactNode, type CSSProperties } from 'react';
import { useParams } from 'react-router-dom';
import {
  Palette, LayoutGrid, PanelTop, Package, PanelBottom, Globe,
  Monitor, Smartphone, Lock, Plus, Trash2, RotateCcw, Check, Loader2,
  ShoppingCart, Star,
  type LucideIcon,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useUpdateStore } from '@/hooks/store/useUpdateStore';
import { useGetStore } from '@/hooks/store/useGetStore';
import { StorePageHeader } from '@/components/layouts/StoreLayout';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Types ──────────────────────────────────────────────────────────────────────
type Section     = 'theme' | 'layout' | 'header' | 'products' | 'footer' | 'seo';
type Device      = 'desktop' | 'mobile';
type LayoutStyle = 'Grid' | 'Magazine' | 'Minimal';
type HeaderStyle = 'dark' | 'light' | 'transparent';
type SortOrder   = 'default' | 'newest' | 'price_asc' | 'price_desc';

interface NavLink    { id: string; label: string }
interface FooterLink { id: string; label: string }

interface Config {
  primaryColor:  string;
  bgColor:       string;
  textColor:     string;
  accentColor:   string;
  font:          string;
  layoutStyle:   LayoutStyle;
  columns:       2 | 3 | 4;
  storeName:     string;
  tagline:       string;
  heroText:      string;
  headerStyle:   HeaderStyle;
  showSearch:    boolean;
  showCart:      boolean;
  navLinks:      NavLink[];
  sortOrder:     SortOrder;
  showPrice:     boolean;
  showRatings:   boolean;
  showAddToCart: boolean;
  featuredCount: number;
  footerTagline: string;
  copyright:     string;
  footerLinks:   FooterLink[];
  metaTitle:     string;
  metaDesc:      string;
  keywords:      string;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const CUR_YEAR = new Date().getFullYear();

const DEFAULT: Config = {
  primaryColor: '#D97757', bgColor: '#FAF9F5', textColor: '#2C2A28', accentColor: '#B95A3A',
  font: 'Poppins',
  layoutStyle: 'Grid', columns: 3,
  storeName: 'My Shop',
  tagline: 'Handcrafted educational resources for modern classrooms.',
  heroText: 'Shop Now',
  headerStyle: 'dark', showSearch: true, showCart: true,
  navLinks: [
    { id: '1', label: 'Shop'    },
    { id: '2', label: 'About'   },
    { id: '3', label: 'Contact' },
  ],
  sortOrder: 'default', showPrice: true, showRatings: true, showAddToCart: true, featuredCount: 3,
  footerTagline: 'Quality resources for educators everywhere.',
  copyright: `© ${CUR_YEAR} My Shop. All rights reserved.`,
  footerLinks: [
    { id: '1', label: 'Privacy Policy' },
    { id: '2', label: 'Terms of Use'   },
    { id: '3', label: 'Help Center'    },
  ],
  metaTitle: 'My Shop — Quality Educational Resources',
  metaDesc:  'Discover premium educational materials curated by expert educators.',
  keywords:  'education, worksheets, lesson plans, teaching resources',
};

const FONTS = ['Poppins', 'Inter', 'DM Sans', 'Lato', 'Playfair Display', 'Merriweather'];

const SECTIONS: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: 'theme',    label: 'Theme',    Icon: Palette     },
  { id: 'layout',   label: 'Layout',   Icon: LayoutGrid  },
  { id: 'header',   label: 'Header',   Icon: PanelTop    },
  { id: 'products', label: 'Products', Icon: Package     },
  { id: 'footer',   label: 'Footer',   Icon: PanelBottom },
  { id: 'seo',      label: 'SEO',      Icon: Globe       },
];

const SAMPLE_PRODUCTS = [
  { name: 'Grade 5 Math Bundle',        price: '$49.00', rating: 4.8, reviews: 124, bg: '#EAF4EE', fg: '#2E7D52' },
  { name: 'Reading Comprehension Pack', price: '$22.00', rating: 4.6, reviews: 87,  bg: '#EAF0FB', fg: '#2156A8' },
  { name: 'Science Lab Worksheets',     price: '$15.00', rating: 4.9, reviews: 62,  bg: '#FEF4E5', fg: '#B36200' },
  { name: 'Creative Writing Prompts',   price: '$12.00', rating: 4.7, reviews: 45,  bg: '#F4EAFB', fg: '#7B3DAE' },
  { name: 'History Timeline Cards',     price: '$18.00', rating: 4.5, reviews: 33,  bg: '#FDE8E8', fg: '#C0392B' },
  { name: 'Phonics Activity Set',       price: '$11.00', rating: 4.8, reviews: 71,  bg: '#E8F5FD', fg: '#1A6FA8' },
];

// ── Small shared components ────────────────────────────────────────────────────

function Toggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => set(!on)}
      className={clsx(
        'relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 border-0 cursor-pointer shrink-0',
        on ? 'bg-brand-orange' : 'bg-[#D1CFC7]',
      )}
    >
      <span className={clsx(
        'absolute top-[2px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200',
        on ? 'translate-x-[18px]' : 'translate-x-[2px]',
      )} />
    </button>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-[9px] border-b border-[#F5F4EF] last:border-0">
      <span className="text-[12px] text-slate shrink-0">{label}</span>
      <div className="shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, maxLen, textarea = false }: {
  label: string; value: string; onChange: (v: string) => void;
  maxLen?: number; textarea?: boolean;
}) {
  const cls = "w-full px-3 py-[7px] text-[12px] border border-bone rounded-lg bg-white text-charcoal outline-none focus:border-brand-orange transition-colors resize-none";
  return (
    <div className="mb-3">
      <div className="flex items-center justify-between mb-[4px]">
        <label className="text-[11px] font-medium text-slate">{label}</label>
        {maxLen && (
          <span className={clsx('text-[10px]', value.length > maxLen * 0.88 ? 'text-red-500' : 'text-[#B0AEA8]')}>
            {value.length}/{maxLen}
          </span>
        )}
      </div>
      {textarea
        ? <textarea rows={3} value={value} onChange={e => onChange(e.target.value)} maxLength={maxLen} className={cls} />
        : <input type="text" value={value} onChange={e => onChange(e.target.value)} maxLength={maxLen} className={cls} />
      }
    </div>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <p className="text-[13px] font-bold text-charcoal mb-3">{children}</p>;
}

function SubLabel({ children }: { children: string }) {
  return <p className="text-[11px] font-medium text-slate mb-[5px] mt-3">{children}</p>;
}

// ── Section Panels ─────────────────────────────────────────────────────────────

function ThemePanel({ cfg, set }: { cfg: Config; set: (p: Partial<Config>) => void }) {
  const colors: { key: keyof Config; label: string }[] = [
    { key: 'primaryColor', label: 'Primary'    },
    { key: 'bgColor',      label: 'Background' },
    { key: 'textColor',    label: 'Text'       },
    { key: 'accentColor',  label: 'Accent'     },
  ];
  return (
    <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <SectionTitle>Theme Colors</SectionTitle>
      {colors.map(c => (
        <Row key={c.key} label={c.label}>
          <div className="flex items-center gap-2">
            <label
              className="relative w-[22px] h-[22px] rounded-[5px] border border-bone overflow-hidden shrink-0 cursor-pointer"
              style={{ background: cfg[c.key] as string }}
            >
              <input
                type="color"
                value={cfg[c.key] as string}
                onChange={e => set({ [c.key]: e.target.value })}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </label>
            <span className="text-[11px] font-mono text-[#8C8A82] w-[58px] select-all">{cfg[c.key] as string}</span>
          </div>
        </Row>
      ))}
      <SubLabel>Font Family</SubLabel>
      <select
        value={cfg.font}
        onChange={e => set({ font: e.target.value })}
        className="w-full px-3 py-2 text-[12px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer focus:border-brand-orange"
        style={{ fontFamily: cfg.font }}
      >
        {FONTS.map(f => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
      </select>
      {/* Color presets */}
      <SubLabel>Quick Presets</SubLabel>
      <div className="flex gap-[7px]">
        {[
          { primary: '#D97757', bg: '#FAF9F5', text: '#2C2A28', accent: '#B95A3A', label: 'Warm'    },
          { primary: '#3B82F6', bg: '#F0F9FF', text: '#1E3A5F', accent: '#1D4ED8', label: 'Blue'    },
          { primary: '#10B981', bg: '#F0FDF4', text: '#1A3A2A', accent: '#059669', label: 'Green'   },
          { primary: '#8B5CF6', bg: '#FAF5FF', text: '#2D1B69', accent: '#7C3AED', label: 'Purple'  },
          { primary: '#1A1917', bg: '#FFFFFF', text: '#1A1917', accent: '#4A4945', label: 'Classic' },
        ].map(p => (
          <button
            key={p.label}
            title={p.label}
            onClick={() => set({ primaryColor: p.primary, bgColor: p.bg, textColor: p.text, accentColor: p.accent })}
            className="w-7 h-7 rounded-full border-2 border-white shadow-[0_0_0_1px_rgba(0,0,0,0.12)] cursor-pointer shrink-0 transition-transform hover:scale-110"
            style={{ background: p.primary }}
          />
        ))}
      </div>
    </div>
  );
}

function LayoutPanel({ cfg, set }: { cfg: Config; set: (p: Partial<Config>) => void }) {
  const opts: { id: LayoutStyle; desc: string }[] = [
    { id: 'Grid',     desc: 'Classic product grid, best for large catalogues'       },
    { id: 'Magazine', desc: 'Editorial layout with featured products in hero spots' },
    { id: 'Minimal',  desc: 'Clean whitespace-focused design for premium brands'    },
  ];
  return (
    <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <SectionTitle>Layout Style</SectionTitle>
      <div className="flex flex-col gap-[7px] mb-4">
        {opts.map(opt => {
          const active = cfg.layoutStyle === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => set({ layoutStyle: opt.id })}
              className="w-full text-left px-3 py-[9px] rounded-lg cursor-pointer transition-all duration-[120ms] border-2"
              style={{ borderColor: active ? '#D97757' : '#E8E6DC', background: active ? '#FBECE4' : '#fff' }}
            >
              <p className="text-[12px] font-semibold mb-[2px]" style={{ color: active ? '#B95A3A' : '#141413' }}>{opt.id}</p>
              <p className="text-[11px]" style={{ color: active ? '#B95A3A' : '#8C8A82' }}>{opt.desc}</p>
            </button>
          );
        })}
      </div>
      <SubLabel>Columns per row</SubLabel>
      <div className="flex gap-2">
        {([2, 3, 4] as const).map(n => (
          <button
            key={n}
            onClick={() => set({ columns: n })}
            className="flex-1 py-[7px] rounded-lg text-[12px] font-medium border cursor-pointer transition-all duration-[120ms]"
            style={{
              borderColor: cfg.columns === n ? '#D97757' : '#E8E6DC',
              background:  cfg.columns === n ? '#FBECE4' : '#fff',
              color:       cfg.columns === n ? '#B95A3A' : '#4A4945',
            }}
          >
            {n} col
          </button>
        ))}
      </div>
    </div>
  );
}

function HeaderPanel({ cfg, set }: { cfg: Config; set: (p: Partial<Config>) => void }) {
  const styles: { id: HeaderStyle; label: string }[] = [
    { id: 'dark',        label: 'Dark'        },
    { id: 'light',       label: 'Light'       },
    { id: 'transparent', label: 'Transparent' },
  ];
  return (
    <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <SectionTitle>Header Settings</SectionTitle>
      <Field label="Store Name"    value={cfg.storeName} onChange={v => set({ storeName: v })} maxLen={40} />
      <Field label="Hero Tagline"  value={cfg.tagline}   onChange={v => set({ tagline: v })}   maxLen={100} />
      <Field label="Hero CTA Text" value={cfg.heroText}  onChange={v => set({ heroText: v })}  maxLen={20} />
      <SubLabel>Header Style</SubLabel>
      <div className="flex gap-[6px] mb-1">
        {styles.map(s => (
          <button
            key={s.id}
            onClick={() => set({ headerStyle: s.id })}
            className="flex-1 py-[7px] rounded-lg text-[11px] font-medium border cursor-pointer transition-all duration-[120ms]"
            style={{
              borderColor: cfg.headerStyle === s.id ? '#D97757' : '#E8E6DC',
              background:  cfg.headerStyle === s.id ? '#FBECE4' : '#fff',
              color:       cfg.headerStyle === s.id ? '#B95A3A' : '#4A4945',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
      <Row label="Show Search"><Toggle on={cfg.showSearch} set={v => set({ showSearch: v })} /></Row>
      <Row label="Show Cart"><Toggle on={cfg.showCart} set={v => set({ showCart: v })} /></Row>
      <SubLabel>Navigation Links</SubLabel>
      <div className="flex flex-col gap-[6px]">
        {cfg.navLinks.map((link, i) => (
          <div key={link.id} className="flex items-center gap-2">
            <input
              type="text"
              value={link.label}
              onChange={e => {
                const updated = cfg.navLinks.map((l, j) => j === i ? { ...l, label: e.target.value } : l);
                set({ navLinks: updated });
              }}
              className="flex-1 px-2 py-[6px] text-[12px] border border-bone rounded-lg bg-white text-charcoal outline-none focus:border-brand-orange transition-colors"
            />
            <button
              onClick={() => set({ navLinks: cfg.navLinks.filter((_, j) => j !== i) })}
              className="w-7 h-7 rounded-md flex items-center justify-center border border-[#F5D0C8] bg-[#FFF0EE] cursor-pointer shrink-0"
            >
              <Trash2 size={11} className="text-[#C0392B]" />
            </button>
          </div>
        ))}
      </div>
      {cfg.navLinks.length < 6 && (
        <button
          onClick={() => set({ navLinks: [...cfg.navLinks, { id: Date.now().toString(), label: 'New Link' }] })}
          className="w-full mt-2 py-[7px] flex items-center justify-center gap-[5px] border border-dashed border-[#D1CFC7] rounded-lg text-[11px] text-slate cursor-pointer bg-transparent hover:border-brand-orange hover:text-brand-orange transition-colors"
        >
          <Plus size={11} /> Add Link
        </button>
      )}
    </div>
  );
}

function ProductsPanel({ cfg, set }: { cfg: Config; set: (p: Partial<Config>) => void }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <SectionTitle>Products Display</SectionTitle>
      <div className="mb-3">
        <label className="text-[11px] font-medium text-slate block mb-[4px]">Sort Order</label>
        <select
          value={cfg.sortOrder}
          onChange={e => set({ sortOrder: e.target.value as SortOrder })}
          className="w-full px-3 py-2 text-[12px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer focus:border-brand-orange"
        >
          <option value="default">Default</option>
          <option value="newest">Newest First</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
        </select>
      </div>
      <SubLabel>Featured Products Count</SubLabel>
      <div className="flex gap-2 mb-1">
        {([2, 3, 4, 6] as const).map(n => (
          <button
            key={n}
            onClick={() => set({ featuredCount: n })}
            className="flex-1 py-[7px] rounded-lg text-[12px] font-medium border cursor-pointer transition-all duration-[120ms]"
            style={{
              borderColor: cfg.featuredCount === n ? '#D97757' : '#E8E6DC',
              background:  cfg.featuredCount === n ? '#FBECE4' : '#fff',
              color:       cfg.featuredCount === n ? '#B95A3A' : '#4A4945',
            }}
          >
            {n}
          </button>
        ))}
      </div>
      <Row label="Show Price">      <Toggle on={cfg.showPrice}     set={v => set({ showPrice: v })}     /></Row>
      <Row label="Show Ratings">    <Toggle on={cfg.showRatings}   set={v => set({ showRatings: v })}   /></Row>
      <Row label="Add to Cart btn"> <Toggle on={cfg.showAddToCart} set={v => set({ showAddToCart: v })} /></Row>
    </div>
  );
}

function FooterPanel({ cfg, set }: { cfg: Config; set: (p: Partial<Config>) => void }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <SectionTitle>Footer Settings</SectionTitle>
      <Field label="Footer Tagline" value={cfg.footerTagline} onChange={v => set({ footerTagline: v })} maxLen={80} />
      <Field label="Copyright Text" value={cfg.copyright}     onChange={v => set({ copyright: v })}     maxLen={80} />
      <SubLabel>Footer Links</SubLabel>
      <div className="flex flex-col gap-[6px]">
        {cfg.footerLinks.map((link, i) => (
          <div key={link.id} className="flex items-center gap-2">
            <input
              type="text"
              value={link.label}
              onChange={e => {
                const updated = cfg.footerLinks.map((l, j) => j === i ? { ...l, label: e.target.value } : l);
                set({ footerLinks: updated });
              }}
              className="flex-1 px-2 py-[6px] text-[12px] border border-bone rounded-lg bg-white text-charcoal outline-none focus:border-brand-orange transition-colors"
            />
            <button
              onClick={() => set({ footerLinks: cfg.footerLinks.filter((_, j) => j !== i) })}
              className="w-7 h-7 rounded-md flex items-center justify-center border border-[#F5D0C8] bg-[#FFF0EE] cursor-pointer shrink-0"
            >
              <Trash2 size={11} className="text-[#C0392B]" />
            </button>
          </div>
        ))}
      </div>
      {cfg.footerLinks.length < 6 && (
        <button
          onClick={() => set({ footerLinks: [...cfg.footerLinks, { id: Date.now().toString(), label: 'New Link' }] })}
          className="w-full mt-2 py-[7px] flex items-center justify-center gap-[5px] border border-dashed border-[#D1CFC7] rounded-lg text-[11px] text-slate cursor-pointer bg-transparent hover:border-brand-orange hover:text-brand-orange transition-colors"
        >
          <Plus size={11} /> Add Link
        </button>
      )}
    </div>
  );
}

function SEOPanel({ cfg, set }: { cfg: Config; set: (p: Partial<Config>) => void }) {
  return (
    <div className="bg-white border border-bone rounded-[10px] px-[18px] py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
      <SectionTitle>SEO Settings</SectionTitle>
      <Field label="Meta Title"       value={cfg.metaTitle} onChange={v => set({ metaTitle: v })} maxLen={60} />
      <Field label="Meta Description" value={cfg.metaDesc}  onChange={v => set({ metaDesc: v })}  maxLen={160} textarea />
      <Field label="Keywords (comma-separated)" value={cfg.keywords} onChange={v => set({ keywords: v })} />
      {/* Google preview */}
      <div className="mt-2 p-3 bg-[#F5F4EF] rounded-lg border border-bone">
        <p className="text-[10px] font-semibold text-slate uppercase tracking-[0.06em] mb-2">Google Preview</p>
        <p className="text-[13px] font-medium text-[#1A0DAB] leading-[1.3] mb-[2px] truncate">{cfg.metaTitle || 'Page Title'}</p>
        <p className="text-[11px] text-[#006621]">{cfg.storeName.toLowerCase().replace(/\s+/g, '-')}.solvexo.store</p>
        <p className="text-[11px] text-[#4C4C4C] leading-[1.4] mt-[2px] line-clamp-2">{cfg.metaDesc || 'Page description…'}</p>
      </div>
    </div>
  );
}

// ── Store Preview ─────────────────────────────────────────────────────────────
function StorePreview({ cfg, device }: { cfg: Config; device: Device }) {
  const hdrBg     = cfg.headerStyle === 'dark'        ? '#2C2A28'
                  : cfg.headerStyle === 'light'       ? '#ffffff'
                  :                                     cfg.bgColor;
  const hdrBorder = cfg.headerStyle === 'light' ? `1px solid #E8E6DC` : 'none';
  const hdrColor  = cfg.headerStyle === 'light' ? cfg.textColor : '#ffffff';
  const hdrMuted  = cfg.headerStyle === 'light' ? '#8C8A82'    : '#B0AEA8';

  const products = SAMPLE_PRODUCTS.slice(0, cfg.featuredCount);

  const colClass: Record<number, string> = { 2: 'grid-cols-2', 3: 'grid-cols-3', 4: 'grid-cols-4' };
  const gridCols = cfg.layoutStyle === 'Magazine' ? 'grid-cols-2' : colClass[cfg.columns] ?? 'grid-cols-3';

  const wrapStyle: CSSProperties = device === 'mobile'
    ? { maxWidth: 375, margin: '0 auto', fontSize: '0.88em' }
    : {};

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: cfg.bgColor }}>
      <div style={wrapStyle}>
        {/* Store header */}
        <header style={{ background: hdrBg, borderBottom: hdrBorder }}>
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-[8px]">
              <div
                className="w-[26px] h-[26px] rounded-[6px] flex items-center justify-center text-[11px] font-bold text-white shrink-0"
                style={{ background: cfg.primaryColor }}
              >
                {cfg.storeName.charAt(0).toUpperCase()}
              </div>
              <span className="text-[13px] font-bold" style={{ color: hdrColor, fontFamily: cfg.font + ', sans-serif' }}>
                {cfg.storeName}
              </span>
            </div>
            {device === 'desktop' && cfg.navLinks.length > 0 && (
              <nav className="flex items-center gap-4">
                {cfg.navLinks.map(link => (
                  <span key={link.id} className="text-[11px] cursor-pointer" style={{ color: hdrMuted }}>
                    {link.label}
                  </span>
                ))}
              </nav>
            )}
            <div className="flex items-center gap-3">
              {cfg.showSearch && (
                <span className="text-[11px] cursor-pointer" style={{ color: hdrMuted }}>Search</span>
              )}
              {cfg.showCart && (
                <span className="text-[11px] cursor-pointer flex items-center gap-[3px]" style={{ color: hdrMuted }}>
                  <ShoppingCart size={11} /> 0
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Hero */}
        <section
          className="px-6 py-10 text-center"
          style={{ background: cfg.primaryColor + '1A' }}
        >
          <h2
            className="text-[20px] font-bold mb-2 leading-[1.25]"
            style={{ color: cfg.textColor, fontFamily: cfg.font + ', sans-serif' }}
          >
            Welcome to {cfg.storeName}
          </h2>
          <p className="text-[12px] mb-4 leading-[1.6]" style={{ color: '#8C8A82' }}>
            {cfg.tagline}
          </p>
          <button
            className="px-5 py-[9px] rounded-lg text-[12px] font-semibold text-white border-0 cursor-pointer"
            style={{ background: cfg.primaryColor }}
          >
            {cfg.heroText}
          </button>
        </section>

        {/* Magazine hero slot */}
        {cfg.layoutStyle === 'Magazine' && (
          <section className="p-5">
            <div
              className="rounded-xl overflow-hidden flex items-center justify-center"
              style={{ height: 100, background: cfg.primaryColor + '22' }}
            >
              <p className="text-[12px] font-semibold" style={{ color: cfg.primaryColor }}>
                ★ Featured Highlight
              </p>
            </div>
          </section>
        )}

        {/* Products */}
        <section className="px-5 pb-5 pt-4">
          <h3
            className="text-[14px] font-bold mb-3"
            style={{ color: cfg.textColor, fontFamily: cfg.font + ', sans-serif' }}
          >
            Featured Products
          </h3>
          <div className={`grid gap-3 ${gridCols}`}>
            {products.map(p => (
              <div
                key={p.name}
                className="rounded-[8px] bg-white overflow-hidden border border-[#E8E6DC] shadow-[0_1px_3px_rgba(0,0,0,0.06)] cursor-pointer"
                style={cfg.layoutStyle === 'Minimal' ? { border: 'none', borderRadius: 0, borderBottom: '1px solid #E8E6DC', boxShadow: 'none' } : {}}
              >
                <div
                  className="h-[70px] flex items-center justify-center text-[24px]"
                  style={{ background: p.bg }}
                >
                  <span style={{ color: p.fg }}>📚</span>
                </div>
                <div className="p-[9px]">
                  <p className="text-[10px] font-semibold leading-[1.35] mb-[3px] line-clamp-2" style={{ color: cfg.textColor }}>
                    {p.name}
                  </p>
                  {cfg.showRatings && (
                    <div className="flex items-center gap-[3px] mb-[3px]">
                      <Star size={8} className="fill-[#F59E0B] text-[#F59E0B]" />
                      <span className="text-[9px] text-[#8C8A82]">{p.rating} ({p.reviews})</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-1 mt-[4px]">
                    {cfg.showPrice && (
                      <span className="text-[11px] font-bold" style={{ color: cfg.primaryColor }}>{p.price}</span>
                    )}
                    {cfg.showAddToCart && (
                      <button
                        className="text-[9px] font-semibold px-[7px] py-[3px] rounded-[5px] text-white border-0 cursor-pointer shrink-0"
                        style={{ background: cfg.primaryColor }}
                      >
                        + Cart
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer
          className="px-5 pt-6 pb-4 mt-2 border-t border-[#E8E6DC]"
          style={{ background: cfg.headerStyle === 'dark' ? '#2C2A28' : cfg.bgColor }}
        >
          <div className="flex items-center gap-[6px] mb-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white shrink-0"
              style={{ background: cfg.primaryColor }}
            >
              {cfg.storeName.charAt(0)}
            </div>
            <span
              className="text-[12px] font-bold"
              style={{ color: cfg.headerStyle === 'dark' ? '#fff' : cfg.textColor, fontFamily: cfg.font + ', sans-serif' }}
            >
              {cfg.storeName}
            </span>
          </div>
          <p className="text-[10px] mb-3" style={{ color: cfg.headerStyle === 'dark' ? '#9C9A94' : '#8C8A82' }}>
            {cfg.footerTagline}
          </p>
          {cfg.footerLinks.length > 0 && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2">
              {cfg.footerLinks.map(link => (
                <span
                  key={link.id}
                  className="text-[10px] cursor-pointer"
                  style={{ color: cfg.headerStyle === 'dark' ? '#9C9A94' : '#8C8A82' }}
                >
                  {link.label}
                </span>
              ))}
            </div>
          )}
          <p className="text-[9px]" style={{ color: cfg.headerStyle === 'dark' ? '#6C6A64' : '#B0AEA8' }}>
            {cfg.copyright}
          </p>
        </footer>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function StoreBuilder() {
  usePageTitle('Store Builder');

  const { storeId } = useParams<{ storeId: string }>();
  const { store }   = useGetStore(storeId ?? '');
  const { execute: updateStore, loading: saving, error: saveError } = useUpdateStore();

  const [activeSection, setActiveSection] = useState<Section>('theme');
  const [device,        setDevice]        = useState<Device>('desktop');
  const [saved,         setSaved]         = useState(false);
  const [history,       setHistory]       = useState<Config[]>([]);

  const [cfg, setCfg] = useState<Config>(() => {
    if (!storeId) return DEFAULT;
    try {
      const raw = localStorage.getItem(`sb-${storeId}`);
      return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
    } catch { return DEFAULT; }
  });

  // Sync store name / description once when store first loads
  const synced = useRef(false);
  useEffect(() => {
    if (store && !synced.current) {
      synced.current = true;
      setCfg(prev => ({
        ...prev,
        storeName: store.name        || prev.storeName,
        tagline:   store.description || prev.tagline,
        copyright: `© ${CUR_YEAR} ${store.name || prev.storeName}. All rights reserved.`,
        metaTitle: store.name ? `${store.name} — Quality Products` : prev.metaTitle,
      }));
    }
  }, [store]);

  const set = useCallback((patch: Partial<Config>) => {
    setCfg(prev => {
      setHistory(h => [...h.slice(-29), prev]);
      return { ...prev, ...patch };
    });
  }, []);

  const undo = () => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setCfg(prev);
      return h.slice(0, -1);
    });
  };

  const handleSave = async () => {
    if (storeId) {
      localStorage.setItem(`sb-${storeId}`, JSON.stringify(cfg));
      await updateStore({ storeId, name: cfg.storeName, description: cfg.tagline });
    } else {
      await new Promise(r => setTimeout(r, 600));
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const PageHeader = storeId ? StorePageHeader : SellerPageHeader;

  const headerActions = (
    <>
      {saveError && (
        <span className="text-[11px] text-red-500 max-w-[160px] truncate">{saveError}</span>
      )}
      <button
        onClick={undo}
        disabled={!history.length}
        title="Undo last change"
        className="flex items-center gap-[5px] px-3 py-[7px] bg-white border border-bone rounded-lg text-[12px] font-medium text-slate cursor-pointer hover:border-[#C0BDB5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <RotateCcw size={12} /> Undo
      </button>
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-[5px] px-4 py-[7px] border-none rounded-lg text-[12px] font-semibold text-white cursor-pointer disabled:opacity-60 transition-colors"
        style={{ background: saved ? '#16A34A' : '#D97757' }}
      >
        {saving
          ? <><Loader2 size={12} className="animate-spin" /> Saving…</>
          : saved
            ? <><Check size={12} /> Saved!</>
            : 'Publish Changes'
        }
      </button>
    </>
  );

  return (
    <>
      <PageHeader
        title="Store Builder"
        subtitle="Customize your storefront — changes preview live."
        actions={headerActions}
      />

      <div
        className="px-5 pt-4 pb-4 flex gap-4"
        style={{ height: 'calc(100vh - 108px)' }}
      >
        {/* ── LEFT: sections nav + active panel ── */}
        <div className="flex flex-col gap-3 overflow-y-auto shrink-0 w-[240px] scrollbar-hide">

          {/* Section nav */}
          <div className="bg-white border border-bone rounded-[10px] overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] shrink-0">
            {SECTIONS.map((sec, i) => {
              const active = activeSection === sec.id;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className="w-full flex items-center gap-[10px] px-[14px] py-[11px] text-left cursor-pointer border-none transition-[background] duration-[120ms]"
                  style={{
                    background:   active ? '#FBECE4' : 'transparent',
                    borderBottom: i < SECTIONS.length - 1 ? '1px solid #F0EEE6' : 'none',
                  }}
                >
                  <sec.Icon size={14} className="shrink-0" style={{ color: active ? '#B95A3A' : '#8C8A82' }} />
                  <span className="flex-1 text-[13px] font-medium" style={{ color: active ? '#B95A3A' : '#141413' }}>
                    {sec.label}
                  </span>
                  <span className="text-[13px] text-[#C0BDB5]">›</span>
                </button>
              );
            })}
          </div>

          {/* Active section panel */}
          {activeSection === 'theme'    && <ThemePanel    cfg={cfg} set={set} />}
          {activeSection === 'layout'   && <LayoutPanel   cfg={cfg} set={set} />}
          {activeSection === 'header'   && <HeaderPanel   cfg={cfg} set={set} />}
          {activeSection === 'products' && <ProductsPanel cfg={cfg} set={set} />}
          {activeSection === 'footer'   && <FooterPanel   cfg={cfg} set={set} />}
          {activeSection === 'seo'      && <SEOPanel      cfg={cfg} set={set} />}
        </div>

        {/* ── RIGHT: live preview ── */}
        <div className="flex-1 flex flex-col border border-bone rounded-xl bg-white overflow-hidden shadow-[0_1px_4px_rgba(0,0,0,0.04)] min-w-0">

          {/* Browser chrome bar */}
          <div className="flex items-center gap-3 px-4 py-[10px] border-b border-bone bg-[#F5F4F0] shrink-0">
            <div className="flex items-center gap-[5px] shrink-0">
              <div className="w-[11px] h-[11px] rounded-full bg-[#E05252]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#E0BE52]" />
              <div className="w-[11px] h-[11px] rounded-full bg-[#52C45A]" />
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white border border-bone rounded-lg px-3 py-[5px] text-[11px] text-[#8C8A82] flex items-center gap-[5px] min-w-[200px] justify-center">
                <Lock size={9} />
                {cfg.storeName.toLowerCase().replace(/\s+/g, '-')}.solvexo.store
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {(['desktop', 'mobile'] as Device[]).map(d => (
                <button
                  key={d}
                  onClick={() => setDevice(d)}
                  title={d === 'desktop' ? 'Desktop view' : 'Mobile view'}
                  className="w-7 h-7 rounded-[6px] flex items-center justify-center border-0 cursor-pointer transition-colors"
                  style={{ background: device === d ? '#FBECE4' : '#E8E6DC' }}
                >
                  {d === 'desktop'
                    ? <Monitor    size={13} style={{ color: device === d ? '#B95A3A' : '#8C8A82' }} />
                    : <Smartphone size={13} style={{ color: device === d ? '#B95A3A' : '#8C8A82' }} />
                  }
                </button>
              ))}
            </div>
          </div>

          {/* Live preview */}
          <StorePreview cfg={cfg} device={device} />
        </div>
      </div>
    </>
  );
}
