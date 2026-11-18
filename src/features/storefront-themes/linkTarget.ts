/** Props that make a resolved storefront link open in a new tab when the seller ticked "Open in a new tab".
 *  `resolveLink()` reports `newTab` for every kind of link (external AND in-app pages such as a category); the places that draw
 *  the link have to pass it on: `<Link to={target.to} {...newTabProps(target)}>` / `<a href={target.href} {...newTabProps(target)}>`. */
export function newTabProps(target?: { newTab?: boolean } | null): { target?: '_blank'; rel?: string } {
  return target?.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {};
}
