import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Select } from '@/components/comman/ui';
import { apiListSegments, type CustomerSegment } from '@/api/services/customerSegments';

/** Audience picker used by email campaigns and discounts: "Everyone" or one saved customer segment of this store. */
export function SegmentSelect({ storeId, value, onChange, label, disabled }: { storeId: string; value: string | null; onChange: (id: string | null) => void; label?: string; disabled?: boolean }) {
  const { t } = useTranslation();
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let cancelled = false;
    apiListSegments(storeId).then((r) => { if (!cancelled) setSegments(r.data.segments); }).catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [storeId]);
  return (
    <Field label={label ?? t('segments.audience')} hint={failed ? t('segments.loadFailed') : undefined}>
      <Select value={value ?? ''} onChange={(e) => onChange(e.target.value || null)} disabled={disabled}>
        <option value="">{t('segments.everyone')}</option>
        {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        {value && !segments.some((s) => s.id === value) && <option value={value}>{t('segments.missing')}</option>}
      </Select>
    </Field>
  );
}
