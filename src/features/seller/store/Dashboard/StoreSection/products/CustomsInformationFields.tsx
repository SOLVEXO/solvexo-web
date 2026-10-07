import { COUNTRY_OPTIONS } from '../../../../../../utils/countries';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white placeholder:text-[#b5b3ac] outline-none';

export type CustomsKey = 'countryOfOrigin' | 'hsCode' | 'customsDescription' | 'taxable';

interface Props {
  countryOfOrigin: string;
  hsCode: string;
  customsDescription: string;
  /** 'yes' | 'no' — Shopify "Charge tax on this product". Omit to hide the checkbox. */
  taxable?: string;
  onChange: (key: CustomsKey, value: string) => void;
}

/** Shopify product "Customs information" (optional): country/region of origin + HS code, used for the customs
 *  declaration of international shipping labels. */
export function CustomsInformationFields({ countryOfOrigin, hsCode, customsDescription, taxable, onChange }: Props) {
  return (
    <div>
      {taxable !== undefined && (
        <label className="flex items-center gap-2 text-[12.5px] text-charcoal cursor-pointer mb-4">
          <input type="checkbox" checked={taxable !== 'no'} onChange={e => onChange('taxable', e.target.checked ? 'yes' : 'no')} />
          Charge tax on this product
        </label>
      )}
      <p className="block text-[12px] font-semibold text-charcoal mb-1.5">Customs information</p>
      <p className="text-[11px] text-slate mb-2">Used on the customs declaration when you buy an international shipping label. Optional for domestic selling.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-[11px] text-slate mb-1">Country/region of origin</span>
          <select value={countryOfOrigin} onChange={e => onChange('countryOfOrigin', e.target.value)} className={inp}>
            <option value="">Select a country/region</option>
            {COUNTRY_OPTIONS.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-[11px] text-slate mb-1">HS (harmonized system) code</span>
          <input
            value={hsCode} inputMode="numeric" maxLength={14}
            onChange={e => onChange('hsCode', e.target.value.replace(/[^0-9.]/g, ''))}
            placeholder="e.g. 6109.10" className={inp}
          />
        </label>
      </div>
      <label className="block mt-3">
        <span className="block text-[11px] text-slate mb-1">Customs description (optional)</span>
        <input
          value={customsDescription} maxLength={200}
          onChange={e => onChange('customsDescription', e.target.value)}
          placeholder="Defaults to the product name" className={inp}
        />
      </label>
    </div>
  );
}
