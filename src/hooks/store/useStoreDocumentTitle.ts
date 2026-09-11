import { useEffect } from 'react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';

/**
 * Same "{Store Name} - {page}" browser-tab title `StorePageHeader` sets for
 * every page that renders it — for the handful of store-workspace pages
 * that don't use that shared header at all (Add/Edit Product, Product
 * Detail — each has its own bespoke header UI). Reads the store name from
 * the same `StoreWorkspaceProvider` context `StorePageHeader` itself uses,
 * so the two can never drift out of sync.
 */
export function useStoreDocumentTitle(pageLabel: string) {
  const { store } = useStoreWorkspace();
  useEffect(() => {
    document.title = `${store?.name || 'Solvexo'} - ${pageLabel}`;
    return () => { document.title = 'Solvexo'; };
  }, [store?.name, pageLabel]);
}
