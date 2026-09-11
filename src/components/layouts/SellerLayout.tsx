import { type ReactNode } from 'react';
import { NotificationBell, CurrencySelector } from '@/components/comman/ui';

// NOTE: This file used to also export `SellerLayout` — the old cross-store
// seller-dashboard shell (dark sidebar rail + mobile bottom tab bar, guarding
// the now-removed `/seller/*` cross-store pages: My Stores grid, cross-store
// Analytics, cross-store Settings). That whole flow was replaced by the
// Store Workspace architecture: every seller lands on their own store's
// dashboard via `SellerAreaRedirect` → `/store/:storeId/dashboard`, using
// `StoreLayout` as the shell instead. `SellerLayout` (and the sidebar/bottom
// nav/command-palette helpers that only it used) had zero remaining
// references anywhere in the app and was deleted outright, along with the
// old cross-store pages it used to guard (`SellerAnalytics.tsx`,
// `SellerStoreList.tsx`, `StoreBuilderRedirect.tsx`, and the unused
// `dashboard/storemodule/*` theme-preview duplicates).
//
// `SellerPageHeader` below is kept — it's still actively used by the live
// per-store pages `SellerMessages` and `SellerSettings`.

// ── Page Header (exported for seller pages) ───────────────────────────────────
export interface SellerPageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
}

export function SellerPageHeader({ title, subtitle, actions }: SellerPageHeaderProps) {
  return (
    <div className="bg-white/90 backdrop-blur-md border-b border-bone px-4 md:px-7 py-[14px] flex items-center justify-between sticky top-0 z-10 shrink-0">
      <div>
        <h1 className="text-[18px] font-bold text-carbon leading-[1.3]">{title}</h1>
        {subtitle && <p className="text-[12px] text-slate mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-[10px]">
        {actions}
        <NotificationBell />
        <CurrencySelector />
      </div>
    </div>
  );
}
