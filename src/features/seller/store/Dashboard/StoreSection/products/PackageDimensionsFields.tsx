const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white placeholder:text-[#b5b3ac] outline-none';

interface Props {
  length: string;
  width: string;
  height: string;
  onChange: (key: 'length' | 'width' | 'height', value: string) => void;
}

/** Shopify variant "Package dimensions" (cm) — optional; used for live-rate / label quotes. */
export function PackageDimensionsFields({ length, width, height, onChange }: Props) {
  const fields: { key: 'length' | 'width' | 'height'; label: string; value: string }[] = [
    { key: 'length', label: 'Length (cm)', value: length },
    { key: 'width', label: 'Width (cm)', value: width },
    { key: 'height', label: 'Height (cm)', value: height },
  ];
  return (
    <div>
      <p className="block text-[12px] font-semibold text-charcoal mb-1.5">Package dimensions</p>
      <div className="grid grid-cols-3 gap-3">
        {fields.map(f => (
          <label key={f.key} className="block">
            <span className="block text-[11px] text-slate mb-1">{f.label}</span>
            <input
              type="number" min={0} step="any" inputMode="decimal"
              value={f.value}
              onChange={e => onChange(f.key, e.target.value)}
              placeholder="Optional"
              className={inp}
            />
          </label>
        ))}
      </div>
    </div>
  );
}
