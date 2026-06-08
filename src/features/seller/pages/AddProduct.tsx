import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Package, Download, BookOpen, Sparkles, Camera } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Types & Data ──────────────────────────────────────────────────────────────
type ProductType = 'physical' | 'digital' | 'educational';

const PRODUCT_TYPES: { id: ProductType; Icon: LucideIcon; label: string; desc: string }[] = [
  { id: 'physical',    Icon: Package,  label: 'Physical Product',    desc: 'Shipped to buyer'   },
  { id: 'digital',     Icon: Download, label: 'Digital Download',    desc: 'Instant download'   },
  { id: 'educational', Icon: BookOpen, label: 'Educational Resource',desc: 'Learning resource'  },
];

const DEFAULT_TAGS = ['math', 'grade 5', 'common core', 'fractions', 'worksheets'];

const poppins = "'Poppins', sans-serif";

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1px solid #E8E6DC', borderRadius: 8,
  outline: 'none', fontFamily: poppins, color: '#2C2A28',
  background: '#fff', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: '#4A4945',
  marginBottom: 5, display: 'block', fontFamily: poppins,
};

const cardStyle: React.CSSProperties = {
  background: '#fff', border: '1px solid #E8E6DC',
  borderRadius: 10, padding: '20px 22px',
  boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
};

const sectionTitle: React.CSSProperties = {
  fontSize: 14, fontWeight: 700, color: '#141413',
  marginBottom: 16, fontFamily: poppins,
};

// ── Component ─────────────────────────────────────────────────────────────────
export function AddProduct() {
  usePageTitle('Add Product');
  const [productType,   setProductType]   = useState<ProductType>('physical');
  const [tags,          setTags]          = useState<string[]>(DEFAULT_TAGS);
  const [tagInput,      setTagInput]      = useState('');
  const [title,         setTitle]         = useState('');
  const [desc,          setDesc]          = useState('');
  const [price,         setPrice]         = useState('');
  const [comparePrice,  setComparePrice]  = useState('');

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };
  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  return (
    <>
      <SellerPageHeader
        title="Add New Product"
        subtitle="Fill in product details to create your listing."
        actions={
          <>
            <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
              Save Draft
            </button>
            <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
              Publish Listing
            </button>
          </>
        }
      />

      <div style={{ padding: '20px 28px 32px', fontFamily: poppins }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>

          {/* ── LEFT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Product Type */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Product Type</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {PRODUCT_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setProductType(pt.id)}
                    style={{
                      padding: '20px 16px', textAlign: 'center',
                      borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${productType === pt.id ? '#D97757' : '#E8E6DC'}`,
                      background: productType === pt.id ? '#FBECE4' : '#fff',
                      fontFamily: poppins, transition: 'all 0.12s',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
                    }}
                  >
                    <pt.Icon size={28} style={{ color: productType === pt.id ? '#B95A3A' : '#8C8A82' }} />
                    <p style={{ fontSize: 13, fontWeight: 600, color: productType === pt.id ? '#B95A3A' : '#141413' }}>
                      {pt.label}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Basic Information */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Basic Information</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Title */}
                <div>
                  <label style={labelStyle}>Product Title *</label>
                  <input
                    placeholder="e.g. Grade 5 Math Bundle — Full Year Curriculum"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    style={inputStyle}
                  />
                </div>

                {/* Description */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Description *</label>
                    <button style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '4px 10px', background: '#FBECE4',
                      border: '1px solid #E8CE B4', borderRadius: 6,
                      fontSize: 11, fontWeight: 500, color: '#B95A3A',
                      cursor: 'pointer', fontFamily: poppins,
                    }}>
                      <Sparkles size={11} /> AI Write
                    </button>
                  </div>
                  <textarea
                    rows={5}
                    placeholder="Describe your product in detail. Include what's included, who it's for, and how to use it."
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
                  />
                </div>

                {/* Category + Sub-category */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Category</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Select category...</option>
                      <option>Educational Resources</option>
                      <option>Digital Downloads</option>
                      <option>Handmade &amp; Crafts</option>
                      <option>Home &amp; Lifestyle</option>
                      <option>Business Tools</option>
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Sub-category</label>
                    <select style={{ ...inputStyle, cursor: 'pointer' }}>
                      <option value="">Select sub-category...</option>
                      <option>Math</option>
                      <option>Science</option>
                      <option>English</option>
                      <option>History</option>
                      <option>Art</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Images */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Product Images</p>
              <div style={{
                border: '2px dashed #E8E6DC', borderRadius: 10,
                padding: '48px 24px', textAlign: 'center',
                cursor: 'pointer', transition: 'background 0.12s',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <Camera size={36} style={{ color: '#8C8A82', marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 6 }}>
                  Drag &amp; drop images here or click to browse
                </p>
                <p style={{ fontSize: 12, color: '#8C8A82' }}>
                  PNG, JPG, WEBP up to 10MB each. First image is the cover.
                </p>
              </div>
            </div>

            {/* Tags & SEO */}
            <div style={cardStyle}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <p style={{ ...sectionTitle, marginBottom: 0 }}>Tags &amp; SEO</p>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '5px 12px', background: '#FBECE4',
                  border: '1px solid #E8CEB4', borderRadius: 6,
                  fontSize: 11, fontWeight: 500, color: '#B95A3A',
                  cursor: 'pointer', fontFamily: poppins,
                }}>
                  <Sparkles size={11} /> AI Suggest Tags
                </button>
              </div>
              <input
                placeholder="Add tags separated by commas (e.g. math, grade 5, common core)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                style={{ ...inputStyle, marginBottom: 12 }}
              />
              {tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {tags.map(tag => (
                    <span
                      key={tag}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 6,
                        background: '#FBECE4', border: '1px solid #E8CEB4',
                        fontSize: 12, fontWeight: 500, color: '#B95A3A',
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        style={{ fontSize: 13, color: '#B95A3A', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, padding: 0 }}
                      >×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT column ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Pricing */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Pricing</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Price */}
                <div>
                  <label style={labelStyle}>Price *</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E8E6DC', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                    <span style={{ padding: '9px 10px', background: '#FAF9F5', fontSize: 13, color: '#8C8A82', borderRight: '1px solid #E8E6DC', fontFamily: poppins }}>$</span>
                    <input type="number" placeholder="0.00" value={price} onChange={e => setPrice(e.target.value)}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: 'none', outline: 'none', fontFamily: poppins, color: '#2C2A28', background: 'transparent' }} />
                  </div>
                </div>

                {/* Compare-at Price */}
                <div>
                  <label style={labelStyle}>Compare-at Price</label>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #E8E6DC', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
                    <span style={{ padding: '9px 10px', background: '#FAF9F5', fontSize: 13, color: '#8C8A82', borderRight: '1px solid #E8E6DC', fontFamily: poppins }}>$</span>
                    <input type="number" placeholder="0.00" value={comparePrice} onChange={e => setComparePrice(e.target.value)}
                      style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: 'none', outline: 'none', fontFamily: poppins, color: '#2C2A28', background: 'transparent' }} />
                  </div>
                </div>

                {/* AI Price hint */}
                <div style={{ background: '#FBECE4', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <Sparkles size={13} style={{ color: '#B95A3A', flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 12, color: '#8C6050', lineHeight: 1.5, fontFamily: poppins }}>
                    AI Price Suggester: Based on similar listings, <strong style={{ color: '#B95A3A' }}>$44–$54</strong> is the optimal range.
                  </p>
                </div>
              </div>
            </div>

            {/* Inventory & Shipping */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Inventory &amp; Shipping</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Stock Quantity</label>
                  <input type="number" placeholder="0" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>SKU / Barcode</label>
                  <input placeholder="Optional" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Shipping Weight</label>
                  <input placeholder="e.g. 0.5 kg" style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Listing Status */}
            <div style={cardStyle}>
              <p style={sectionTitle}>Listing Status</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <select style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option>Active — Visible in marketplace</option>
                    <option>Draft</option>
                    <option>Scheduled</option>
                  </select>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input type="checkbox" style={{ accentColor: '#D97757' }} />
                  <span style={{ fontSize: 13, color: '#4A4945', fontFamily: poppins }}>Also list in Solvexo Marketplace</span>
                </label>
              </div>
            </div>

            {/* Publish + Draft buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button style={{
                width: '100%', padding: '13px 0', background: '#D97757',
                border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600,
                color: '#fff', cursor: 'pointer', fontFamily: poppins,
              }}>
                Publish Listing
              </button>
              <button style={{
                width: '100%', padding: '11px 0', background: '#fff',
                border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 13,
                fontWeight: 500, color: '#8C8A82', cursor: 'pointer', fontFamily: poppins,
              }}>
                Save as Draft
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}