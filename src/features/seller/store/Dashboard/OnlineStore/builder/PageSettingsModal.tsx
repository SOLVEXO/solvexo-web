import { useState } from 'react';
import { Modal, Button, Field, Toggle } from '@/components/comman/ui';
import { apiUpdateStorePage, type StorePageData, type StorePagePolicyType } from '@/api/services/storePages';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const textarea = `${inp} resize-none`;

const POLICY_TYPE_OPTIONS: { value: StorePagePolicyType | ''; label: string }[] = [
  { value: '',                  label: 'Not a policy page' },
  { value: 'privacy_policy',    label: 'Privacy Policy' },
  { value: 'terms_of_service',  label: 'Terms of Service' },
  { value: 'refund_policy',     label: 'Refund / Return Policy' },
  { value: 'shipping_policy',   label: 'Shipping Policy' },
];

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

/** The seller-facing home for every field `apiUpdateStorePage` already
 *  supports on the backend (title/slug rename, full SEO block, nav/footer
 *  visibility) — none of which had ANY caller anywhere in the app before
 *  this. A seller could publish a page but never rename it, never set its
 *  search-engine title/description, never control whether it shows in the
 *  storefront's nav/footer link lists, and never mark it noindex — all
 *  fully built and working on the backend, all completely unreachable.
 *  This is a settings modal (not a dedicated tab/route) so it plugs
 *  straight into the existing PagesPage header without a router change. */
export function PageSettingsModal({ page, storeId, onClose, onSaved }: {
  page: StorePageData;
  storeId: string;
  onClose: () => void;
  onSaved: (next: StorePageData) => void;
}) {
  const [title, setTitle] = useState(page.title);
  const [slug, setSlug] = useState(page.slug);
  const [metaTitle, setMetaTitle] = useState(page.seo.metaTitle ?? '');
  const [metaDescription, setMetaDescription] = useState(page.seo.metaDescription ?? page.seo.metaDesc ?? '');
  const [keywords, setKeywords] = useState((page.seo.keywords ?? []).join(', '));
  const [canonicalUrlOverride, setCanonicalUrlOverride] = useState(page.seo.canonicalUrlOverride ?? '');
  const [noindex, setNoindex] = useState(page.seo.noindex ?? false);
  const [showInNav, setShowInNav] = useState(page.showInNav);
  const [showInFooter, setShowInFooter] = useState(page.showInFooter);
  const [policyType, setPolicyType] = useState<StorePagePolicyType | ''>(page.policyType ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isHome = page.type === 'home';

  const handleSave = async () => {
    setError('');
    if (!isHome && (!title.trim() || !slug.trim())) { setError('Title and URL slug are required.'); return; }
    setSaving(true);
    try {
      const res = await apiUpdateStorePage(storeId, page._id, {
        ...(isHome ? {} : { title: title.trim(), slug: slug.trim() }),
        seo: {
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          keywords: keywords.split(',').map(k => k.trim()).filter(Boolean),
          canonicalUrlOverride: canonicalUrlOverride.trim() || null,
          noindex,
        },
        showInNav,
        showInFooter,
        ...(isHome ? {} : { policyType: policyType || null }),
      });
      onSaved(res.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save page settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={isHome ? 'Home Page Settings' : 'Page Settings'} onClose={onClose} width={520} footer={
      <>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
      </>
    }>
      <div className="flex flex-col gap-4">
        {!isHome && (
          <>
            <Field label="Title" required>
              <input className={inp} value={title} onChange={e => setTitle(e.target.value)} />
            </Field>
            <Field label="URL slug" required hint="Will be served at yourstore/this-slug">
              <input className={inp} value={slug} onChange={e => setSlug(slugify(e.target.value))} />
            </Field>
          </>
        )}

        <div className="border-t border-bone pt-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2.5">Search engine listing</p>
          <div className="flex flex-col gap-3">
            <Field label="Page title" hint="Shown as the browser tab / search result title. Defaults to the page's own title.">
              <input className={inp} value={metaTitle} onChange={e => setMetaTitle(e.target.value)} placeholder={page.title} />
            </Field>
            <Field label="Meta description" hint="Shown under the title in search results.">
              <textarea className={textarea} rows={3} value={metaDescription} onChange={e => setMetaDescription(e.target.value)} placeholder="Briefly describe this page for search engines..." />
            </Field>
            <Field label="Keywords" hint="Comma-separated.">
              <input className={inp} value={keywords} onChange={e => setKeywords(e.target.value)} placeholder="shipping, returns, policy" />
            </Field>
            <Field label="Canonical URL override" hint="Leave blank to use this page's own URL.">
              <input className={inp} value={canonicalUrlOverride} onChange={e => setCanonicalUrlOverride(e.target.value)} placeholder="https://..." />
            </Field>
            <label className="flex items-center justify-between gap-3 cursor-pointer">
              <span className="text-[12.5px] font-medium text-charcoal">Hide from search engines (noindex)</span>
              <Toggle checked={noindex} onChange={setNoindex} ariaLabel="Hide from search engines" />
            </label>
          </div>
        </div>

        {!isHome && (
          <div className="border-t border-bone pt-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate mb-2.5">Visibility</p>
            <div className="flex flex-col gap-2.5">
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[12.5px] font-medium text-charcoal">Show in navigation menu</span>
                <Toggle checked={showInNav} onChange={setShowInNav} ariaLabel="Show in navigation menu" />
              </label>
              <label className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-[12.5px] font-medium text-charcoal">Show in footer</span>
                <Toggle checked={showInFooter} onChange={setShowInFooter} ariaLabel="Show in footer" />
              </label>
            </div>
          </div>
        )}

        {!isHome && (
          <div className="border-t border-bone pt-3">
            <Field label="Policy type" hint="Tags this as a standard legal page — Solvexo links it automatically from your storefront's footer and, for Privacy/Terms, from checkout. At most one page per store per type.">
              <select className={inp} value={policyType} onChange={e => setPolicyType(e.target.value as StorePagePolicyType | '')}>
                {POLICY_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </Field>
          </div>
        )}

        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}
