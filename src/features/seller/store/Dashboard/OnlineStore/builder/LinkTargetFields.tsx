import { useState, useEffect } from 'react';
import { Field, Select } from '@/components/comman/ui';
import { EntityPickerModal } from './EntityPickerModal';
import { apiGetCategoryById } from '@/api/services/categories';
import { apiGetCollection } from '@/api/services/collections';
import { apiGetMyProductById } from '@/api/services/product';
import { apiListStoreDocuments, type StoreDocumentFile } from '@/api/services/storeDocuments';

export interface LinkTarget {
  linkType: 'home' | 'page' | 'blog' | 'search' | 'external' | 'category' | 'collection' | 'product' | 'cart' | 'account' | 'faqs' | 'email' | 'phone' | 'document' | 'none';
  pageSlug?: string;
  url?: string;
  categoryId?: string;
  collectionId?: string;
  productId?: string;
  /** A document from the store's Documents library (`linkType: 'document'`). */
  documentId?: string;
  /** Documents can open in the browser or really download. */
  documentMode?: 'view' | 'download';
  /** Open the link in a new tab. */
  newTab?: boolean;
}

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

/** Shared editor for any `{linkType, pageSlug?, url?, categoryId?, collectionId?}`
 *  target — nav links, footer links, hero/image CTAs. `category`/`collection`
 *  (Phase 4) resolve through `EntityPickerModal` rather than a raw-ID paste
 *  field, same as every other entity reference in this builder. */
export function LinkTargetFields({ value, onChange, pageOptions, storeId, allowNone }: {
  value: LinkTarget;
  onChange: (next: LinkTarget) => void;
  pageOptions: { slug: string; title: string }[];
  storeId: string;
  /** Menu items only: offer "No link" (label opens its dropdown, click goes nowhere). */
  allowNone?: boolean;
}) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [resolvedLabel, setResolvedLabel] = useState('');
  const [broken, setBroken] = useState(false);
  const [documents, setDocuments] = useState<StoreDocumentFile[]>([]);

  useEffect(() => {
    if (!storeId) return;
    apiListStoreDocuments(storeId, { limit: 100 }).then(r => setDocuments(r.items ?? [])).catch(() => setDocuments([]));
  }, [storeId]);

  useEffect(() => {
    setResolvedLabel('');
    setBroken(false);
    if (value.linkType === 'category' && value.categoryId) {
      apiGetCategoryById(value.categoryId).then(res => setResolvedLabel(res.data.category.name)).catch(() => setBroken(true));
    } else if (value.linkType === 'collection' && value.collectionId) {
      apiGetCollection(storeId, value.collectionId).then(res => setResolvedLabel(res.data.name)).catch(() => setBroken(true));
    } else if (value.linkType === 'product' && value.productId) {
      apiGetMyProductById(value.productId).then(res => setResolvedLabel(res.data.product.name)).catch(() => setBroken(true));
    } else if (value.linkType === 'page' && value.pageSlug) {
      setBroken(!pageOptions.some(p => p.slug === value.pageSlug));
    } else if (value.linkType === 'external' && value.url) {
      setBroken(!/^https?:\/\//i.test(value.url));
    } else if (value.linkType === 'document' && value.documentId) {
      setBroken(!documents.some(d => d._id === value.documentId));
    }
  }, [value.linkType, value.categoryId, value.collectionId, value.productId, value.pageSlug, value.url, value.documentId, storeId, pageOptions, documents]);

  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Links to">
        <Select value={value.linkType} onChange={e => onChange({ ...value, linkType: e.target.value as LinkTarget['linkType'] })}>
          {(allowNone || value.linkType === 'none') && <option value="none">No link (opens its dropdown only)</option>}
          <option value="home">Home page</option>
          <option value="blog">Blog</option>
          <option value="search">Search results</option>
          <option value="page">A page…</option>
          <option value="product">A product…</option>
          <option value="category">A category…</option>
          <option value="collection">A collection…</option>
          <option value="document">A document (PDF)…</option>
          <option value="cart">Cart</option>
          <option value="account">Account page</option>
          <option value="faqs">FAQs page</option>
          <option value="email">Email address</option>
          <option value="phone">Phone number</option>
          <option value="external">External URL</option>
        </Select>
      </Field>
      {value.linkType === 'page' && (
        <Field label="Page">
          <Select value={value.pageSlug ?? ''} onChange={e => onChange({ ...value, pageSlug: e.target.value })}>
            <option value="">Select a page</option>
            {pageOptions.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </Select>
        </Field>
      )}
      {(value.linkType === 'email' || value.linkType === 'phone') && (
        <Field label={value.linkType === 'email' ? 'Email address' : 'Phone number'}>
          <input className={inp} placeholder={value.linkType === 'email' ? 'hello@yourstore.com' : '+92 300 1234567'} value={value.url ?? ''} onChange={e => onChange({ ...value, url: e.target.value })} />
        </Field>
      )}
      {value.linkType === 'external' && (
        <Field label="URL">
          <input className={inp} placeholder="https://…" value={value.url ?? ''} onChange={e => onChange({ ...value, url: e.target.value })} />
        </Field>
      )}
      {(value.linkType === 'category' || value.linkType === 'collection' || value.linkType === 'product') && (
        <Field label={value.linkType === 'category' ? 'Category' : value.linkType === 'collection' ? 'Collection' : 'Product'}>
          <button type="button" onClick={() => setPickerOpen(true)}
            className={`w-full px-3 py-2 text-[13px] border rounded-lg text-left bg-white cursor-pointer hover:bg-cream transition-colors truncate ${broken ? 'border-error text-error' : 'border-bone text-charcoal'}`}>
            {broken ? '⚠ Broken link — choose again'
              : value.linkType === 'category'
              ? (value.categoryId ? (resolvedLabel || 'Selected') : 'Choose a category…')
              : value.linkType === 'collection'
              ? (value.collectionId ? (resolvedLabel || 'Selected') : 'Choose a collection…')
              : (value.productId ? (resolvedLabel || 'Selected') : 'Choose a product…')}
          </button>
        </Field>
      )}

      {value.linkType === 'document' && (
        <>
          <Field label="Document">
            <Select value={value.documentId ?? ''} onChange={e => onChange({ ...value, documentId: e.target.value })}>
              <option value="">Select a document</option>
              {documents.map(d => <option key={d._id} value={d._id}>{d.title}</option>)}
            </Select>
          </Field>
          <Field label="When clicked">
            <Select value={value.documentMode ?? 'view'} onChange={e => onChange({ ...value, documentMode: e.target.value as 'view' | 'download' })}>
              <option value="view">Open in the browser</option>
              <option value="download">Download the file</option>
            </Select>
          </Field>
          {documents.length === 0 && (
            <p className="col-span-2 m-0 text-[11px] text-slate">No documents yet. Add one in Online Store → Documents, then it appears here.</p>
          )}
        </>
      )}
      {value.linkType === 'none' && (
        <p className="col-span-2 m-0 text-[11px] text-slate">Shows as plain text in the menu. Add items below so the dropdown has something to open.</p>
      )}

      {value.linkType !== 'email' && value.linkType !== 'phone' && value.linkType !== 'none' && (
        <label className="col-span-2 flex items-center gap-2 text-[12px] text-charcoal cursor-pointer">
          <input type="checkbox" checked={!!value.newTab} onChange={e => onChange({ ...value, newTab: e.target.checked })} /> Open in a new tab
        </label>
      )}

      {broken && (
        <p className="col-span-2 text-[11px] text-error -mt-1">
          {value.linkType === 'page' ? 'This page no longer exists — pick another.'
            : value.linkType === 'external' ? 'External links must start with https:// or http://.'
            : `This ${value.linkType} no longer exists — pick another.`}
        </p>
      )}

      {pickerOpen && (
        <EntityPickerModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          mode={value.linkType === 'category' ? 'categories' : value.linkType === 'collection' ? 'collections' : 'products'}
          storeId={storeId}
          multiple={false}
          initialSelectedIds={
            value.linkType === 'category' ? (value.categoryId ? [value.categoryId] : [])
              : value.linkType === 'collection' ? (value.collectionId ? [value.collectionId] : [])
              : (value.productId ? [value.productId] : [])
          }
          onConfirm={(ids) => {
            if (value.linkType === 'category') onChange({ ...value, categoryId: ids[0] });
            else if (value.linkType === 'collection') onChange({ ...value, collectionId: ids[0] });
            else onChange({ ...value, productId: ids[0] });
            setPickerOpen(false);
          }}
        />
      )}
    </div>
  );
}
