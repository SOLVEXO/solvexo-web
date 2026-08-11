import { useState } from 'react';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { Input, Select } from '@/components/comman/ui/Input';
import { Field } from '@/components/comman/ui/Field';
import { Toggle } from '@/components/comman/ui/Toggle';
import { usePageSeo, useUpdatePageSeo } from '@/hooks/seller/seo/useSeoContent';

interface PagesTabProps {
  storeId: string;
}

// Store page-builder pages aren't enumerable via a dedicated backend listing endpoint yet —
// these are the well-known static page slugs the builder always creates.
const KNOWN_PAGES = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export function PagesTab({ storeId }: PagesTabProps) {
  const [pageId, setPageId] = useState(KNOWN_PAGES[0].id);
  const { data, loading, refetch } = usePageSeo(storeId, pageId);
  const { updatePageSeo, submitting, error } = useUpdatePageSeo();

  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [noindex, setNoindex] = useState(false);
  const [initializedFor, setInitializedFor] = useState('');

  if (data && initializedFor !== pageId) {
    setMetaTitle(data.metaTitle ?? '');
    setMetaDescription(data.metaDescription ?? '');
    setOgImage(data.ogImage ?? '');
    setNoindex(!!data.noindex);
    setInitializedFor(pageId);
  }

  const handleSave = async () => {
    const ok = await updatePageSeo(storeId, pageId, { metaTitle, metaDescription, ogImage, noindex });
    if (ok) refetch();
  };

  return (
    <Card className="max-w-[640px]">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <p className="text-[15px] font-bold text-carbon">Pages SEO</p>
        <Button variant="primary" size="sm" loading={submitting} onClick={handleSave}>Save Changes</Button>
      </div>
      {error && <p className="text-[12px] text-error mb-3">{error}</p>}

      <Field label="Page" className="mb-4">
        <Select value={pageId} onChange={e => setPageId(e.target.value)}>
          {KNOWN_PAGES.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </Select>
      </Field>

      {loading ? (
        <p className="text-[12px] text-slate">Loading page meta…</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Field label="Meta Title">
            <Input value={metaTitle} onChange={e => setMetaTitle(e.target.value)} />
          </Field>
          <Field label="Meta Description">
            <Input value={metaDescription} onChange={e => setMetaDescription(e.target.value)} />
          </Field>
          <Field label="OG Image URL">
            <Input value={ogImage} onChange={e => setOgImage(e.target.value)} />
          </Field>
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-medium text-carbon">No-index this page</p>
            <Toggle checked={noindex} onChange={setNoindex} />
          </div>
        </div>
      )}
    </Card>
  );
}
