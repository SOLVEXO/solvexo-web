import { useState } from 'react';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { Input } from '@/components/comman/ui/Input';
import { Field } from '@/components/comman/ui/Field';
import { SeoMetaForm, type SeoMetaFormValue } from '@/components/comman/seo';
import { useFaqSeo, useUpdateFaqSeo } from '@/hooks/admin/seo/useSeoFaq';

export function FaqMetaTab() {
  const [faqId, setFaqId] = useState('');
  const [searchedId, setSearchedId] = useState('');
  const { data, loading, refetch } = useFaqSeo(searchedId);
  const { updateFaqSeo, submitting, error } = useUpdateFaqSeo();
  const [form, setForm] = useState<SeoMetaFormValue>({});
  const [initializedFor, setInitializedFor] = useState('');

  if (data && initializedFor !== searchedId) {
    setForm({
      metaTitle: data.metaTitle ?? undefined,
      metaDescription: data.metaDescription ?? undefined,
      ogImage: data.ogImage ?? undefined,
      ogTitle: data.ogTitle ?? undefined,
      ogDescription: data.ogDescription ?? undefined,
      twitterCard: data.twitterCard === 'summary' || data.twitterCard === 'summary_large_image' ? data.twitterCard : undefined,
      canonicalUrlOverride: data.canonicalUrlOverride ?? undefined,
      noindex: data.noindex,
      keywords: data.keywords,
    });
    setInitializedFor(searchedId);
  }

  const handleSearch = () => setSearchedId(faqId.trim());

  const handleSave = async () => {
    if (!searchedId) return;
    const ok = await updateFaqSeo(searchedId, form);
    if (ok) refetch();
  };

  return (
    <div className="flex flex-col gap-4 max-w-[640px]">
      <Card>
        <Field label="FAQ ID" className="mb-0">
          <div className="flex gap-2">
            <Input value={faqId} onChange={e => setFaqId(e.target.value)} placeholder="Paste a FAQ ID" className="flex-1" />
            <Button variant="outline" size="md" onClick={handleSearch}>Load</Button>
          </div>
        </Field>
      </Card>

      {searchedId && (
        <Card>
          <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
            <p className="text-[15px] font-bold text-carbon">Help Center Article SEO</p>
            <Button variant="primary" size="sm" loading={submitting} onClick={handleSave}>Save Changes</Button>
          </div>
          {error && <p className="text-[12px] text-error mb-3">{error}</p>}
          <SeoMetaForm value={form} onChange={patch => setForm(f => ({ ...f, ...patch }))} loading={loading} />
        </Card>
      )}
    </div>
  );
}
