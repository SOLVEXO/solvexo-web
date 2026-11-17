import { useEffect, useState } from 'react';
import { FolderTree } from 'lucide-react';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { Input, Select } from '@/components/comman/ui/Input';
import { Field } from '@/components/comman/ui/Field';
import { EmptyState } from '@/components/comman/ui/EmptyState';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { TableCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { useStoreCollectionsSeo } from '@/hooks/seller/seo/useSeoContent';
import { apiUpdateCollectionSeo } from '@/api/services/seo/seller/content.service';

interface CollectionsTabProps {
  storeId: string;
}

// Shopify parity: collections are the seller's own landing pages, so each one gets its own search title + description
// (the storefront and Google show these instead of the plain collection name).
export function CollectionsTab({ storeId }: CollectionsTabProps) {
  const { data, loading, error, refetch } = useStoreCollectionsSeo(storeId);
  const [collectionId, setCollectionId] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!data?.length) return;
    setCollectionId(prev => (prev && data.some(c => c._id === prev) ? prev : data[0]._id));
  }, [data]);

  const current = data?.find(c => c._id === collectionId);
  useEffect(() => {
    setMetaTitle(current?.seo?.metaTitle ?? '');
    setMetaDescription(current?.seo?.metaDescription ?? '');
  }, [current]);

  // The "Saved." / error note belongs to one collection: clear it only when another is picked (a refetch after save must not wipe it).
  useEffect(() => { setSaved(false); setSaveError(''); }, [collectionId]);

  if (error) return <AnalyticsErrorState message={error} onRetry={refetch} />;
  if (loading && !data) return <TableCardSkeleton rows={5} />;

  if (!data || data.length === 0) {
    return (
      <EmptyState
        icon={<FolderTree size={26} className="text-slate/50" />}
        title="No collections yet"
        description="Create a collection under Products → Collections, then set its search title and description here."
      />
    );
  }

  const handleSave = async () => {
    if (!collectionId) return;
    setSubmitting(true);
    setSaveError('');
    setSaved(false);
    try {
      await apiUpdateCollectionSeo(storeId, collectionId, { metaTitle, metaDescription });
      setSaved(true);
      await refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to update collection SEO.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="max-w-[640px]">
      <div className="flex items-center justify-between gap-2 flex-wrap mb-4">
        <p className="text-[15px] font-bold text-carbon">Collection SEO</p>
        <Button variant="primary" size="sm" loading={submitting} disabled={!collectionId} onClick={handleSave}>Save Changes</Button>
      </div>
      {saveError && <p className="text-[12px] text-error mb-3">{saveError}</p>}
      {saved && <p className="text-[12px] text-slate mb-3">Saved.</p>}

      <Field label="Collection" className="mb-4">
        <Select value={collectionId} onChange={e => setCollectionId(e.target.value)}>
          {data.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
      </Field>

      <div className="flex flex-col gap-4">
        <Field label="Meta Title" hint={`${metaTitle.length}/70 — leave empty to use the collection name`}>
          <Input value={metaTitle} maxLength={200} onChange={e => setMetaTitle(e.target.value)} />
        </Field>
        <Field label="Meta Description" hint={`${metaDescription.length}/160 — leave empty to use the collection description`}>
          <Input value={metaDescription} maxLength={500} onChange={e => setMetaDescription(e.target.value)} />
        </Field>
      </div>
    </Card>
  );
}
