import { useState, useId } from 'react';
import { Outlet, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'motion/react';
import {
  LayoutDashboard, Users, Shield, Store, DollarSign, Settings, UserCog,
  PanelLeftClose, PanelLeftOpen, Image as ImageIcon, RefreshCw,
  BarChart3, Layers, Search, Sparkles, LogOut, Landmark, Percent, Coins, Activity,
  TrendingUp, ChevronRight, ChevronDown, Palette, Smartphone,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useLogout } from '@/hooks/auth/useLogout';
import { useCommandPalette } from '@/hooks/useCommandPalette';
import { TokenStorage, type AppRole } from '@/api/services/auth';
import { CommandPalette } from '@/components/comman/ui/CommandPalette';
import { Modal, Button, CopyIconButton } from '@/components/comman/ui';

interface AdminNavItem {
  id:    string;
  Icon:  LucideIcon;
  label: string;
  path:  string;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { id: 'overview',      Icon: LayoutDashboard, label: 'Overview',        path: '/admin'               },
  { id: 'analytics',     Icon: BarChart3,       label: 'Analytics',       path: '/admin/analytics'     },
  { id: 'users',         Icon: Users,           label: 'Users & Sellers', path: '/admin/users'         },
  { id: 'moderation',    Icon: Shield,          label: 'Moderation',      path: '/admin/moderation'    },
  { id: 'activity-log',  Icon: Activity,        label: 'Activity Log',    path: '/admin/activity-log'  },
  { id: 'subscriptions', Icon: RefreshCw,       label: 'Subscriptions',   path: '/admin/subscriptions' },
  { id: 'theme-catalog', Icon: Palette,         label: 'Theme Catalog',   path: '/admin/theme-catalog' },
  // Seller white-label branded-app requests — see MobileApp.tsx (seller
  // side) and StoreAppRequestsModule (backend) for the full flow. Distinct
  // from Solvexo's own POS app, which needs no admin review at all.
  { id: 'store-app-requests', Icon: Smartphone, label: 'Store App Requests', path: '/admin/store-app-requests' },
  { id: 'platform-plans',Icon: Layers,          label: 'Platform Plans',  path: '/admin/platform-plans' },
  { id: 'finance',       Icon: DollarSign,      label: 'Finance',         path: '/admin/finance'       },
  { id: 'manual-payments', Icon: Landmark,      label: 'Manual Payments', path: '/admin/manual-payments' },
  { id: 'commission-rules', Icon: Percent,      label: 'Commission Rules', path: '/admin/commission-rules' },
  { id: 'fx-settings',   Icon: Coins,           label: 'FX Settings',     path: '/admin/fx-settings'   },
  { id: 'seo',           Icon: Search,          label: 'SEO',             path: '/admin/seo'           },
  { id: 'ai-studio',     Icon: Sparkles,        label: 'AI Studio',       path: '/admin/ai-studio'     },
  // Announcements/FAQs/Testimonials/Contact Messages consolidated into one
  // tabbed page — see ADMIN_MODULES' doc comment below for why.
  { id: 'content',       Icon: ImageIcon,       label: 'Site Content',    path: '/admin/content'       },
  { id: 'config',        Icon: Settings,        label: 'Platform Config', path: '/admin/config'        },
  { id: 'settings',      Icon: UserCog,         label: 'My Settings',     path: '/admin/settings'      },
];
// Note: 'marketing' (platform sale campaigns/coupons/promotion-request
// review) was removed from ADMIN_NAV outright — see the doc comment on
// ADMIN_MODULES below for why.

interface AdminModule {
  id:    string;
  label: string;
  Icon:  LucideIcon;
  ids:   AdminNavItem['id'][];
  collapsible?: boolean;
}

// Sidebar presentation only — every route/page listed in ADMIN_NAV above
// still exists and works exactly as before; this only controls what's
// actually navigable from the sidebar/mobile-menu/command-palette. 'settings'
// is deliberately excluded from every module here — "My Settings" moves to
// the account menu in the sidebar footer instead of taking up a primary
// navigation slot (see AdminSidebar's footer below). Flat groups only — no
// collapsible/expand-on-click accordion (see AdminSidebar), matching
// StoreLayout/SellerLayout's plain grouped-list sidebar pattern.
//
// 'marketplace' (central-listing curation), 'marketing' (cross-store platform
// sale campaigns/coupons/promotion-request review), 'messages' (real private
// buyer-seller chat content — a genuine privacy overreach once there's no
// admin-curated marketplace to justify it), 'leads' (the pending-store
// approval queue — dormant for any seller onboarded through the current
// self-serve flow, only a legacy fallback for a pre-self-serve-activation
// store), and 'banners' (verified: every real placement —
// marketplaceHero/categoryHero/educationHero — only ever renders on the now-
// disconnected Marketplace/EducationMarketplace pages; the remaining
// placement, homepageHero, is defined but wired to no page at all) — none of
// these fit a pure Shopify-style "host many independent, self-serve stores"
// platform, per an explicit product-scope decision (Solvexo stores now work
// like independent Shopify stores, not a curated central marketplace).
// Unlike the rest of this file's usual "disconnect, don't delete" convention,
// these 5 are fully removed: no ADMIN_NAV entry, no router route, no lazy
// import (see router/index.tsx's own comment on this). Their page files
// (`AdminMarketplace.tsx`, `AdminMessaging.tsx`, `AdminLeads.tsx`,
// `AdminBanners.tsx`, `AdminMarketing.tsx`) are left on disk, fully
// unreferenced, only because this session can't delete files directly —
// safe to delete outright. Removing 'marketing' also leaves the seller-
// facing Marketing.tsx's own "Promotion Requests" tab with no admin-side
// reviewer (it requested paid placement on these same now-gone marketplace-
// wide surfaces) — flagged to the user, not silently touched here.
// (`StoreBanner` — the seller's own per-store storefront hero, managed from
// that store's own Marketing tab — is a completely separate schema/system,
// unaffected by any of this.)
//
// 'categories' is different — actually DELETED, not disconnected (per
// explicit instruction, not this project's usual precedent): `AdminCategories.tsx`,
// its route, and its ADMIN_NAV entry are gone outright. Categories are now
// store-owned — every seller builds their own tree from their own store's
// Categories page, entirely at their own discretion — so there is no
// remaining admin curation task here at all, unlike the items above (which
// still have real, if presently-unwanted, functionality). The underlying
// legacy/global `Category` collection, its backend admin-only root-category
// creation path, and every consumer that still legitimately needs it
// (grandfathered legacy stores' `Store.categoryId`, the disconnected
// Marketplace/EducationMarketplace pages, SEO/sitemap) are all untouched —
// only the admin-facing management PAGE was removed.
// 'commission-rules'/'fx-settings'/'config' are no longer their own module
// entries — all 3 are now tabs inside the consolidated Settings hub
// (AdminSettingsHub.tsx, mirrors the seller-side SettingsHub.tsx) reached via
// the single 'settings' item below. Their ADMIN_NAV entries/routes/pages stay
// fully intact and reachable by direct URL, same "disconnect, don't delete"
// convention as everywhere else in this file — only removed from module
// membership. Commerce/People/Growth/Finance are now collapsible (closed by
// default, see DEFAULT_COLLAPSED_GROUPS below) to keep the sidebar compact,
// matching the same accordion treatment StoreLayout's NAV already uses.
export const ADMIN_MODULES: AdminModule[] = [
  { id: 'overview',  label: 'Overview',             Icon: LayoutDashboard, ids: ['overview'] },
  { id: 'commerce',  label: 'Commerce',             Icon: Store,           ids: ['subscriptions', 'platform-plans', 'store-app-requests'], collapsible: true },
  { id: 'people',    label: 'Users & Communication', Icon: Users,          ids: ['users', 'moderation'], collapsible: true },
  { id: 'growth',    label: 'Growth',                Icon: TrendingUp,     ids: ['seo', 'ai-studio'], collapsible: true },
  { id: 'finance',   label: 'Finance',               Icon: DollarSign,     ids: ['finance', 'manual-payments'], collapsible: true },
  { id: 'content',   label: 'Content',               Icon: ImageIcon,      ids: ['content'] },
  { id: 'analytics', label: 'Analytics',             Icon: BarChart3,       ids: ['analytics'] },
  { id: 'activity',  label: 'Activity Log',          Icon: Activity,       ids: ['activity-log'] },
  { id: 'settings',  label: 'Settings',              Icon: UserCog,        ids: ['settings'] },
];

// Which collapsible modules (Commerce/People/Growth/Finance) start closed —
// same accordion convention as StoreLayout's NAV: every collapsible group
// starts collapsed, a group containing the current route force-expands
// itself regardless (see `groupHasActiveItem` in AdminSidebar), and the
// choice is remembered per-browser via localStorage.
const DEFAULT_COLLAPSED_ADMIN_GROUPS = ['Commerce', 'Users & Communication', 'Growth', 'Finance'];
const ADMIN_SIDEBAR_COLLAPSED_GROUPS_KEY = 'solvexo:admin-sidebar:collapsed-groups';

function loadCollapsedAdminGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(ADMIN_SIDEBAR_COLLAPSED_GROUPS_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch { /* per-viewer convenience only — falls back to the default below */ }
  return new Set(DEFAULT_COLLAPSED_ADMIN_GROUPS);
}

function saveCollapsedAdminGroups(groups: Set<string>) {
  try { localStorage.setItem(ADMIN_SIDEBAR_COLLAPSED_GROUPS_KEY, JSON.stringify([...groups])); } catch { /* per-viewer convenience only */ }
}

// The subset of ADMIN_NAV actually reachable from the sidebar/mobile-menu/
// command-palette — everything ADMIN_MODULES references. Kept as its own
// derived list (rather than filtering ADMIN_NAV directly) so ADMIN_NAV stays
// the complete route registry the app can still use for `isNavItemActive`
// checks against a deep-linked legacy page.
const VISIBLE_NAV_IDS = new Set(ADMIN_MODULES.flatMap(m => m.ids));
const VISIBLE_ADMIN_NAV = ADMIN_NAV.filter(item => VISIBLE_NAV_IDS.has(item.id));

function isNavItemActive(item: AdminNavItem, pathname: string) {
  return item.path === '/admin' ? pathname === '/admin' : pathname.startsWith(item.path);
}

// ── Shared grouped nav menu — the mobile "account hub" content for the admin
// panel, mirroring StoreLayout's StoreNavMenu/StoreSettings pattern: every
// module except 'overview' (its own bottom-nav tab) lives here, reached via
// the bottom nav's "Settings" tab rather than the dashboard — one source of
// truth for the full page list instead of a hamburger-triggered copy of the
// desktop sidebar. `excludeItemIds` lets a caller drop whatever it already
// covers itself (AdminSettings drops 'settings', the page it already is).
export function AdminNavMenu({ excludeItemIds = [] }: { excludeItemIds?: string[] }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hiddenItems = new Set(excludeItemIds);

  return (
    <div className="flex flex-col gap-4">
      {ADMIN_MODULES.filter(m => m.id !== 'overview')
        .map(module => ({ ...module, items: module.ids.map(id => ADMIN_NAV.find(n => n.id === id)).filter((n): n is AdminNavItem => !!n && !hiddenItems.has(n.id)) }))
        .filter(module => module.items.length > 0)
        .map(module => (
        <div key={module.id} className="bg-white border border-bone rounded-2xl overflow-hidden">
          <div className="px-5 pt-4 pb-2">
            <p className="text-[10.5px] font-bold text-slate uppercase tracking-[0.06em]">{module.label}</p>
          </div>
          <div className="divide-y divide-[#f3f2ec]">
            {module.items.map(item => {
              const active = isNavItemActive(item, pathname);
              return (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center gap-3 px-5 py-[13px] bg-transparent border-0 cursor-pointer text-left hover:bg-cream transition-colors"
                >
                  <div className={clsx('w-8 h-8 rounded-[9px] flex items-center justify-center shrink-0', active ? 'bg-brand-orange' : 'bg-brand-pale-orange')}>
                    <item.Icon size={15} className={active ? 'text-white' : 'text-brand-orange'} />
                  </div>
                  <span className={clsx('flex-1 text-[13px] font-medium', active ? 'text-brand-deep-orange' : 'text-charcoal')}>{item.label}</span>
                  <ChevronRight size={15} className="text-slate shrink-0" />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Mobile bottom tab bar — real navigation for the most frequent
// destinations, same icon-only pattern as SellerBottomNav/StoreBottomNav.
// The last tab ("Settings") is where every other module lives (via
// AdminSettings' own mobile menu) — the dashboard stays a pure glance page,
// it doesn't double as a menu of everything.
const ADMIN_TABS: { id: string; Icon: LucideIcon; label: string; path: string }[] = [
  { id: 'overview',   Icon: LayoutDashboard, label: 'Overview',    path: '/admin'            },
  { id: 'users',      Icon: Users,           label: 'Users',       path: '/admin/users'      },
  { id: 'finance',    Icon: DollarSign,      label: 'Finance',     path: '/admin/finance'    },
  { id: 'moderation', Icon: Shield,          label: 'Moderation',  path: '/admin/moderation' },
  { id: 'settings',   Icon: Settings,        label: 'Settings',    path: '/admin/settings'   },
];

function AdminBottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isActive = (path: string) => (path === '/admin' ? pathname === '/admin' : pathname.startsWith(path));

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-bone">
      <div className="flex items-stretch">
        {ADMIN_TABS.map(tab => {
          const active = isActive(tab.path);
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-current={active ? 'page' : undefined}
              aria-label={tab.label}
              className="flex-1 flex flex-col items-center justify-center py-[11px] gap-[5px] cursor-pointer bg-transparent border-none"
            >
              <tab.Icon
                size={21}
                strokeWidth={active ? 2.2 : 1.8}
                className={clsx('transition-colors duration-150', active ? 'text-brand-orange' : 'text-slate')}
              />
              <span className={clsx('w-[16px] h-[3px] rounded-full transition-colors duration-150', active ? 'bg-brand-orange' : 'bg-transparent')} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

interface AdminSidebarProps { open: boolean; onToggle: () => void; }

// Desktop only now — mobile navigation is AdminBottomNav below, a real
// bottom tab bar plus a "Settings" tab that hosts every other module's
// AdminNavMenu, instead of a hamburger-triggered copy of this same dark rail.
function AdminSidebar({ open, onToggle }: AdminSidebarProps) {
  const navigate     = useNavigate();
  const { pathname } = useLocation();
  const { profile, loading: profileLoading } = useGetProfile();
  const { open: paletteOpen, setOpen: setPaletteOpen } = useCommandPalette();
  const logout = useLogout();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Single travelling-pill scope since there's only one list level.
  const navPillId = useId();
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(loadCollapsedAdminGroups);
  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      saveCollapsedAdminGroups(next);
      return next;
    });
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout('/admin/login');
  };

  const isActive = (path: string) =>
    path === '/admin' ? pathname === '/admin' : pathname.startsWith(path);

  const goTo = (path: string) => navigate(path);

  const paletteItems = VISIBLE_ADMIN_NAV.map(item => ({
    id:       item.id,
    label:    item.label,
    icon:     item.Icon,
    onSelect: () => navigate(item.path),
  }));

  const toggleBtn = (
    <button
      onClick={onToggle}
      title={open ? 'Collapse sidebar' : 'Expand sidebar'}
      className="size-8 rounded-md flex items-center justify-center shrink-0 text-pos-muted hover:text-white hover:bg-dark-active transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
    >
      {open ? <PanelLeftClose size={15} /> : <PanelLeftOpen size={15} />}
    </button>
  );

  const paletteHint = (
    <button
      type="button"
      onClick={() => setPaletteOpen(true)}
      title="Search (Ctrl+K)"
      className={clsx(
        'flex items-center gap-1 rounded-md border border-dark-active text-pos-muted hover:text-white hover:bg-dark-active transition-colors duration-150 cursor-pointer shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40',
        open ? 'px-[7px] py-[3px] text-[10px] font-semibold' : 'size-8 justify-center text-[9px] font-semibold',
      )}
    >
      {open ? '⌘K' : 'K'}
    </button>
  );

  return (
    <>
      <aside className={clsx(
        'hidden lg:flex bg-admin-bg flex-col shrink-0',
        'transition-[width] duration-300 ease-in-out',
        'h-screen',
        open ? 'w-[220px]' : 'w-[60px]',
      )}>

        {/* Header: logo + toggle (mirrors StoreLayout/SellerLayout header) */}
        {open ? (
          <div className="px-5 pt-5 pb-4 shrink-0 flex items-center gap-[9px]">
            <div className="size-[30px] rounded-md bg-brand-orange flex items-center justify-center shrink-0">
              <Shield size={15} className="text-white" />
            </div>
            <div className="flex items-center flex-1 min-w-0">
              <span className="text-[17px] font-bold text-white tracking-[-0.3px]">Solvexo</span>
              <span className="text-[17px] font-bold text-brand-orange tracking-[-0.3px]">&nbsp;Admin</span>
            </div>
            {paletteHint}
            {toggleBtn}
          </div>
        ) : (
          <div className="pt-5 pb-4 flex flex-col items-center gap-[6px] shrink-0">
            <div className="size-[30px] rounded-md bg-brand-orange flex items-center justify-center shrink-0">
              <Shield size={15} className="text-white" />
            </div>
            {paletteHint}
            {toggleBtn}
          </div>
        )}

        {/* Nav — Overview/Content/Analytics/Activity Log/Settings render as
            bare single-item links (no heading, matching StoreLayout's rule
            that a 1-item group skips its own label); Commerce/People/Growth/
            Finance are collapsible accordion groups, closed by default. */}
        <nav data-lenis-prevent className={clsx('flex-1 overflow-y-auto py-1', open ? 'px-3' : 'px-[10px] pt-1')}>
          {ADMIN_MODULES.map(module => {
            const children = module.ids
              .map(id => ADMIN_NAV.find(n => n.id === id))
              .filter((n): n is AdminNavItem => !!n);
            if (!children.length) return null;

            const groupHasActiveItem = children.some(item => isActive(item.path));
            const isCollapsed = !!module.collapsible && open && collapsedGroups.has(module.label) && !groupHasActiveItem;
            const ModuleIcon = module.Icon;

            return (
              <div
                key={module.id}
                className={clsx(
                  'mb-1',
                  module.label === 'Settings' && open && 'mt-2 pt-2 border-t border-dark-active',
                )}
              >
                {open
                  ? (module.collapsible ? (
                      <button
                        type="button"
                        onClick={() => toggleGroup(module.label)}
                        aria-expanded={!isCollapsed}
                        className="relative w-full flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5 cursor-pointer border-0 bg-transparent hover:bg-dark-active transition-colors duration-fast"
                      >
                        <ModuleIcon size={15} className="shrink-0 text-pos-faint opacity-55" />
                        <span className="text-[12.5px] flex-1 font-normal text-pos-faint text-left">{module.label}</span>
                        <ChevronDown
                          size={14}
                          className={clsx('text-pos-faint opacity-70 transition-transform duration-200 shrink-0', !isCollapsed && 'rotate-180')}
                        />
                      </button>
                    ) : (
                      children.length > 1 && (
                        <p className="text-[10px] font-semibold text-pos-faint px-2 py-1 uppercase tracking-[0.08em] mb-0.5">{module.label}</p>
                      )
                    ))
                  : <div className="h-px bg-dark-active mx-1 mb-2" />
                }
                <div className={clsx(open && module.collapsible && 'ml-[11px] pl-[10px] border-l border-dark-active')}>
                  {!isCollapsed && children.map(item => {
                  const active = isActive(item.path);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => goTo(item.path)}
                      title={!open ? item.label : undefined}
                      aria-label={item.label}
                      aria-current={active ? 'page' : undefined}
                      className={clsx(
                        'relative w-full flex items-center gap-[10px] py-[9px] px-[10px] rounded-md mb-0.5 border-none text-left',
                        'cursor-pointer outline-none',
                        'focus-visible:ring-2 focus-visible:ring-brand-orange/40',
                        'active:scale-[0.98] active:duration-micro active:ease-spring',
                        !open && 'lg:justify-center lg:px-0',
                        !active && 'hover:bg-dark-active transition-colors duration-fast',
                      )}
                    >
                      {active && (
                        <motion.div
                          layoutId={`admin-nav-pill-${navPillId}`}
                          className="absolute inset-0 rounded-md bg-dark-active"
                          transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                        />
                      )}
                      <item.Icon
                        size={15}
                        className={clsx('relative shrink-0 transition-opacity duration-150', active ? 'text-brand-orange opacity-100' : 'text-pos-faint opacity-40')}
                      />
                      {open && (
                        <>
                          <span className={clsx('relative text-[12.5px] flex-1 truncate', active ? 'font-semibold text-white' : 'font-normal text-pos-faint')}>
                            {item.label}
                          </span>
                          {active && <div className="relative w-[3px] h-3 rounded-[2px] bg-brand-orange shrink-0" />}
                        </>
                      )}
                    </button>
                  );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User footer — mirrors StoreLayout/SellerLayout's bottom profile
            card exactly (plain row, no dropdown): the row itself is a
            direct link to My Settings, plus a separate Logout button. */}
        <div className="px-3 py-3 border-t border-dark-active shrink-0">
          <div className={clsx('flex items-center gap-1', !open && 'flex-col gap-2')}>
            <button
              type="button"
              onClick={() => goTo('/admin/settings')}
              title="My Settings"
              aria-label="My Settings"
              className={clsx(
                'flex items-center gap-2 rounded-md py-1.5 px-1 border-none text-left flex-1 min-w-0',
                'cursor-pointer transition-colors duration-150 outline-none',
                'hover:bg-dark-active focus-visible:ring-2 focus-visible:ring-brand-orange/40',
                !open && 'flex-col justify-center',
              )}
            >
              <div className="size-7 rounded-full shrink-0 bg-brand-orange flex items-center justify-center overflow-hidden text-[10px] font-bold text-white">
                {profileLoading
                  ? <div className="animate-pulse w-full h-full bg-charcoal" />
                  : profile?.profileImage
                    ? <img loading="lazy" decoding="async" src={profile.profileImage} alt={profile.name} className="w-full h-full object-cover" />
                    : (profile?.name?.slice(0, 2).toUpperCase() ?? 'AD')}
              </div>
              {open && (
                <div className="flex-1 min-w-0">
                  {profileLoading ? (
                    <>
                      <div className="animate-pulse w-20 h-[11px] rounded-[3px] bg-charcoal mb-1" />
                      <div className="animate-pulse w-[110px] h-[9px] rounded-[3px] bg-charcoal" />
                    </>
                  ) : (
                    <>
                      <p className="text-[12px] font-semibold text-white leading-[1.3] truncate">{profile?.name ?? 'Admin'}</p>
                      <p className="text-[10px] text-pos-muted leading-[1.3] truncate">{profile?.email ?? '—'}</p>
                    </>
                  )}
                </div>
              )}
            </button>
            {open && profile?.email && (
              <CopyIconButton value={profile.email} title="Copy email" size={13} className="text-pos-muted hover:text-white" />
            )}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              title="Logout"
              aria-label="Logout"
              className="size-8 rounded-md flex items-center justify-center shrink-0 text-pos-muted hover:text-white hover:bg-dark-active transition-colors duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/40"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <CommandPalette items={paletteItems} open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {showLogoutConfirm && (
        <Modal title="Log out?" onClose={() => setShowLogoutConfirm(false)} footer={
          <>
            <Button variant="ghost" onClick={() => setShowLogoutConfirm(false)} disabled={loggingOut}>Cancel</Button>
            <Button variant="primary" onClick={handleLogout} loading={loggingOut}>Logout</Button>
          </>
        }>
          <p className="text-[13px] text-slate">You'll need to sign in again to access the admin panel.</p>
        </Modal>
      )}
    </>
  );
}

export function AdminLayout() {
  const { pathname: currentPath } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const toggle = () => setSidebarOpen(o => !o);

  const user = TokenStorage.getUser<{ role?: AppRole }>();
  if (!TokenStorage.isLoggedIn() || user?.role !== 'admin') {
    return <Navigate to={`/admin/login?redirect=${encodeURIComponent(currentPath)}`} replace />;
  }

  return (
    <div className={clsx('flex bg-cream overflow-hidden', 'h-screen')}>
      <AdminSidebar open={sidebarOpen} onToggle={toggle} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div data-lenis-prevent className="flex-1 overflow-y-auto pb-[64px] lg:pb-0">
          <Outlet />
        </div>
      </div>
      <AdminBottomNav />
    </div>
  );
}
