import type { ComponentType, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Block, Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { StoreSectionView, type LinkRenderer, type StoreSectionColors } from './StoreSectionView';
import { useStoreSectionDefs } from './useStoreSectionDefs';

export type Shell<C> = ComponentType<{ colors: C; children: ReactNode }>;

/** Draws a seller-built section on the storefront (and in the editor preview), inside the active theme's own section shell. */
export function StoreSectionHost<C extends StoreSectionColors>({ section, blocks, colors, Shell }: { section: Section; blocks: Block[]; colors: C; Shell: Shell<C> }) {
  const { store, resolveLink } = useStorefront();
  const defs = useStoreSectionDefs(store?.storeId);
  const def = defs?.find(d => d.key === section.settings?.sectionKey);
  if (!def) return null;
  const link: LinkRenderer = ({ link: target, className, style, children }) => {
    const r = target ? resolveLink(target as never) : {};
    if (r.to) return <Link to={r.to} className={className} style={style}>{children}</Link>;
    if (r.href) return <a href={r.href} className={className} style={style} {...(r.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{children}</a>;
    return null; // a button with nowhere to go is not drawn
  };
  return (
    <Shell colors={colors}>
      <StoreSectionView def={def} settings={section.settings ?? {}} blocks={blocks} colors={colors} link={link} />
    </Shell>
  );
}
