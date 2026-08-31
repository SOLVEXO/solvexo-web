import { useState, useEffect } from 'react';
import { apiListResourceTemplates, type ResourceTemplateType } from '@/api/services/collectionTemplate';

/**
 * A small, reusable "which alternate template does this resource use"
 * dropdown — the merchant-facing counterpart to the Customize page's
 * Collection Template/Product Template tabs (where templates are actually
 * authored). Used on the Collection edit form and the Product edit form.
 */
export function TemplateKeyPicker({ storeId, resourceType, value, onChange, label }: {
  storeId: string;
  resourceType: ResourceTemplateType;
  value: string;
  onChange: (templateKey: string) => void;
  label?: string;
}) {
  const [templates, setTemplates] = useState<{ templateKey: string; name: string; isDefault: boolean }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiListResourceTemplates(storeId, resourceType)
      .then((res) => setTemplates(res.data.map((t) => ({ templateKey: t.templateKey, name: t.name, isDefault: t.isDefault }))))
      .finally(() => setLoading(false));
  }, [storeId, resourceType]);

  return (
    <div>
      <label className="text-[12px] font-medium text-charcoal block mb-1.5">{label ?? 'Template'}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50 disabled:opacity-60"
      >
        {loading && <option value={value}>Loading…</option>}
        {!loading && templates.length === 0 && <option value="default">Default</option>}
        {templates.map((t) => (
          <option key={t.templateKey} value={t.templateKey}>{t.name}{t.isDefault ? ' (Default)' : ''}</option>
        ))}
      </select>
      <p className="text-[10.5px] text-slate mt-1">
        Templates are authored on the <span className="font-medium">Customize</span> page's {resourceType === 'product' ? 'Product' : 'Collection'} Template tab.
      </p>
    </div>
  );
}
