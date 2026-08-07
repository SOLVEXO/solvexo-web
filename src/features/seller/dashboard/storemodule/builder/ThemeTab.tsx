import { Field } from '@/components/comman/ui';
import type { StorefrontColors } from '@/api/services/storeTheme';

const colorInp = 'w-full h-10 border border-bone rounded-lg cursor-pointer';

export function ThemeTab({ value, onChange }: { value: StorefrontColors; onChange: (next: StorefrontColors) => void }) {
  const set = (patch: Partial<StorefrontColors>) => onChange({ ...value, ...patch });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-[560px]">
      <Field label="Primary color"><input type="color" className={colorInp} value={value.primaryColor} onChange={e => set({ primaryColor: e.target.value })} /></Field>
      <Field label="Accent color"><input type="color" className={colorInp} value={value.accentColor} onChange={e => set({ accentColor: e.target.value })} /></Field>
      <Field label="Background"><input type="color" className={colorInp} value={value.bgColor} onChange={e => set({ bgColor: e.target.value })} /></Field>
      <Field label="Text color"><input type="color" className={colorInp} value={value.textColor} onChange={e => set({ textColor: e.target.value })} /></Field>
      <Field label="Font" className="col-span-2 sm:col-span-4">
        <select className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg bg-white" value={value.font} onChange={e => set({ font: e.target.value })}>
          {['Poppins', 'Inter', 'Roboto', 'Lora', 'Playfair Display', 'Montserrat'].map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </Field>
    </div>
  );
}
