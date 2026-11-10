import { Link } from 'react-router-dom';

/** Where a vendor / brand / author name leads: the shop filtered to that name's products. */
export const vendorPath = (name: string) => `/search?filter.p.vendor=${encodeURIComponent(name)}`;

// The seller's own optional text before the name (e.g. "By"); empty = nothing is added. Set by each theme from its Theme Settings.
let vendorPrefix = '';
export function setVendorPrefix(value: unknown): void {
  vendorPrefix = typeof value === 'string' ? value.trim().slice(0, 30) : '';
}

/** A vendor name that opens all of that vendor's products (like clicking an author on a book shop). Inherits the text colour of its place. */
export function VendorLink({ name }: { name: string }) {
  return (
    <>
      {vendorPrefix && <>{vendorPrefix}{' '}</>}
      <Link to={vendorPath(name)} className="text-inherit no-underline hover:underline">{name}</Link>
    </>
  );
}
