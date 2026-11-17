import { ts } from '@/utils/tStatic';

/** Credit link for the footer's bottom bar (like Shopify's "Powered by Shopify").
 *  Defaults to "Powered by Solvexo"; the seller can turn it off or write their own text and link
 *  in Customize → Footer. Inherits the surrounding text colour and font. */
export function PoweredBySolvexo({ show, text, url, className }: { show: boolean; text?: string | null; url?: string | null; className?: string }) {
  if (!show) return null;
  const label = text?.trim() || ts('pg.powered_by_solvexo', 'Powered by Solvexo');
  return (
    <a
      href={url || 'https://www.solvexo.store/'}
      target="_blank"
      rel="noopener noreferrer"
      className={`no-underline hover:underline ${className ?? ''}`}
      style={{ color: 'inherit', opacity: 0.85 }}
    >
      {label}
    </a>
  );
}
