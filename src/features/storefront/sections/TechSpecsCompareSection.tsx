import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { registerBlockSchema } from '../blockSchemaRegistry';
import { Table as TableIcon } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';

interface SpecRow {
  label: string;
  value: string;
}

// A real spec table — genuinely `<table>` markup (not a div grid pretending
// to be one), with alternating row tint and a visually-hidden caption for
// screen readers.
export function TechSpecsCompareSection({ settings, blocks }: { settings: { heading?: string }; blocks: SpecRow[] }) {
  const { cfg } = useStorefront();
  if (blocks.length === 0) return null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div className="mx-auto" style={{ maxWidth: Math.round(760 * cfg.containerWidthScale) }}>
        {settings.heading && (
          <h2 className="font-bold mb-4" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>{settings.heading}</h2>
        )}
        <table className="w-full border-collapse text-[13.5px]" style={{ color: cfg.textColor }}>
          <caption className="sr-only">Product specifications</caption>
          <tbody>
            {blocks.map((row, i) => (
              <tr key={i} style={{ background: i % 2 === 1 ? `${cfg.textColor}08` : 'transparent' }}>
                <th scope="row" className="text-left font-semibold py-2.5 px-3 align-top w-[42%]">{row.label}</th>
                <td className="py-2.5 px-3 align-top opacity-85">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

registerSection('tech_specs_compare', (section, blocks) =>
  <TechSpecsCompareSection settings={section.settings as any} blocks={blocks.map(b => b.settings) as any} />,
);

registerSectionSchema({
  type: 'tech_specs_compare',
  label: 'Spec Table',
  description: 'A real two-column specification table — label and value rows with alternating shading.',
  icon: TableIcon,
  color: '#1E40AF',
  group: 'Products',
  templateTypes: ['home'],
  exclusiveToTheme: 'tech-commerce',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
  ],
  blocks: { allowedTypes: ['spec_row'], max: 12, label: 'Spec', defaultSettings: { label: '', value: '' } },
});

registerBlockSchema({
  type: 'spec_row',
  label: 'Spec',
  fields: [
    { key: 'label', kind: 'text', label: 'Label' },
    { key: 'value', kind: 'text', label: 'Value' },
  ],
});
