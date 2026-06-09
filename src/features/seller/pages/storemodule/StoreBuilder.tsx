import { useState } from 'react';
import {
  Palette, LayoutGrid, PanelTop, Package, PanelBottom, Search,
  Monitor, Smartphone, BookOpen, Pencil, Microscope, Lock,
  type LucideIcon,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Types & Data ──────────────────────────────────────────────────────────────
type Section     = 'theme' | 'layout' | 'header' | 'products' | 'footer' | 'seo';
type LayoutStyle = 'Grid' | 'Magazine' | 'Minimal';

const SECTIONS: { id: Section; label: string; Icon: LucideIcon }[] = [
  { id: 'theme',    label: 'Theme',    Icon: Palette     },
  { id: 'layout',   label: 'Layout',   Icon: LayoutGrid  },
  { id: 'header',   label: 'Header',   Icon: PanelTop    },
  { id: 'products', label: 'Products', Icon: Package     },
  { id: 'footer',   label: 'Footer',   Icon: PanelBottom },
  { id: 'seo',      label: 'Seo',      Icon: Search      },
];

const THEME_COLORS = [
  { label: 'Primary',    value: '#D97757' },
  { label: 'Background', value: '#FAF9F5' },
  { label: 'Text',       value: '#2C2A28' },
  { label: 'Accent',     value: '#B95A3A' },
];

const LAYOUT_OPTIONS: { id: LayoutStyle; desc: string }[] = [
  { id: 'Grid',     desc: 'Classic product grid, best for large catalogues'             },
  { id: 'Magazine', desc: 'Editorial layout with featured products in hero spots'       },
  { id: 'Minimal',  desc: 'Clean whitespace-focused design for premium brands'          },
];

const PREVIEW_PRODUCTS: { Icon: LucideIcon; name: string; price: string }[] = [
  { Icon: Pencil,     name: 'Product Name 1', price: '$12.00' },
  { Icon: BookOpen,   name: 'Product Name 2', price: '$24.00' },
  { Icon: Microscope, name: 'Product Name 3', price: '$36.00' },
];

const poppins = "'Poppins', sans-serif";

// ── Component ─────────────────────────────────────────────────────────────────
export function StoreBuilder() {
  usePageTitle('Store Builder');
  const [activeSection, setActiveSection] = useState<Section>('theme');
  const [layoutStyle,   setLayoutStyle]   = useState<LayoutStyle>('Grid');
  const [font,          setFont]          = useState('Poppins (Current)');

  return (
    <>
      <SellerPageHeader
        title="Store Builder"
        subtitle="Customize your storefront — changes save automatically."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Preview
            </button>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Undo
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              Publish Changes
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', fontFamily: poppins }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '220px 1fr',
          gap: 16,
          height: 'calc(100vh - 160px)',
        }}>

          {/* ── LEFT: section list + panel ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto' }}>

            {/* Section nav */}
            <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              {SECTIONS.map((sec, i) => (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '11px 14px', textAlign: 'left', cursor: 'pointer',
                    background: activeSection === sec.id ? '#FBECE4' : 'transparent',
                    border: 'none',
                    borderBottom: i < SECTIONS.length - 1 ? '1px solid #F0EEE6' : 'none',
                    fontFamily: poppins, transition: 'background 0.12s',
                  }}
                >
                  <sec.Icon size={15} style={{ color: activeSection === sec.id ? '#B95A3A' : '#8C8A82', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500, color: activeSection === sec.id ? '#B95A3A' : '#141413' }}>
                    {sec.label}
                  </span>
                  <span style={{ fontSize: 14, color: '#C0BDB5' }}>›</span>
                </button>
              ))}
            </div>

            {/* Theme panel */}
            {activeSection === 'theme' && (
              <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#141413', marginBottom: 14 }}>Theme Colors</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {THEME_COLORS.map(tc => (
                    <div key={tc.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#4A4945' }}>{tc.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                          width: 22, height: 22, borderRadius: 5,
                          background: tc.value,
                          border: '1px solid #E8E6DC', cursor: 'pointer', flexShrink: 0,
                        }} />
                        <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#8C8A82' }}>{tc.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Font */}
                <div style={{ marginTop: 16 }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 6 }}>Font</p>
                  <select
                    value={font}
                    onChange={e => setFont(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', fontSize: 13,
                      border: '1px solid #E8E6DC', borderRadius: 8,
                      background: '#fff', color: '#2C2A28', outline: 'none',
                      cursor: 'pointer', fontFamily: poppins,
                    }}
                  >
                    {['Poppins (Current)','Inter','DM Sans','Lato','Playfair Display','Merriweather'].map(f => (
                      <option key={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Layout panel */}
            {activeSection === 'layout' && (
              <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#141413', marginBottom: 12 }}>Layout Style</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {LAYOUT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => setLayoutStyle(opt.id)}
                      style={{
                        width: '100%', textAlign: 'left', padding: '10px 12px',
                        borderRadius: 8, cursor: 'pointer', border: `2px solid ${layoutStyle === opt.id ? '#D97757' : '#E8E6DC'}`,
                        background: layoutStyle === opt.id ? '#FBECE4' : '#fff',
                        fontFamily: poppins, transition: 'all 0.12s',
                      }}
                    >
                      <p style={{ fontSize: 13, fontWeight: 600, color: layoutStyle === opt.id ? '#B95A3A' : '#141413', marginBottom: 2 }}>
                        {opt.id}
                      </p>
                      <p style={{ fontSize: 11, color: layoutStyle === opt.id ? '#B95A3A' : '#8C8A82' }}>
                        {opt.desc}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Generic panel */}
            {(activeSection === 'header' || activeSection === 'products' || activeSection === 'footer' || activeSection === 'seo') && (
              <div style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#141413', marginBottom: 6 }}>
                  {SECTIONS.find(s => s.id === activeSection)?.label} Settings
                </p>
                <p style={{ fontSize: 12, color: '#8C8A82' }}>
                  Advanced settings for this section are coming soon.
                </p>
              </div>
            )}
          </div>

          {/* ── RIGHT: Store preview ── */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            border: '1px solid #E8E6DC', borderRadius: 12,
            background: '#fff', overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>

            {/* Browser chrome */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '10px 16px', borderBottom: '1px solid #E8E6DC',
              background: '#F5F4F0', flexShrink: 0,
            }}>
              {/* Traffic lights */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#E05252' }} />
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#E0BE52' }} />
                <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#52C45A' }} />
              </div>

              {/* URL bar */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8,
                  padding: '4px 14px', fontSize: 12, color: '#8C8A82',
                  minWidth: 220, textAlign: 'center', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                }}>
                  <Lock size={10} /> myshop.solvexo.store
                </div>
              </div>

              {/* Device toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <button style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBECE4', border: 'none', cursor: 'pointer' }}>
                  <Monitor size={14} style={{ color: '#B95A3A' }} />
                </button>
                <button style={{ width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0EEE6', border: 'none', cursor: 'pointer' }}>
                  <Smartphone size={14} style={{ color: '#8C8A82' }} />
                </button>
              </div>
            </div>

            {/* Preview content */}
            <div style={{ flex: 1, overflowY: 'auto' }}>

              {/* Store header */}
              <header style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 32px', background: '#2C2A28', borderBottom: '1px solid #3A3836',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, background: '#D97757',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: '#fff',
                  }}>M</div>
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#fff' }}>My Shop</span>
                </div>
                <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                  {['Shop', 'About', 'Contact'].map(link => (
                    <a key={link} href="#" style={{ fontSize: 13, color: '#B0AEA8', textDecoration: 'none' }}>{link}</a>
                  ))}
                </nav>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: '#B0AEA8', cursor: 'pointer' }}>Search</span>
                  <span style={{ fontSize: 13, color: '#B0AEA8', cursor: 'pointer' }}>Cart (0)</span>
                </div>
              </header>

              {/* Hero */}
              <section style={{
                padding: '60px 32px', textAlign: 'center',
                background: '#FBECE4',
              }}>
                <h2 style={{
                  fontSize: 32, fontWeight: 700, color: '#141413',
                  fontFamily: 'Georgia, serif', marginBottom: 10, lineHeight: 1.2,
                }}>
                  Welcome to My Shop
                </h2>
                <p style={{ fontSize: 14, color: '#8C8A82', marginBottom: 24 }}>
                  Handcrafted educational resources for modern classrooms.
                </p>
                <button style={{
                  padding: '11px 28px', background: '#D97757', border: 'none',
                  borderRadius: 8, fontSize: 14, fontWeight: 600, color: '#fff',
                  cursor: 'pointer', fontFamily: poppins,
                }}>
                  Shop Now
                </button>
              </section>

              {/* Featured Products */}
              <section style={{ padding: '32px 32px' }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, color: '#141413', marginBottom: 20 }}>
                  Featured Products
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                  {PREVIEW_PRODUCTS.map(p => (
                    <div key={p.name} style={{
                      border: '1px solid #E8E6DC', borderRadius: 10,
                      background: '#fff', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: 120, background: '#EAF4EE',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <p.Icon size={38} style={{ color: '#5A8A6A' }} />
                      </div>
                      <div style={{ padding: '12px 14px' }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 4 }}>{p.name}</p>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#D97757' }}>{p.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}