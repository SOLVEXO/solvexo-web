import { ts } from '@/utils/tStatic';

export interface BundleComponent { name: string; image: string | null; quantity: number }

/** "This bundle includes" list for a bundle product. Renders nothing for a normal product. The theme passes its own colours. */
export function BundleIncludes({ bundle, ink, inkMuted }: { bundle?: { components: BundleComponent[] } | null; ink: string; inkMuted: string }) {
  if (!bundle || bundle.components.length === 0) return null;
  return (
    <div className="text-sm" style={{ color: inkMuted }}>
      <p className="m-0 mb-1 font-medium" style={{ color: ink }}>{ts('product.bundleIncludes', 'This bundle includes')}</p>
      <ul className="m-0 flex list-none flex-col gap-1 p-0">
        {bundle.components.map((c, i) => (
          <li key={i} className="flex items-center gap-2">
            {c.image && <img src={c.image} alt="" className="size-8 rounded object-cover" loading="lazy" />}
            <span>{c.name} × {c.quantity}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
