import { useState } from 'react';
import {
  Pencil, Trash2, ChevronDown, Lightbulb, Star,
  BookOpen, Download, Gem, Home, Briefcase, Palette, FileText,
  Music, Monitor, Camera, Mic, Edit3, Leaf, Target, Gift,
  Microscope, Footprints, Scissors, Image, Package,
  type LucideIcon,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
const CATEGORY_ICONS: LucideIcon[] = [
  BookOpen, Download, Gem, Home, Briefcase, Palette, FileText,
  Music, Monitor, Camera, Mic, Edit3, Leaf, Target, Gift,
  Microscope, Footprints, Scissors, Image, Package,
];

interface SubCat { name: string; slug: string; count: number }
interface Cat {
  id: number; icon: LucideIcon; name: string; slug: string;
  products: number; status: 'Active' | 'Draft'; featured: boolean; subs: SubCat[];
}

const DEFAULT_CATS: Cat[] = [
  { id: 1, icon: BookOpen, name: 'Educational Resources', slug: 'educational-resources', products: 184, status: 'Active', featured: true,
    subs: [{ name: 'Math', slug: 'math', count: 62 },{ name: 'Science', slug: 'science', count: 38 },{ name: 'English', slug: 'english', count: 41 },{ name: 'History', slug: 'history', count: 24 },{ name: 'Art', slug: 'art', count: 19 }] },
  { id: 2, icon: Download, name: 'Digital Downloads', slug: 'digital-downloads', products: 97, status: 'Active', featured: true,
    subs: [{ name: 'Templates', slug: 'templates', count: 34 },{ name: 'Fonts', slug: 'fonts', count: 18 },{ name: 'Stock Photos', slug: 'photos', count: 27 },{ name: 'Audio', slug: 'audio', count: 18 }] },
  { id: 3, icon: Gem, name: 'Handmade & Crafts', slug: 'handmade-crafts', products: 43, status: 'Active', featured: false,
    subs: [{ name: 'Ceramics', slug: 'ceramics', count: 16 },{ name: 'Textiles', slug: 'textiles', count: 14 },{ name: 'Jewelry', slug: 'jewelry', count: 13 }] },
  { id: 4, icon: Home, name: 'Home & Lifestyle', slug: 'home-lifestyle', products: 29, status: 'Active', featured: false,
    subs: [{ name: 'Decor', slug: 'decor', count: 12 },{ name: 'Kitchen', slug: 'kitchen', count: 10 },{ name: 'Garden', slug: 'garden', count: 7 }] },
  { id: 5, icon: Briefcase, name: 'Business Tools', slug: 'business-tools', products: 0, status: 'Draft', featured: false, subs: [] },
];

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', overflow: 'hidden' };
const inputStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, outline: 'none', fontFamily: poppins, color: '#2C2A28', background: '#fff', boxSizing: 'border-box' as const };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 5, display: 'block', fontFamily: poppins };

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerCategories() {
  usePageTitle('Categories');
  const [cats,          setCats]         = useState<Cat[]>(DEFAULT_CATS);
  const [expanded,      setExpanded]     = useState<number[]>([1]);
  const [addingCat,     setAddingCat]    = useState(false);
  const [editCatId,     setEditCatId]    = useState<number | null>(null);
  const [addingSubId,   setAddingSubId]  = useState<number | null>(null);
  const [editSubIdx,    setEditSubIdx]   = useState<{ catId: number; idx: number } | null>(null);
  const [selectedIcon,  setSelectedIcon] = useState<LucideIcon>(() => BookOpen);
  const [newName,       setNewName]      = useState('');
  const [newSlug,       setNewSlug]      = useState('');
  const [newDesc,       setNewDesc]      = useState('');
  const [subName,       setSubName]      = useState('');
  const [subSlug,       setSubSlug]      = useState('');

  const toggleExpand   = (id: number) => setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleFeatured = (id: number) => setCats(prev => prev.map(c => c.id === id ? { ...c, featured: !c.featured } : c));
  const toggleStatus   = (id: number) => setCats(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Draft' : 'Active' } : c));
  const deleteCat      = (id: number) => setCats(prev => prev.filter(c => c.id !== id));

  const createCat = () => {
    if (!newName) return;
    setCats(prev => [...prev, { id: Date.now(), icon: selectedIcon, name: newName, slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'), products: 0, status: 'Active', featured: false, subs: [] }]);
    setAddingCat(false); setNewName(''); setNewSlug(''); setNewDesc(''); setSelectedIcon(() => BookOpen);
  };

  const addSub = (catId: number) => {
    if (!subName) return;
    setCats(prev => prev.map(c => c.id === catId ? { ...c, subs: [...c.subs, { name: subName, slug: subSlug || subName.toLowerCase().replace(/\s+/g, '-'), count: 0 }] } : c));
    setAddingSubId(null); setSubName(''); setSubSlug('');
  };

  const deleteSub = (catId: number, idx: number) =>
    setCats(prev => prev.map(c => c.id === catId ? { ...c, subs: c.subs.filter((_, i) => i !== idx) } : c));

  const totalSubs      = cats.reduce((acc, c) => acc + c.subs.length, 0);
  const featured       = cats.filter(c => c.featured).length;
  const productsTotal  = cats.reduce((acc, c) => acc + c.products, 0);

  return (
    <>
      <SellerPageHeader
        title="Categories & Subcategories"
        subtitle="Build your product taxonomy."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>View Products</button>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Settings</button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[['Total Categories', cats.length],['Subcategories', totalSubs],['Featured', featured],['Products Categorised', productsTotal]].map(([label, value]) => (
            <div key={label} style={{ background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '16px 20px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Add Category button ── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setAddingCat(true)} style={{ padding: '8px 18px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
            + Add Category
          </button>
        </div>

        {/* ── Add Category Form ── */}
        {addingCat && (
          <div style={{ border: '2px solid #D97757', borderRadius: 10, background: '#fff', padding: '20px 22px' }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 16 }}>New Category</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <p style={labelStyle}>Icon</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {CATEGORY_ICONS.map((IconComp, idx) => (
                    <button key={idx} onClick={() => setSelectedIcon(() => IconComp)} style={{
                      width: 34, height: 34, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      border: `2px solid ${selectedIcon === IconComp ? '#D97757' : '#E8E6DC'}`,
                      background: selectedIcon === IconComp ? '#FBECE4' : '#fff', cursor: 'pointer',
                    }}>
                      <IconComp size={16} style={{ color: selectedIcon === IconComp ? '#D97757' : '#8C8A82' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Name</label>
                  <input placeholder="Category name…" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Slug</label>
                  <input placeholder="category-slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>Description (optional)</label>
                <textarea rows={2} placeholder="Describe this category…" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical', lineHeight: 1.5 }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={createCat} style={{ padding: '8px 18px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>Create Category</button>
                <button onClick={() => setAddingCat(false)} style={{ padding: '8px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Categories List ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cats.map(cat => {
            const isExpanded = expanded.includes(cat.id);
            const isEditing  = editCatId === cat.id;
            return (
              <div key={cat.id} style={cardStyle}>
                {/* Category row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                  <span style={{ color: '#E8E6DC', fontSize: 16, cursor: 'grab', userSelect: 'none' }}>⋮⋮</span>
                  <div style={{ width: 38, height: 38, borderRadius: 9, background: '#FBECE4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <cat.icon size={20} style={{ color: '#D97757' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <input defaultValue={cat.name} autoFocus
                        onBlur={e => { setCats(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c)); setEditCatId(null); }}
                        style={{ ...inputStyle, maxWidth: 240 }} />
                    ) : (
                      <>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', fontFamily: poppins }}>{cat.name}</p>
                        <p style={{ fontSize: 11, color: '#8C8A82', fontFamily: poppins }}>/{cat.slug} · {cat.products} products · {cat.subs.length} subcategories</p>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {cat.featured && (
                      <span style={{ padding: '2px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#FBECE4', color: '#B95A3A', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Star size={9} style={{ fill: '#B95A3A', color: '#B95A3A' }} /> Featured
                      </span>
                    )}
                    <span style={{ padding: '2px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: cat.status === 'Active' ? '#E3F4EA' : '#F0EEE6', color: cat.status === 'Active' ? '#1E7A3C' : '#5A5852' }}>
                      {cat.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => toggleFeatured(cat.id)} title="Toggle featured" style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <Star size={14} style={{ color: '#D97757', opacity: cat.featured ? 1 : 0.35, fill: cat.featured ? '#D97757' : 'none' }} />
                    </button>
                    <button onClick={() => toggleStatus(cat.id)} style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: 'none', background: cat.status === 'Active' ? '#2D8A4E' : '#E8E6DC', color: cat.status === 'Active' ? '#fff' : '#8C8A82', fontFamily: poppins }}>
                      {cat.status}
                    </button>
                    <button onClick={() => setEditCatId(cat.id)} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <Pencil size={13} style={{ color: '#8C8A82' }} />
                    </button>
                    <button onClick={() => deleteCat(cat.id)} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')} onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
                      <Trash2 size={13} style={{ color: '#8C8A82' }} />
                    </button>
                    <button onClick={() => toggleExpand(cat.id)} style={{ width: 28, height: 28, borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown size={14} style={{ color: '#8C8A82' }} />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid #F0EEE6', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {cat.subs.map((sub, idx) => (
                      <div key={sub.slug + idx} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8, background: '#fff', border: '1px solid #F0EEE6' }}>
                        <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#D97757', flexShrink: 0 }} />
                        {editSubIdx?.catId === cat.id && editSubIdx?.idx === idx ? (
                          <input defaultValue={sub.name} autoFocus
                            onBlur={e => { setCats(prev => prev.map(c => c.id === cat.id ? { ...c, subs: c.subs.map((s, i) => i === idx ? { ...s, name: e.target.value } : s) } : c)); setEditSubIdx(null); }}
                            style={{ ...inputStyle, flex: 1 }} />
                        ) : (
                          <>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#141413', flex: 1, fontFamily: poppins }}>{sub.name}</span>
                            <span style={{ fontSize: 11, color: '#8C8A82', fontFamily: poppins }}>/{sub.slug}</span>
                            <span style={{ fontSize: 11, color: '#8C8A82', fontFamily: poppins }}>{sub.count} products</span>
                          </>
                        )}
                        <button onClick={() => setEditSubIdx({ catId: cat.id, idx })} style={{ fontSize: 11, color: '#8C8A82', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>Edit</button>
                        <button onClick={() => deleteSub(cat.id, idx)} style={{ fontSize: 11, color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', fontFamily: poppins }}>Delete</button>
                      </div>
                    ))}

                    {/* Add sub form */}
                    {addingSubId === cat.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <input placeholder="Subcategory name…" value={subName} onChange={e => { setSubName(e.target.value); setSubSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                          style={{ ...inputStyle, flex: 1 }} />
                        <input placeholder="slug" value={subSlug} onChange={e => setSubSlug(e.target.value)}
                          style={{ ...inputStyle, width: 130 }} />
                        <button onClick={() => addSub(cat.id)} style={{ padding: '8px 14px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>Add</button>
                        <button onClick={() => { setAddingSubId(null); setSubName(''); setSubSlug(''); }} style={{ padding: '8px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingSubId(cat.id)} style={{ fontSize: 12, fontWeight: 500, color: '#D97757', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: poppins, marginTop: 2 }}>
                        + Add Subcategory
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Tips card ── */}
        <div style={{ borderRadius: 10, padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, background: '#FBECE4' }}>
          <Lightbulb size={20} style={{ color: '#B95A3A', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#B95A3A', marginBottom: 4, fontFamily: poppins }}>Category Tips</p>
            <p style={{ fontSize: 12, color: '#8C6050', lineHeight: 1.6, fontFamily: poppins }}>
              Use clear, descriptive names for categories. Featured categories appear on your storefront homepage.
              Drag to reorder categories and subcategories to control how buyers browse your shop.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}