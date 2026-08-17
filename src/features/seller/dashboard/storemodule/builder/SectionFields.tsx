import { Field, Toggle } from '@/components/comman/ui';
import type { SectionType } from '@/api/services/storefrontTypes';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

/** A section's own settings form (separate from its blocks) — heading is common to most types, the rest is type-specific. */
export function SectionFields({ type, settings, onChange }: {
  type: SectionType;
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
}) {
  const set = (patch: Record<string, any>) => onChange({ ...settings, ...patch });

  return (
    <div className="flex flex-col gap-2">
      {type !== 'hero' && (
        <Field label="Heading (optional)"><input className={inp} value={settings.heading ?? ''} onChange={e => set({ heading: e.target.value })} /></Field>
      )}

      {type === 'hero' && (
        <Field label="Height">
          <select className={inp} value={settings.heightPreset ?? 'medium'} onChange={e => set({ heightPreset: e.target.value })}>
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </Field>
      )}

      {type === 'rich_text' && (
        <Field label="Text alignment">
          <select className={inp} value={settings.alignment ?? 'left'} onChange={e => set({ alignment: e.target.value })}>
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </Field>
      )}

      {type === 'featured_products' && (
        <>
          <Field label="Source">
            <select className={inp} value={settings.source ?? 'pinned'} onChange={e => set({ source: e.target.value })}>
              <option value="pinned">Pinned / Featured</option>
              <option value="bestsellers">Best Sellers</option>
              <option value="newArrivals">New Arrivals</option>
              <option value="trending">Trending</option>
              <option value="category">A specific category</option>
              <option value="manual">Hand-picked products</option>
            </select>
          </Field>
          {settings.source === 'category' && (
            <Field label="Category ID" hint="Copy from a product's category selection.">
              <input className={inp} value={settings.categoryId ?? ''} onChange={e => set({ categoryId: e.target.value })} />
            </Field>
          )}
          {settings.source === 'manual' && (
            <Field label="Product IDs" hint="Comma-separated product IDs, in display order.">
              <input className={inp} value={(settings.productIds ?? []).join(', ')} onChange={e => set({ productIds: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })} />
            </Field>
          )}
          <Field label="How many to show">
            <input type="number" min={1} max={24} className={inp} value={settings.limit ?? 8} onChange={e => set({ limit: Number(e.target.value) })} />
          </Field>
        </>
      )}

      {type === 'product_catalog' && (
        <>
          <Field label="Default sort">
            <select className={inp} value={settings.defaultSort ?? 'newest'} onChange={e => set({ defaultSort: e.target.value })}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low–High</option>
              <option value="price_desc">Price: High–Low</option>
              <option value="best_rated">Best Rated</option>
            </select>
          </Field>
          <Field label="Columns">
            <select className={inp} value={settings.columns ?? 3} onChange={e => set({ columns: Number(e.target.value) })}>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </Field>
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-charcoal">Show tag filters</span>
            <Toggle checked={settings.showFilters !== false} onChange={v => set({ showFilters: v })} />
          </div>
        </>
      )}

      {type === 'video' && (
        <>
          <Field label="Video URL" required hint="YouTube or Vimeo link">
            <input className={inp} placeholder="https://youtube.com/watch?v=…" value={settings.videoUrl ?? ''} onChange={e => set({ videoUrl: e.target.value })} />
          </Field>
          <Field label="Aspect ratio">
            <select className={inp} value={settings.aspectRatio ?? '16:9'} onChange={e => set({ aspectRatio: e.target.value })}>
              <option value="16:9">16:9</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
            </select>
          </Field>
        </>
      )}
    </div>
  );
}
