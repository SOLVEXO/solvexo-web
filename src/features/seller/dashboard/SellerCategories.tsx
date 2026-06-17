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
            <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">View Products</button>
            <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">Settings</button>
          </>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Metrics ── */}
        <div className="grid grid-cols-4 gap-3">
          {[['Total Categories', cats.length],['Subcategories', totalSubs],['Featured', featured],['Products Categorised', productsTotal]].map(([label, value]) => (
            <div key={label} className="bg-white border border-[#E8E6DC] rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-[#8C8A82] uppercase tracking-[0.06em] mb-1">{label}</p>
              <p className="text-[28px] font-bold text-[#141413] leading-[1.15]">{value}</p>
            </div>
          ))}
        </div>

        {/* ── Add Category button ── */}
        <div className="flex justify-end">
          <button onClick={() => setAddingCat(true)} className="px-[18px] py-2 bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
            + Add Category
          </button>
        </div>

        {/* ── Add Category Form ── */}
        {addingCat && (
          <div className="border-2 border-brand-orange rounded-[10px] bg-white px-[22px] py-5">
            <p className="text-sm font-bold text-[#141413] mb-4">New Category</p>
            <div className="flex flex-col gap-3.5">
              <div>
                <p className="text-xs font-medium text-[#4A4945] mb-[5px] block">Icon</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ICONS.map((IconComp, idx) => (
                    <button key={idx} onClick={() => setSelectedIcon(() => IconComp)}
                      className="w-[34px] h-[34px] rounded-lg flex items-center justify-center cursor-pointer"
                      style={{
                        border: `2px solid ${selectedIcon === IconComp ? '#D97757' : '#E8E6DC'}`,
                        background: selectedIcon === IconComp ? '#FBECE4' : '#fff',
                      }}
                    >
                      <IconComp size={16} style={{ color: selectedIcon === IconComp ? '#D97757' : '#8C8A82' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Name</label>
                  <input placeholder="Category name…" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Slug</label>
                  <input placeholder="category-slug" value={newSlug} onChange={e => setNewSlug(e.target.value)}
                    className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-[#4A4945] mb-[5px] block">Description (optional)</label>
                <textarea rows={2} placeholder="Describe this category…" value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  className="w-full px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border resize-y leading-[1.5]" />
              </div>
              <div className="flex gap-2">
                <button onClick={createCat} className="px-[18px] py-2 bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">Create Category</button>
                <button onClick={() => setAddingCat(false)} className="px-3.5 py-2 bg-white border border-[#E8E6DC] rounded-lg text-xs text-[#4A4945] cursor-pointer">Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* ── Categories List ── */}
        <div className="flex flex-col gap-3">
          {cats.map(cat => {
            const isExpanded = expanded.includes(cat.id);
            const isEditing  = editCatId === cat.id;
            return (
              <div key={cat.id} className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">
                {/* Category row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <span className="text-[#E8E6DC] text-base cursor-grab select-none">⋮⋮</span>
                  <div className="w-[38px] h-[38px] rounded-[9px] bg-[#FBECE4] flex items-center justify-center shrink-0">
                    <cat.icon size={20} style={{ color: '#D97757' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input defaultValue={cat.name} autoFocus
                        onBlur={e => { setCats(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c)); setEditCatId(null); }}
                        className="max-w-[240px] px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                    ) : (
                      <>
                        <p className="text-sm font-semibold text-[#141413]">{cat.name}</p>
                        <p className="text-[11px] text-[#8C8A82]">/{cat.slug} · {cat.products} products · {cat.subs.length} subcategories</p>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {cat.featured && (
                      <span className="px-[9px] py-[2px] rounded-[5px] text-[11px] font-semibold bg-[#FBECE4] text-[#B95A3A] flex items-center gap-1">
                        <Star size={9} style={{ fill: '#B95A3A', color: '#B95A3A' }} /> Featured
                      </span>
                    )}
                    <span
                      className="px-[9px] py-[2px] rounded-[5px] text-[11px] font-semibold"
                      style={{ background: cat.status === 'Active' ? '#E3F4EA' : '#F0EEE6', color: cat.status === 'Active' ? '#1E7A3C' : '#5A5852' }}
                    >
                      {cat.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleFeatured(cat.id)} title="Toggle featured"
                      className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-[#FAF9F5]">
                      <Star size={14} style={{ color: '#D97757', opacity: cat.featured ? 1 : 0.35, fill: cat.featured ? '#D97757' : 'none' }} />
                    </button>
                    <button onClick={() => toggleStatus(cat.id)}
                      className="px-2 py-[3px] rounded-[6px] text-[10px] font-semibold cursor-pointer border-none"
                      style={{ background: cat.status === 'Active' ? '#2D8A4E' : '#E8E6DC', color: cat.status === 'Active' ? '#fff' : '#8C8A82' }}>
                      {cat.status}
                    </button>
                    <button onClick={() => setEditCatId(cat.id)}
                      className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-[#FAF9F5]">
                      <Pencil size={13} style={{ color: '#8C8A82' }} />
                    </button>
                    <button onClick={() => deleteCat(cat.id)}
                      className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-transparent border-none cursor-pointer hover:bg-[#FAF9F5]">
                      <Trash2 size={13} style={{ color: '#8C8A82' }} />
                    </button>
                    <button onClick={() => toggleExpand(cat.id)}
                      className="w-7 h-7 rounded-[7px] flex items-center justify-center bg-transparent border-none cursor-pointer transition-transform duration-200"
                      style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                      <ChevronDown size={14} style={{ color: '#8C8A82' }} />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && (
                  <div className="border-t border-[#F0EEE6] px-4 py-3 flex flex-col gap-2">
                    {cat.subs.map((sub, idx) => (
                      <div key={sub.slug + idx} className="flex items-center gap-2.5 px-3 py-[9px] rounded-lg bg-white border border-[#F0EEE6]">
                        <div className="w-[7px] h-[7px] rounded-full bg-brand-orange shrink-0" />
                        {editSubIdx?.catId === cat.id && editSubIdx?.idx === idx ? (
                          <input defaultValue={sub.name} autoFocus
                            onBlur={e => { setCats(prev => prev.map(c => c.id === cat.id ? { ...c, subs: c.subs.map((s, i) => i === idx ? { ...s, name: e.target.value } : s) } : c)); setEditSubIdx(null); }}
                            className="flex-1 px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                        ) : (
                          <>
                            <span className="text-[13px] font-medium text-[#141413] flex-1">{sub.name}</span>
                            <span className="text-[11px] text-[#8C8A82]">/{sub.slug}</span>
                            <span className="text-[11px] text-[#8C8A82]">{sub.count} products</span>
                          </>
                        )}
                        <button onClick={() => setEditSubIdx({ catId: cat.id, idx })} className="text-[11px] text-[#8C8A82] bg-transparent border-none cursor-pointer">Edit</button>
                        <button onClick={() => deleteSub(cat.id, idx)} className="text-[11px] text-[#C0392B] bg-transparent border-none cursor-pointer">Delete</button>
                      </div>
                    ))}

                    {/* Add sub form */}
                    {addingSubId === cat.id ? (
                      <div className="flex items-center gap-2 mt-1">
                        <input placeholder="Subcategory name…" value={subName} onChange={e => { setSubName(e.target.value); setSubSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                          className="flex-1 px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                        <input placeholder="slug" value={subSlug} onChange={e => setSubSlug(e.target.value)}
                          className="w-[130px] px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
                        <button onClick={() => addSub(cat.id)} className="px-3.5 py-2 bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">Add</button>
                        <button onClick={() => { setAddingSubId(null); setSubName(''); setSubSlug(''); }} className="px-3 py-2 bg-white border border-[#E8E6DC] rounded-lg text-xs text-[#4A4945] cursor-pointer">Cancel</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddingSubId(cat.id)} className="text-xs font-medium text-brand-orange bg-transparent border-none cursor-pointer text-left mt-0.5">
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
        <div className="rounded-[10px] px-[18px] py-3.5 flex items-start gap-3 bg-[#FBECE4]">
          <Lightbulb size={20} className="text-[#B95A3A] shrink-0 mt-[1px]" />
          <div>
            <p className="text-[13px] font-semibold text-[#B95A3A] mb-1">Category Tips</p>
            <p className="text-xs text-[#8C6050] leading-[1.6]">
              Use clear, descriptive names for categories. Featured categories appear on your storefront homepage.
              Drag to reorder categories and subcategories to control how buyers browse your shop.
            </p>
          </div>
        </div>

      </div>
    </>
  );
}
