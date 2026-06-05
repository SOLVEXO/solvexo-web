import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, Lightbulb, Star, BookOpen, Download, Gem, Home, Briefcase, Palette, FileText, Music, Monitor, Camera, Mic, Edit3, Leaf, Target, Gift, Microscope, Footprints, Scissors, Image, Package } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

const CATEGORY_ICONS: LucideIcon[] = [BookOpen, Download, Gem, Home, Briefcase, Palette, FileText, Music, Monitor, Camera, Mic, Edit3, Leaf, Target, Gift, Microscope, Footprints, Scissors, Image, Package];

interface SubCat { name: string; slug: string; count: number }
interface Cat {
  id: number;
  icon: LucideIcon;
  name: string;
  slug: string;
  products: number;
  status: 'Active' | 'Draft';
  featured: boolean;
  subs: SubCat[];
}

const DEFAULT_CATS: Cat[] = [
  {
    id: 1, icon: BookOpen, name: 'Educational Resources', slug: 'educational-resources',
    products: 184, status: 'Active', featured: true,
    subs: [
      { name: 'Math',    slug: 'math',    count: 62 },
      { name: 'Science', slug: 'science', count: 38 },
      { name: 'English', slug: 'english', count: 41 },
      { name: 'History', slug: 'history', count: 24 },
      { name: 'Art',     slug: 'art',     count: 19 },
    ],
  },
  {
    id: 2, icon: Download, name: 'Digital Downloads', slug: 'digital-downloads',
    products: 97, status: 'Active', featured: true,
    subs: [
      { name: 'Templates',  slug: 'templates',  count: 34 },
      { name: 'Fonts',      slug: 'fonts',      count: 18 },
      { name: 'Stock Photos',slug: 'photos',    count: 27 },
      { name: 'Audio',      slug: 'audio',      count: 18 },
    ],
  },
  {
    id: 3, icon: Gem, name: 'Handmade & Crafts', slug: 'handmade-crafts',
    products: 43, status: 'Active', featured: false,
    subs: [
      { name: 'Ceramics', slug: 'ceramics', count: 16 },
      { name: 'Textiles', slug: 'textiles', count: 14 },
      { name: 'Jewelry',  slug: 'jewelry',  count: 13 },
    ],
  },
  {
    id: 4, icon: Home, name: 'Home & Lifestyle', slug: 'home-lifestyle',
    products: 29, status: 'Active', featured: false,
    subs: [
      { name: 'Decor',    slug: 'decor',    count: 12 },
      { name: 'Kitchen',  slug: 'kitchen',  count: 10 },
      { name: 'Garden',   slug: 'garden',   count: 7 },
    ],
  },
  {
    id: 5, icon: Briefcase, name: 'Business Tools', slug: 'business-tools',
    products: 0, status: 'Draft', featured: false,
    subs: [],
  },
];

export function SellerCategories() {
  usePageTitle('Categories');
  const [cats, setCats]         = useState<Cat[]>(DEFAULT_CATS);
  const [expanded, setExpanded] = useState<number[]>([1]);
  const [addingCat, setAddingCat] = useState(false);
  const [editCatId, setEditCatId] = useState<number | null>(null);
  const [addingSubId, setAddingSubId] = useState<number | null>(null);
  const [editSubIdx, setEditSubIdx]   = useState<{ catId: number; idx: number } | null>(null);
  const [selectedIcon, setSelectedIcon] = useState<LucideIcon>(() => BookOpen);

  // New cat form state
  const [newName, setNewName]   = useState('');
  const [newSlug, setNewSlug]   = useState('');
  const [newDesc, setNewDesc]   = useState('');

  // New sub form state
  const [subName, setSubName]   = useState('');
  const [subSlug, setSubSlug]   = useState('');

  const toggleExpand = (id: number) =>
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleFeatured = (id: number) =>
    setCats(prev => prev.map(c => c.id === id ? { ...c, featured: !c.featured } : c));

  const toggleStatus = (id: number) =>
    setCats(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'Active' ? 'Draft' : 'Active' } : c));

  const deleteCat = (id: number) =>
    setCats(prev => prev.filter(c => c.id !== id));

  const createCat = () => {
    if (!newName) return;
    const newCat: Cat = {
      id: Date.now(), icon: selectedIcon, name: newName,
      slug: newSlug || newName.toLowerCase().replace(/\s+/g, '-'),
      products: 0, status: 'Active', featured: false, subs: [],
    };
    setCats(prev => [...prev, newCat]);
    setAddingCat(false);
    setNewName(''); setNewSlug(''); setNewDesc(''); setSelectedIcon(() => BookOpen);
  };

  const addSub = (catId: number) => {
    if (!subName) return;
    setCats(prev => prev.map(c => c.id === catId
      ? { ...c, subs: [...c.subs, { name: subName, slug: subSlug || subName.toLowerCase().replace(/\s+/g, '-'), count: 0 }] }
      : c
    ));
    setAddingSubId(null);
    setSubName(''); setSubSlug('');
  };

  const deleteSub = (catId: number, idx: number) =>
    setCats(prev => prev.map(c => c.id === catId
      ? { ...c, subs: c.subs.filter((_, i) => i !== idx) }
      : c
    ));

  const totalSubs = cats.reduce((acc, c) => acc + c.subs.length, 0);
  const featured  = cats.filter(c => c.featured).length;
  const productsTotal = cats.reduce((acc, c) => acc + c.products, 0);

  return (
    <>
      <SellerPageHeader
        title="Categories & Subcategories"
        subtitle="Build your product taxonomy."
        actions={
          <>
            <Button variant="ghost"   size="sm">View Products</Button>
            <Button variant="ghost"   size="sm">Settings</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Metrics */}
        <div style={{ display: 'flex', gap: '14px' }}>
          <MetricCard label="Total Categories"    value={cats.length}    />
          <MetricCard label="Subcategories"        value={totalSubs}      />
          <MetricCard label="Featured"             value={featured}       />
          <MetricCard label="Products Categorised" value={productsTotal}  />
        </div>

        {/* Add category button */}
        <div className="flex justify-end">
          <Button variant="primary" size="sm" onClick={() => setAddingCat(true)}>
            + Add Category
          </Button>
        </div>

        {/* Add category form */}
        {addingCat && (
          <div className="rounded-xl border-2 bg-white p-5" style={{ borderColor: '#D97757' }}>
            <p className="text-[14px] font-bold text-carbon mb-4">New Category</p>
            <div className="flex flex-col gap-4">
              {/* Icon picker */}
              <div>
                <p className="text-[12px] font-medium text-charcoal mb-2">Icon</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_ICONS.map((IconComp, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedIcon(() => IconComp)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center border-2 transition-all cursor-pointer"
                      style={{
                        borderColor: selectedIcon === IconComp ? '#D97757' : '#E8E6DC',
                        background:  selectedIcon === IconComp ? '#FBECE4' : '#FFFFFF',
                      }}
                    >
                      <IconComp size={18} style={{ color: selectedIcon === IconComp ? '#D97757' : '#8C8A82' }} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Name" placeholder="Category name…" value={newName} onChange={e => { setNewName(e.target.value); setNewSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }} />
                <Input label="Slug" placeholder="category-slug" value={newSlug} onChange={e => setNewSlug(e.target.value)} />
              </div>
              <Textarea label="Description (optional)" placeholder="Describe this category…" rows={2} value={newDesc} onChange={e => setNewDesc(e.target.value)} />
              <div className="flex gap-2">
                <Button variant="primary" size="sm" onClick={createCat}>Create Category</Button>
                <Button variant="ghost"   size="sm" onClick={() => setAddingCat(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        {/* Categories list */}
        <div className="flex flex-col gap-3">
          {cats.map(cat => {
            const isExpanded = expanded.includes(cat.id);
            const isEditing  = editCatId === cat.id;

            return (
              <Card key={cat.id} padding="none">
                {/* Category row */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* Drag handle */}
                  <span style={{ color: '#E8E6DC', fontSize: 16, cursor: 'grab' }} className="select-none">⋮⋮</span>

                  {/* Icon */}
                  <div
                    className="flex items-center justify-center flex-shrink-0"
                    style={{ width: 40, height: 40, borderRadius: 10, background: '#FBECE4' }}
                  >
                    <cat.icon size={22} style={{ color: '#D97757' }} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <Input
                        defaultValue={cat.name}
                        className="max-w-[240px]"
                        onBlur={e => {
                          setCats(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value } : c));
                          setEditCatId(null);
                        }}
                        autoFocus
                      />
                    ) : (
                      <>
                        <p style={{ fontSize: 14, fontWeight: 600, color: '#141413' }}>{cat.name}</p>
                        <p style={{ fontSize: 11, color: '#8C8A82' }}>/{cat.slug} · {cat.products} products · {cat.subs.length} subcategories</p>
                      </>
                    )}
                  </div>

                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    {cat.featured && <Badge color="orange"><Star size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3, color: '#fff', fill: '#fff' }} />Featured</Badge>}
                    <Badge color={cat.status === 'Active' ? 'green' : 'gray'}>{cat.status}</Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleFeatured(cat.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-cream cursor-pointer transition-colors"
                      title="Toggle featured"
                    >
                      <Star size={14} style={{ opacity: cat.featured ? 1 : 0.4, color: '#D97757', fill: cat.featured ? '#D97757' : 'none' }} />
                    </button>
                    <button
                      onClick={() => toggleStatus(cat.id)}
                      className="px-2 py-1 rounded text-[10px] font-medium cursor-pointer transition-all"
                      style={{
                        background: cat.status === 'Active' ? '#2D8A4E' : '#E8E6DC',
                        color:      cat.status === 'Active' ? '#FFFFFF'  : '#8C8A82',
                        border:     'none',
                      }}
                    >
                      {cat.status}
                    </button>
                    <button
                      onClick={() => setEditCatId(cat.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-cream cursor-pointer transition-colors text-slate"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => deleteCat(cat.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-cream cursor-pointer transition-colors text-slate"
                    >
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-cream cursor-pointer text-slate"
                      style={{ transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                </div>

                {/* Subcategories */}
                {isExpanded && (
                  <div className="border-t border-bone px-4 py-3 flex flex-col gap-2">
                    {cat.subs.map((sub, idx) => (
                      <div
                        key={sub.slug + idx}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-bone"
                      >
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#D97757' }} />
                        {editSubIdx?.catId === cat.id && editSubIdx?.idx === idx ? (
                          <Input
                            defaultValue={sub.name}
                            className="flex-1"
                            autoFocus
                            onBlur={e => {
                              setCats(prev => prev.map(c => c.id === cat.id
                                ? { ...c, subs: c.subs.map((s, i) => i === idx ? { ...s, name: e.target.value } : s) }
                                : c
                              ));
                              setEditSubIdx(null);
                            }}
                          />
                        ) : (
                          <>
                            <span className="text-[13px] font-medium text-carbon flex-1">{sub.name}</span>
                            <span className="text-[11px] text-slate">/{sub.slug}</span>
                            <span className="text-[11px] text-slate">{sub.count} products</span>
                          </>
                        )}
                        <button
                          onClick={() => setEditSubIdx({ catId: cat.id, idx })}
                          className="text-[11px] text-slate hover:text-carbon cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteSub(cat.id, idx)}
                          className="text-[11px] text-slate hover:text-error cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    ))}

                    {/* Add sub form */}
                    {addingSubId === cat.id ? (
                      <div className="flex items-end gap-2 mt-1">
                        <Input
                          placeholder="Subcategory name…"
                          value={subName}
                          onChange={e => { setSubName(e.target.value); setSubSlug(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                        />
                        <Input
                          placeholder="slug"
                          value={subSlug}
                          onChange={e => setSubSlug(e.target.value)}
                          style={{ maxWidth: 140 }}
                        />
                        <Button variant="primary" size="sm" onClick={() => addSub(cat.id)}>Add</Button>
                        <Button variant="ghost"   size="sm" onClick={() => { setAddingSubId(null); setSubName(''); setSubSlug(''); }}>Cancel</Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setAddingSubId(cat.id)}
                        className="flex items-center gap-1.5 text-[12px] font-medium mt-1 cursor-pointer"
                        style={{ color: '#D97757' }}
                      >
                        + Add Subcategory
                      </button>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Tips card */}
        <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: '#FBECE4' }}>
          <Lightbulb size={20} style={{ color: '#B95A3A', flexShrink: 0, marginTop: 1 }} />
          <div>
            <p className="text-[13px] font-semibold" style={{ color: '#B95A3A' }}>Category Tips</p>
            <p className="text-[12px] mt-0.5" style={{ color: '#8C6050' }}>
              Use clear, descriptive names for categories. Featured categories appear on your storefront homepage.
              Drag to reorder categories and subcategories to control how buyers browse your shop.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
