import { useState, useEffect } from 'react';
import { Field } from '@/components/comman/ui';
import { EntityPickerModal } from './EntityPickerModal';
import { apiGetCategoryById } from '@/api/services/categories';
import { apiGetCollection } from '@/api/services/collections';

export interface LinkTarget {
  linkType: 'home' | 'page' | 'blog' | 'external' | 'category' | 'collection';
  pageSlug?: string;
  url?: string;
  categoryId?: string;
  collectionId?: string;
}

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

/** Shared editor for any `{linkType, pageSlug?, url?, categoryId?, collectionId?}`
 *  target — nav links, footer links, hero/image CTAs. `category`/`collection`
 *  (Phase 4) resolve through `EntityPickerModal` rather than a raw-ID paste
 *  field, same as every other entity reference in this builder. */
export function LinkTargetFields({ value, onChange, pageOptions, storeId, mainCategoryId }: {
  value: LinkTarget;
  onChange: (next: LinkTarget) => void;
  pageOptions: { slug: string; title: string }[];
  storeId: string;
  mainCategoryId?: string;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState('');

  useEffect(() => {
    setResolvedLabel('');
    if (value.linkType === 'category' && value.categoryId) {
      apiGetCategoryById(value.categoryId).then(res => setResolvedLabel(res.data.category.name)).catch(() => {});
    } else if (value.linkType === 'collection' && value.collectionId) {
      apiGetCollection(storeId, value.collectionId).then(res => setResolvedLabel(res.data.name)).catch(() => {});
    }
  }, [value.linkType, value.categoryId, value.collectionId, storeId]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Links to">
        <select className={inp} value={value.linkType} onChange={e => onChange({ ...value, linkType: e.target.value as LinkTarget['linkType'] })}>
          <option value="home">Home page</option>
          <option value="blog">Blog</option>
          <option value="page">A page…</option>
          <option value="category">A category…</option>
          <option value="collection">A collection…</option>
          <option value="external">External URL</option>
        </select>
      </Field>
      {value.linkType === 'page' && (
        <Field label="Page">
          <select className={inp} value={value.pageSlug ?? ''} onChange={e => onChange({ ...value, pageSlug: e.target.value })}>
            <option value="">Select a page</option>
            {pageOptions.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
        </Field>
      )}
      {value.linkType === 'external' && (
        <Field label="URL">
          <input className={inp} placeholder="https://…" value={value.url ?? ''} onChange={e => onChange({ ...value, url: e.target.value })} />
        </Field>
      )}
      {(value.linkType === 'category' || value.linkType === 'collection') && (
        <Field label={value.linkType === 'category' ? 'Category' : 'Collection'}>
          <button type="button" onClick={() => setPickerOpen(true)}
            className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-left text-charcoal bg-white cursor-pointer hover:bg-cream transition-colors truncate">
            {value.linkType === 'category'
              ? (value.categoryId ? (resolvedLabel || 'Selected') : 'Choose a category…')
              : (value.collectionId ? (resolvedLabel || 'Selected') : 'Choose a collection…')}
          </button>
        </Field>
      )}

      {pickerOpen && (
        <EntityPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          mode={value.linkType === 'category' ? 'categories' : 'collections'}
          storeId={storeId}
          mainCategoryId={mainCategoryId}
          multiple={false}
          initialSelectedIds={value.linkType === 'category' ? (value.categoryId ? [value.categoryId] : []) : (value.collectionId ? [value.collectionId] : [])}
          onConfirm={(ids) => {
            if (value.linkType === 'category') onChange({ ...value, categoryId: ids[0] });
            else onChange({ ...value, collectionId: ids[0] });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
