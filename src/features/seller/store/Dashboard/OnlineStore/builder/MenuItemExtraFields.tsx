import { Field, ImageUpload } from '@/components/comman/ui';

export type NavMenuStyle = 'dropdown' | 'mega';

const OPTIONS: { value: NavMenuStyle; label: string; hint: string }[] = [
  { value: 'dropdown', label: 'Dropdown', hint: 'A compact list under the link.' },
  { value: 'mega', label: 'Mega menu', hint: 'A wide panel with columns and optional images.' },
];

/** Top-level nav item: how its children are presented. Each theme draws
 *  both styles in its own look (Atelier: editorial columns, Nova: category
 *  rail + image tiles). Only meaningful once the item has children. */
export function MenuStyleField({ value, onChange, hasChildren }: {
  value: NavMenuStyle | undefined;
  onChange: (next: NavMenuStyle) => void;
  hasChildren: boolean;
}) {
  const current = value === 'mega' ? 'mega' : 'dropdown';
  return (
    <Field label="Menu style">
      <div role="radiogroup" aria-label="Menu style" className="flex gap-2">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={current === opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex-1 text-left px-3 py-2 rounded-lg border text-[12px] cursor-pointer ${current === opt.value ? 'border-brand-orange bg-cream text-charcoal' : 'border-bone bg-white text-slate'}`}
          >
            <span className="block font-semibold">{opt.label}</span>
            <span className="block text-[11px] text-slate">{opt.hint}</span>
          </button>
        ))}
      </div>
      {current === 'mega' && !hasChildren && (
        <p className="text-[11.5px] text-slate mt-1.5">Add dropdown items below — a mega menu with no items is shown as a plain link.</p>
      )}
    </Field>
  );
}

/** Level 2/3 tile image for a mega menu. Optional: when empty, a link to a
 *  category or collection shows that category's/collection's own image. */
export function MenuImageField({ value, onChange, storeId }: {
  value: string | null | undefined;
  onChange: (next: string) => void;
  storeId: string;
}) {
  return (
    <Field label="Mega menu image (optional)">
      <ImageUpload value={value ? [value] : []} onChange={urls => onChange(urls[0] ?? '')} maxFiles={1} storeId={storeId} />
      <p className="text-[11px] text-slate mt-1">Leave empty to use the linked category or collection image, if it has one.</p>
    </Field>
  );
}
