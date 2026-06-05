import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

type ProductType = 'physical' | 'digital' | 'educational';

const PRODUCT_TYPES: { id: ProductType; emoji: string; label: string; desc: string }[] = [
  { id: 'physical',     emoji: '📦', label: 'Physical',     desc: 'Shipped to buyer' },
  { id: 'digital',      emoji: '💾', label: 'Digital',      desc: 'Instant download' },
  { id: 'educational',  emoji: '📚', label: 'Educational',  desc: 'Learning resource' },
];

const DEFAULT_TAGS = ['math', 'grade 5', 'common core', 'fractions', 'worksheets'];

export function AddProduct() {
  usePageTitle('Add Product');
  const [productType, setProductType] = useState<ProductType>('educational');
  const [tags, setTags]               = useState<string[]>(DEFAULT_TAGS);
  const [tagInput, setTagInput]       = useState('');
  const [title, setTitle]             = useState('');
  const [desc, setDesc]               = useState('');
  const [price, setPrice]             = useState('');
  const [comparePrice, setComparePrice] = useState('');

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags(prev => [...prev, t]);
    setTagInput('');
  };

  const removeTag = (tag: string) =>
    setTags(prev => prev.filter(t => t !== tag));

  return (
    <>
      <SellerPageHeader
        title="Add New Product"
        subtitle="Fill in product details to create your listing."
        actions={
          <>
            <Button variant="ghost"   size="sm">Save Draft</Button>
            <Button variant="primary" size="sm">Publish Listing</Button>
          </>
        }
      />

      <div className="p-7">
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          {/* LEFT column */}
          <div className="flex flex-col gap-5">
            {/* Product Type */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Product Type</p>
              <div className="grid grid-cols-3 gap-3">
                {PRODUCT_TYPES.map(pt => (
                  <button
                    key={pt.id}
                    onClick={() => setProductType(pt.id)}
                    className="text-left p-4 rounded-xl border-2 transition-all cursor-pointer"
                    style={{
                      borderColor: productType === pt.id ? '#D97757' : '#E8E6DC',
                      background:  productType === pt.id ? '#FBECE4' : '#FFFFFF',
                    }}
                  >
                    <div style={{ fontSize: 24 }} className="mb-2">{pt.emoji}</div>
                    <p className="text-[13px] font-semibold" style={{ color: productType === pt.id ? '#B95A3A' : '#141413' }}>
                      {pt.label}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: productType === pt.id ? '#B95A3A' : '#8C8A82' }}>
                      {pt.desc}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            {/* Basic Information */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Basic Information</p>
              <div className="flex flex-col gap-4">
                <Input
                  label="Product Title"
                  placeholder="e.g. Grade 5 Math Mastery Bundle…"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[12px] font-medium text-charcoal">Description</label>
                    <Button variant="secondary" size="sm">✨ AI Write</Button>
                  </div>
                  <Textarea
                    placeholder="Describe your product — what's included, who it's for, key benefits…"
                    rows={5}
                    value={desc}
                    onChange={e => setDesc(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select label="Category">
                    <option value="">Select category…</option>
                    <option>Educational Resources</option>
                    <option>Digital Downloads</option>
                    <option>Handmade & Crafts</option>
                    <option>Home & Lifestyle</option>
                    <option>Business Tools</option>
                  </Select>
                  <Select label="Sub-category">
                    <option value="">Select sub-category…</option>
                    <option>Math</option>
                    <option>Science</option>
                    <option>English</option>
                    <option>History</option>
                    <option>Art</option>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Product Images */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Product Images</p>
              <div
                className="rounded-xl border-2 border-dashed flex flex-col items-center justify-center py-12 cursor-pointer transition-colors hover:bg-cream"
                style={{ borderColor: '#E8E6DC' }}
              >
                <div style={{ fontSize: 36 }} className="mb-3">📸</div>
                <p className="text-[14px] font-semibold text-carbon mb-1">Drag & drop images here</p>
                <p className="text-[12px] text-slate mb-4">PNG, JPG, WEBP — up to 10 files, max 10 MB each</p>
                <Button variant="ghost" size="sm">Browse Files</Button>
              </div>
            </Card>

            {/* Tags & SEO */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Tags & SEO</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <Input
                      label="Add Tags"
                      placeholder="Type a tag and press Enter…"
                      value={tagInput}
                      onChange={e => setTagInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput); } }}
                    />
                  </div>
                  <Button variant="secondary" size="sm" className="mb-0.5" onClick={() => addTag(tagInput)}>
                    ✨ AI Suggest Tags
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-medium cursor-default"
                        style={{ background: '#FBECE4', borderColor: '#E8E6DC', color: '#B95A3A' }}
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-[10px] hover:text-error cursor-pointer"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* RIGHT column */}
          <div className="flex flex-col gap-5">
            {/* Pricing */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Pricing</p>
              <div className="flex flex-col gap-3">
                <Input
                  label="Price"
                  leftAddon="$"
                  type="number"
                  placeholder="0.00"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
                <Input
                  label="Compare-at Price"
                  leftAddon="$"
                  type="number"
                  placeholder="0.00"
                  value={comparePrice}
                  onChange={e => setComparePrice(e.target.value)}
                />
                <div
                  className="rounded-lg p-3 text-[12px]"
                  style={{ background: '#FBECE4', color: '#B95A3A' }}
                >
                  <p className="font-semibold mb-1">✨ AI Price Suggester</p>
                  <p style={{ color: '#8C6050' }}>
                    Based on similar products in Educational Resources, the suggested price is <strong>$39 – $55</strong>.
                  </p>
                </div>
              </div>
            </Card>

            {/* Inventory (physical only) */}
            {productType === 'physical' && (
              <Card>
                <p className="text-[14px] font-bold text-carbon mb-4">Inventory</p>
                <div className="flex flex-col gap-3">
                  <Input label="Stock Quantity"   type="number" placeholder="0" />
                  <Input label="SKU / Barcode"    placeholder="e.g. SKU-12345" />
                  <Input label="Shipping Weight (kg)" type="number" placeholder="0.00" />
                </div>
              </Card>
            )}

            {/* Listing Status */}
            <Card>
              <p className="text-[14px] font-bold text-carbon mb-4">Listing Status</p>
              <div className="flex flex-col gap-3">
                <Select label="Status">
                  <option>Active</option>
                  <option>Draft</option>
                  <option>Scheduled</option>
                </Select>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="accent-brand-orange" />
                  <span className="text-[13px] text-charcoal">Also list in Marketplace</span>
                </label>
              </div>
            </Card>

            {/* Publish */}
            <div className="flex flex-col gap-2">
              <Button variant="primary" size="md" fullWidth>Publish Listing</Button>
              <Button variant="ghost"   size="md" fullWidth>Save as Draft</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
