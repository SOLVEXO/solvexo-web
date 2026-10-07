import { createContext, useContext } from 'react';

export interface CartDrawerCtx { open: boolean; openDrawer: () => void; closeDrawer: () => void; mounted: boolean }
const noop = () => {};
export const CartDrawerContext = createContext<CartDrawerCtx>({ open: false, openDrawer: noop, closeDrawer: noop, mounted: false });

/** Safe anywhere: outside a provider `mounted` is false and open/close are no-ops. */
export function useCartDrawer() { return useContext(CartDrawerContext); }
