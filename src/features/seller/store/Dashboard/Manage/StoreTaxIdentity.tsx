import { Info } from 'lucide-react';
import { taxIdLabelForCountry } from '@/utils/taxIdLabel';
import { taxSuggestionFor } from '@/utils/taxSuggestions';

interface Props {
  country: string;
  taxId: string;
  taxRegistered: boolean;
  /** Countries that already have a tax region row (upper case). */
  regionCountries: string[];
  disabled?: boolean;
  onTaxId: (v: string) => void;
  onTaxRegistered: (v: boolean) => void;
  onAddRegion: (country: string, rate: number) => void;
}

const inputCls = 'w-full py-[9px] px-3 rounded-md border border-bone bg-white text-[13px] text-charcoal outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 disabled:opacity-50';

/** Settings → Taxes: is this seller tax-registered, their tax number, and a one-click starting rate for their country. */
export function StoreTaxIdentity({ country, taxId, taxRegistered, regionCountries, disabled, onTaxId, onTaxRegistered, onAddRegion }: Props) {
  const label = taxIdLabelForCountry(country);
  const cc = country.trim().toUpperCase();
  const suggestion = taxSuggestionFor(cc);
  const showSuggestion = !!suggestion && !regionCountries.includes(cc);
  return (
    <div className="mb-4 rounded-lg border border-bone p-4 flex flex-col gap-4">
      <div className="flex items-start gap-2 text-[12.5px] text-charcoal">
        <input id="store-tax-registered" type="checkbox" className="mt-0.5 cursor-pointer" checked={taxRegistered} disabled={disabled} onChange={e => onTaxRegistered(e.target.checked)} />
        <label htmlFor="store-tax-registered" className="cursor-pointer">
          <b>I am registered to collect tax</b>
          <span className="block text-[11px] text-slate">Untick this if you are not tax-registered. Checkout then charges no tax at all (your rates below stay saved).</span>
        </label>
      </div>

      <div>
        <label htmlFor="store-tax-id" className="block text-[12px] font-medium text-charcoal mb-1.5">{label}</label>
        <input id="store-tax-id" className={inputCls} value={taxId} maxLength={30} disabled={disabled} onChange={e => onTaxId(e.target.value)} placeholder={cc === 'PK' ? 'e.g. NTN 1234567-8, STRN 12-34-5678-901-23' : ''} />
        <p className="text-[11px] text-slate mt-1">Printed on your invoices. Customers on your storefront do not see it.</p>
      </div>

      {showSuggestion && suggestion && (
        <div className="flex items-start gap-2 rounded-md bg-cream px-3 py-2.5">
          <Info size={14} className="mt-0.5 shrink-0 text-slate" />
          <div className="text-[12px] text-charcoal">
            <p>Your store is in {cc}. A common starting point is {suggestion.label} {suggestion.rate}%.</p>
            <p className="text-[11px] text-slate mt-0.5">Rates change and some products or regions differ: confirm the right rate with your accountant, then edit it in Tax Regions below.</p>
            <button type="button" disabled={disabled} onClick={() => onAddRegion(cc, suggestion.rate)} className="mt-2 text-[12px] font-semibold text-brand-orange hover:underline disabled:opacity-50">
              Add {suggestion.label} {suggestion.rate}% to Tax Regions
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
