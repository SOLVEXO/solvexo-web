import { useState } from 'react';
import { Field, Toggle } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { LocationPickerMap } from '@/components/comman/ui/LocationPickerMap';
import type { SectionType } from '@/api/services/storefrontTypes';
import { EntityPickerModal } from './EntityPickerModal';
import { LinkTargetFields } from './LinkTargetFields';
import type { PageOption } from './BlockFields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

/** A section's own settings form (separate from its blocks) — heading is common to most types, the rest is type-specific. */
export function SectionFields({ type, settings, onChange, storeId, pageOptions }: {
  type: SectionType;
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  storeId: string;
  pageOptions?: PageOption[];
}) {
  const set = (patch: Record<string, any>) => onChange({ ...settings, ...patch });
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);
  const [showGridCategoryPicker, setShowGridCategoryPicker] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      {type !== 'hero' && type !== 'trust_badges' && type !== 'collection_product_grid' && (
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
            <select className={inp} value={settings.source ?? 'pinned'} onChange={e => set({ source: e.target.value, categoryId: undefined, collectionId: undefined })}>
              <option value="pinned">Pinned / Featured</option>
              <option value="bestsellers">Best Sellers</option>
              <option value="newArrivals">New Arrivals</option>
              <option value="trending">Trending</option>
              <option value="onSale">On Sale</option>
              <option value="category">A specific category</option>
              <option value="collection">A collection</option>
              <option value="manual">Hand-picked products</option>
            </select>
          </Field>
          {settings.source === 'category' && (
            <Field label="Category">
              <Button size="sm" variant="outline" onClick={() => setShowCategoryPicker(true)}>
                {settings.categoryId ? 'Change category' : 'Choose a category'}
              </Button>
            </Field>
          )}
          {settings.source === 'collection' && (
            <Field label="Collection">
              <Button size="sm" variant="outline" onClick={() => setShowCollectionPicker(true)}>
                {settings.collectionId ? 'Change collection' : 'Choose a collection'}
              </Button>
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
          <Field label="Filter to (optional)">
            <select
              className={inp}
              value={settings.categoryId ? 'category' : settings.collectionId ? 'collection' : ''}
              onChange={e => {
                const v = e.target.value;
                if (v === '') set({ categoryId: undefined, collectionId: undefined });
                else if (v === 'category') set({ collectionId: undefined });
                else set({ categoryId: undefined });
                if (v === 'category') setShowCategoryPicker(true);
                if (v === 'collection') setShowCollectionPicker(true);
              }}
            >
              <option value="">Whole catalog</option>
              <option value="category">A specific category</option>
              <option value="collection">A collection</option>
            </select>
          </Field>
          {settings.categoryId && (
            <Field label="Category"><Button size="sm" variant="outline" onClick={() => setShowCategoryPicker(true)}>Change category</Button></Field>
          )}
          {settings.collectionId && (
            <Field label="Collection"><Button size="sm" variant="outline" onClick={() => setShowCollectionPicker(true)}>Change collection</Button></Field>
          )}
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

      {type === 'featured_category_grid' && (
        <Field label="Categories" hint="Tiles are shown in the order chosen.">
          <Button size="sm" variant="outline" onClick={() => setShowGridCategoryPicker(true)}>
            {(settings.categoryIds ?? []).length > 0 ? `${settings.categoryIds.length} selected — change` : 'Choose categories'}
          </Button>
        </Field>
      )}

      {type === 'newsletter' && (
        <Field label="Subtext (optional)"><input className={inp} value={settings.subtext ?? ''} onChange={e => set({ subtext: e.target.value })} /></Field>
      )}

      {type === 'collection_product_grid' && (
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

      {type === 'drop_countdown' && (
        <>
          <Field label="Subheading (optional)"><input className={inp} value={settings.subheading ?? ''} onChange={e => set({ subheading: e.target.value })} /></Field>
          <Field label="Target date & time" required hint="The countdown runs live until this moment.">
            <input
              type="datetime-local"
              className={inp}
              value={settings.targetDate ? new Date(settings.targetDate).toISOString().slice(0, 16) : ''}
              onChange={e => set({ targetDate: e.target.value ? new Date(e.target.value).toISOString() : '' })}
            />
          </Field>
          <Field label="Button text (optional)"><input className={inp} value={settings.ctaText ?? ''} onChange={e => set({ ctaText: e.target.value })} /></Field>
          {settings.ctaText && (
            <Field label="Button link">
              <LinkTargetFields
                value={settings.ctaLink ?? { linkType: 'home' }}
                onChange={next => set({ ctaLink: next })}
                pageOptions={pageOptions ?? []}
                storeId={storeId}
              />
            </Field>
          )}
        </>
      )}

      {showCategoryPicker && (
        <EntityPickerModal
          open={showCategoryPicker}
          onClose={() => setShowCategoryPicker(false)}
          mode="categories"
          storeId={storeId}
         
          multiple={false}
          initialSelectedIds={settings.categoryId ? [settings.categoryId] : []}
          onConfirm={(ids) => { set({ categoryId: ids[0] }); setShowCategoryPicker(false); }}
        />
      )}
      {showCollectionPicker && (
        <EntityPickerModal
          open={showCollectionPicker}
          onClose={() => setShowCollectionPicker(false)}
          mode="collections"
          storeId={storeId}
          multiple={false}
          initialSelectedIds={settings.collectionId ? [settings.collectionId] : []}
          onConfirm={(ids) => { set({ collectionId: ids[0] }); setShowCollectionPicker(false); }}
        />
      )}
      {showGridCategoryPicker && (
        <EntityPickerModal
          open={showGridCategoryPicker}
          onClose={() => setShowGridCategoryPicker(false)}
          mode="categories"
          storeId={storeId}
         
          multiple
          initialSelectedIds={settings.categoryIds ?? []}
          onConfirm={(ids) => { set({ categoryIds: ids.slice(0, 12) }); setShowGridCategoryPicker(false); }}
        />
      )}
    </div>
  );
}
