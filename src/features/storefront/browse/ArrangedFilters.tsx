import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { arrangeFilterGroups } from './filterConfig';
import { useBrowseConfig } from './useBrowseConfig';

/** Marks one filter group so the seller's on/off + order can be applied to it. Draws its children unchanged. */
export function FilterSlot({ children }: { id: string; count?: number; children: ReactNode }) { return <>{children}</>; }

/** Draws its `FilterSlot` children hidden / reordered per the seller's Search & discovery settings (all in the default order until they load). */
export function ArrangedFilters({ children }: { children: ReactNode }) {
  const { filters } = useBrowseConfig();
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<{ id?: string; count?: number }>[];
  const rows = items.map(el => ({ id: el.props.id ?? '', count: el.props.count, el }));
  return <>{arrangeFilterGroups(rows, filters).map(r => r.el)}</>;
}
