import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart2,
  Settings, ClipboardList, Megaphone, Star, Search, Wallet, Inbox,
  Truck, MessageSquare, FolderTree, Undo2, AlertTriangle, Layers, Image as ImageIcon, FileText,
  LayoutGrid, Newspaper, Palette, Percent, Gift, Smartphone, ListTree,
  Store, TrendingUp, Landmark, LifeBuoy, Languages,
} from 'lucide-react';
import type { AppRole } from '@/api/services/auth';
import type { EntitlementsSummary } from '@/api/services/platformPlans';
import { FEATURES } from '@/constants/features';

// Sidebar structure + permission/entitlement helpers (extracted from StoreLayout.tsx, no behaviour change) so they are unit-testable.

// `requiredPermission` — only meaningful for a `role:'staff'` session (see
// StoreSidebar's filter below); a seller always sees every item regardless.
// Undefined means "this destination has no staff permission gate on the
// backend yet" — staff never sees it in the nav, matching real backend
// access (showing it would just lead to a 403 on every click). A handful
// of items reuse a NEIGHBORING permission where Solvexo has no dedicated
// backend gate of its own (Categories/Collections → `products.view`,
// Reviews → `customers.view`) — a disclosed, deliberate simplification,
// not a precision claim; see the staff-permissions project plan.
// `requiredPermission` can be a single permission or an array — an array
// means OR semantics (granted if the staff session has ANY one of them),
// matching `PermissionsGuard`'s own multi-arg `@RequirePermission(...)` OR
// behavior. Needed whenever a single page's content is actually gated by
// more than one distinct backend permission (e.g. Settings hosts
// `settings.general.manage`/`settings.taxes.manage`/`settings.domains.manage`
// content on one page) — a single string here would otherwise hide the
// whole page from a staff member granted only one of those.
// `requiredEntitlement` — a PlatformPlan.limits boolean feature key this
// whole nav item's destination is gated by (see EntitlementsService). Unlike
// `requiredPermission` (staff-only, a seller/admin always passes), this
// applies to EVERY role — it's the store's own plan, not who's logged in.
export interface NavItem { id: string; Icon: LucideIcon; label: string; path: string; requiredPermission?: string | string[]; requiredEntitlement?: string }

// ── Sidebar structure ──────────────────────────────────────────────────────
// Restructured to match Shopify's admin nav: a short, always-visible flat
// list of the sections a seller opens every day, plus two COLLAPSIBLE
// groups (`collapsible: true`, closed by default — see `DEFAULT_COLLAPSED_GROUPS`
// below) for the two clusters that used to make this list feel long —
// "Online Store"'s 5 sub-pages (mirrors Shopify tucking Themes/Pages/Blog/
// Navigation behind its collapsible "Sales channels ▸ Online Store" tree)
// and a new "Growth Tools" group holding the niche/occasional Growth items
// (mirrors Shopify keeping only Marketing + Discounts flat and pushing
// Gift Cards, and app-provided tools like SEO/loyalty, out of the always-
// visible rail). "Custom Fields"/"Content Types" (metafields/metaobjects)
// moved from Catalog into Settings — Shopify's own Settings hub lists
// "Metafields and metaobjects" there too (see shopify_audit_notes.md), it's
// config a seller sets up once, not a daily Catalog destination.
// IMPORTANT: every `id` and `path` below is UNCHANGED from before this
// restructure — only which `group` an item lives under (and whether that
// group collapses) moved. No route, no page, no functionality was removed.
export const NAV: { group: string; items: NavItem[]; collapsible?: boolean; groupIcon?: LucideIcon }[] = [
  {
    group: 'Overview',
    items: [
      { id: 'dashboard', Icon: LayoutDashboard, label: 'Dashboard', path: 'dashboard', requiredPermission: 'home.view' },
      { id: 'analytics', Icon: BarChart2,       label: 'Analytics', path: 'analytics', requiredPermission: 'analytics.view' },
    ],
  },
   {
    // Made collapsible, same reasoning as Orders above — Products included
    // inside, not split out as a bare item.
    group: 'Catalog',
    collapsible: true,
    groupIcon: ShoppingBag,
    items: [
      { id: 'products',        Icon: ShoppingBag,   label: 'Products',        path: 'products',        requiredPermission: 'products.view' },
      // Inventory Hub is one page with 6 tabs (Stock/Purchase Orders/Reorder/
      // Stock Counts/Reports/Staff) gated by several distinct permissions
      // beyond the base `inventory.view` — OR'd so a staff member scoped to
      // just one sub-capability (e.g. `purchase_orders.manage` for a
      // procurement-only role, or `settings.locations.manage` for the
      // "Manage Locations" modal this same page hosts) still has a nav path
      // in, not just backend routes with no way to reach them.
      { id: 'inventory',       Icon: ClipboardList, label: 'Inventory',       path: 'inventory',       requiredPermission: ['inventory.view', 'inventory.adjust', 'inventory.receive', 'inventory.transfer', 'inventory.count', 'inventory.approve', 'purchase_orders.manage', 'settings.locations.manage'] },
      { id: 'categories',      Icon: FolderTree,    label: 'Categories',      path: 'categories',      requiredPermission: ['products.view', 'categories.manage'] },
      { id: 'collections',     Icon: Layers,        label: 'Collections',     path: 'collections',     requiredPermission: ['products.view', 'collections.manage'] },
    ],
  },
  {
    // Renamed from "Sales" and made collapsible — every order-related page
    // (Orders itself included, not split out) lives together in one dropdown,
    // closed by default like every other group except Overview, instead of
    // sitting flat and always taking up 5 rows of space.
    group: 'Orders',
    collapsible: true,
    groupIcon: Package,
    items: [
      { id: 'orders',   Icon: Package,  label: 'Orders',       path: 'orders',  requiredPermission: 'orders.view' },
      { id: 'digital', Icon: Package, label: 'Digital', path: 'digital', requiredPermission: ['digital.view', 'members.manage', 'courses.manage', 'licenses.manage'] },
      { id: 'wholesale', Icon: Package, label: 'Wholesale', path: 'wholesale', requiredPermission: ['b2b.view', 'b2b.manage'], requiredEntitlement: 'b2bWholesaleAllowed' },
      { id: 'subscriptions', Icon: Package, label: 'Subscriptions', path: 'subscriptions', requiredPermission: ['product_subscriptions.view', 'product_subscriptions.manage'] },
      { id: 'checkout-rules', Icon: Package, label: 'Checkout rules', path: 'checkout-rules', requiredPermission: ['checkout_rules.view', 'checkout_rules.manage'] },
      { id: 'experiments', Icon: Package, label: 'Experiments', path: 'experiments', requiredPermission: ['experiments.view', 'experiments.manage'] },
      { id: 'creatives', Icon: Package, label: 'Social creatives', path: 'creatives', requiredPermission: 'marketing.manage' },
      { id: 'cod-protection', Icon: Package, label: 'COD protection', path: 'cod-protection', requiredPermission: 'settings.payments.manage' },
      { id: 'messaging', Icon: Package, label: 'WhatsApp & SMS', path: 'messaging', requiredPermission: 'marketing.manage' },
      { id: 'khata', Icon: Package, label: 'Khata', path: 'khata', requiredPermission: 'khata.view' },
      { id: 'sales-channels', Icon: Package, label: 'Sales channels', path: 'sales-channels', requiredPermission: 'products.view' },
      { id: 'developers', Icon: Package, label: 'Webhooks & API', path: 'developers', requiredPermission: 'settings.general.manage', requiredEntitlement: 'apiWebhooksAllowed' },
      { id: 'connected-apps', Icon: Package, label: 'Connected apps', path: 'app-platform', requiredPermission: ['apps.view', 'apps.manage'], requiredEntitlement: 'apiWebhooksAllowed' },
      { id: 'search-settings', Icon: Package, label: 'Search & discovery', path: 'search-settings', requiredPermission: 'onlinestore.themes.manage' },
      { id: 'security', Icon: Package, label: 'Security (2FA)', path: 'security' },
      { id: 'draft-orders', Icon: FileText, label: 'Draft Orders', path: 'draft-orders', requiredPermission: ['draft_orders.view', 'draft_orders.manage'] },
      // Hidden until this store has payment proofs or connects its own "Bank Transfer" in
      // Integrations (see `hiddenNavIds`) — buyers who pay that way upload a proof here for the
      // seller to review/approve (money lands in the seller's own bank
      // account, never Solvexo's — see ManualPaymentsService).
      { id: 'payment-proofs', Icon: Landmark, label: 'Payment Proofs', path: 'payment-proofs', requiredPermission: 'orders.record_payment' },
      { id: 'returns',  Icon: Undo2,    label: 'Returns',       path: 'returns', requiredPermission: 'orders.return' },
      { id: 'disputes', Icon: AlertTriangle, label: 'Disputes', path: 'disputes', requiredPermission: 'orders.disputes_manage' },
      { id: 'shipping', Icon: Truck,    label: 'Shipping',      path: 'shipping', requiredPermission: 'settings.shipping.manage' },
    ],
  },
  {
    group: 'Customers',
    collapsible: true,
    groupIcon: Users,
    items: [
      // OR'd with `customers.edit` — a staff member granted create/edit but
      // not general view (e.g. a data-entry-only role) still needs a nav
      // path to the list that create/edit actually happens from.
      { id: 'customers', Icon: Users,          label: 'Customers', path: 'customer/list', requiredPermission: ['customers.view', 'customers.edit'] },
      { id: 'reviews',   Icon: Star,           label: 'Reviews',   path: 'reviews',        requiredPermission: ['customers.view', 'reviews.manage'] },
      { id: 'messages',  Icon: MessageSquare,  label: 'Messages',  path: 'messages',       requiredPermission: ['messaging.view', 'messaging.manage'] },
      // Storefront contact-form inbox (Shopify sends these to the store's inbox, not Online Store).
      { id: 'online-store-contact', Icon: Inbox,    label: 'Contact Messages', path: 'online-store/contact-messages', requiredPermission: 'onlinestore.content.manage' },
    ],
  },
  {
    group: 'Online Store',
    collapsible: true,
    groupIcon: Store,
    items: [
      { id: 'online-store-themes',    Icon: Palette,    label: 'Themes',    path: 'online-store/themes',    requiredPermission: 'onlinestore.themes.manage' },
      { id: 'online-store-pages',     Icon: LayoutGrid, label: 'Pages',     path: 'online-store/pages',     requiredPermission: 'onlinestore.content.manage' },
      { id: 'online-store-menus',     Icon: ListTree,   label: 'Navigation', path: 'online-store/menus',     requiredPermission: 'content.menus.manage' },
      { id: 'online-store-blog',      Icon: Newspaper,  label: 'Blog',      path: 'online-store/blog',      requiredPermission: 'onlinestore.content.manage' },
      // { id: 'online-store-apps',      Icon: Blocks,     label: 'Apps',      path: 'online-store/apps',      requiredPermission: 'onlinestore.content.manage' },
      { id: 'online-store-files',     Icon: ImageIcon,  label: 'Files',     path: 'files',                  requiredPermission: 'files.manage' },
      { id: 'online-store-translations', Icon: Languages, label: 'Translate & adapt', path: 'online-store/translations', requiredPermission: 'onlinestore.content.manage' },
    ],
  },
  {
    // Made collapsible for consistency with every other multi-item group —
    // the rest of the old 7-item "Growth" group already moved to the
    // separate collapsible "Growth Tools" group below.
    group: 'Marketing',
    collapsible: true,
    groupIcon: Megaphone,
    items: [
      // Tracking Pixels lives as a tab inside Marketing but is gated on its
      // own distinct `settings.pixels.manage` permission (tracking-pixels
      // .controller.ts) — OR'd in so that permission alone still reaches it.
      { id: 'marketing',     Icon: Megaphone, label: 'Marketing',     path: 'marketing',     requiredPermission: ['marketing.manage', 'settings.pixels.manage'] },
      { id: 'discounts',     Icon: Percent,   label: 'Discounts',     path: 'discounts',     requiredPermission: 'discounts.manage' },
    ],
  },
  {
    // The occasional/niche growth tools — properly grouped under their own
    // collapsible section instead of sitting flat alongside Marketing/
    // Discounts, which is what made the old "Growth" group the single
    // longest cluster in the sidebar (7 items).
    group: 'Growth Tools',
    collapsible: true,
    groupIcon: TrendingUp,
    items: [
      // OR'd with `giftcards.manage` (issue/adjust balance) — a staff
      // member granted only that, not general view, still needs a nav path.
      { id: 'gift-cards',    Icon: Gift,      label: 'Gift Cards',    path: 'gift-cards',    requiredPermission: ['giftcards.view', 'giftcards.manage'] },
      // Hidden via FEATURES.loyalty (not built-in on Shopify) — to become an installable App later; code/data kept.
      ...(FEATURES.loyalty ? [{ id: 'loyalty',       Icon: Star,      label: 'Loyalty',       path: 'loyalty',       requiredPermission: ['loyalty.view', 'loyalty.manage', 'loyalty.points.award'], requiredEntitlement: 'loyaltyProgramAllowed' as const }] : []),
      { id: 'seo',           Icon: Search,    label: 'SEO',           path: 'seo',           requiredPermission: ['seo.view', 'seo.manage'] },
    ],
  },
  {
    // Billing (`plan-billing`) moved into the Settings hub as a tab —
    // matches Shopify's own real distinction: Finance is the store's own
    // money in/out (payouts), Settings→Billing is what Solvexo charges the
    // seller for running the store. The two were never the same concept;
    // now they're not even adjacent in the sidebar either.
    group: 'Finance',
    items: [
      { id: 'finance', Icon: Wallet, label: 'Finance', path: 'finance', requiredPermission: 'finance.payouts.view' },
    ],
  },
  {
    // Own store's branded app request + Solvexo POS access — a real sales
    // channel (how buyers reach this store), not store configuration, so it
    // deliberately does NOT live inside Settings — matches Shopify's own
    // treatment of Point of Sale as its own channel, never a Settings item.
    group: 'Sales Channels',
    items: [
      { id: 'mobile-app', Icon: Smartphone, label: 'Mobile App', path: 'mobile-app' },
    ],
  },
  {
    // Real, single tabbed Settings hub (`SettingsHub.tsx`) — General/Billing/
    // Integrations/Staff/Custom Fields/Content Types/Activity Log all live
    // as tabs on ONE page now, matching Shopify's own single Settings
    // destination instead of 6 separate sidebar entries each pointing at
    // its own full page. The old routes (`/staff`, `/integrations`,
    // `/plan-billing`, `/metafields`, `/metaobjects`) still exist and are
    // still reachable by direct URL (this project's "disconnect, don't
    // delete" convention) — only the NAV was consolidated down to this one
    // "Settings" entry, same as InventoryHub already did for Inventory/
    // Purchase Orders/Reorder/Reports. `requiredPermission` is OR'd across
    // every permission any of the hub's tabs actually need, so a staff
    // member granted any one of them still has a nav path in.
    group: 'Settings',
    items: [
      {
        id: 'settings', Icon: Settings, label: 'Settings', path: 'settings',
        requiredPermission: [
          'settings.domains.manage', 'settings.general.manage', 'settings.taxes.manage',
          'settings.billing.manage', 'settings.billing.view',
          'settings.payments.manage', 'finance.payments.manage',
          'staff.manage', 'content.metaobjects.manage', 'activity_log.view',
        ],
      },
      // Send a request to the Solvexo team; the API route needs `home.view` for staff.
      { id: 'help', Icon: LifeBuoy, label: 'Help', path: 'help', requiredPermission: 'home.view' },
    ],
  },
];

// Real permission-aware nav filtering for a `role:'staff'` session — a
// seller (or admin) always gets the raw, unfiltered `NAV` unchanged. Every
// consumer of `NAV` (StoreSidebar, StoreNavMenu, command palette, mobile
// bottom nav) should call this instead of reading `NAV` directly, so the
// filter logic exists in exactly one place. This is a UX convenience, not
// the security boundary — every underlying route is independently 403'd
// server-side by `PermissionsGuard` regardless of what the nav shows.
// Shared by `visibleNavForUser` below and `StoreBottomNav`'s mobile tab
// filter — one place for "does this staff session have any of the listed
// permissions." A seller/admin (or no user) always passes; a staff user
// with no `requiredPermission` at all on the item fails closed (hidden) by
// default, matching the desktop sidebar's existing convention that an
// ungated destination shouldn't be surfaced to a staff session.
/** Owner-only chrome (plan card, billing banner, store switcher) is hidden from staff sessions, like Shopify. */
export function hasNavPermission(user: { role?: AppRole; permissions?: string[] } | null, requiredPermission?: string | string[]): boolean {
  if (!user || user.role !== 'staff') return true;
  if (!requiredPermission) return false;
  const granted = new Set(user.permissions ?? []);
  return Array.isArray(requiredPermission)
    ? requiredPermission.some(p => granted.has(p))
    : granted.has(requiredPermission);
}

// The store's own plan, not who's logged in — applies to a seller/admin the
// same as a staff session, unlike `hasNavPermission` above. `entitlements ===
// null` (not yet loaded) always passes, so a nav item never flashes visible
// then hidden while the fetch is in flight — same convention StoreSettings'
// Custom Domain/White Label fields already use for this exact shape of data.
export function hasNavEntitlement(entitlements: EntitlementsSummary | null, requiredEntitlement?: string): boolean {
  if (!requiredEntitlement || !entitlements) return true;
  const feature = entitlements[requiredEntitlement] as { allowed: boolean } | undefined;
  return feature?.allowed !== false;
}

/** Nav items to hide because the store does not use them (server flag `payment-proofs-shown`; missing flag while loading = hidden until known). */
export function hiddenNavIds(badges: Record<string, number>): Set<string> {
  return new Set(badges['payment-proofs-shown'] ? [] : ['payment-proofs']);
}

export function visibleNavForUser(user: { role?: AppRole; permissions?: string[] } | null, entitlements: EntitlementsSummary | null = null, hide: Set<string> = new Set()): typeof NAV {
  return NAV
    .map(section => ({
      ...section,
      items: section.items.filter(item => !hide.has(item.id) && hasNavPermission(user, item.requiredPermission) && hasNavEntitlement(entitlements, item.requiredEntitlement)),
    }))
    .filter(section => section.items.length > 0);
}
