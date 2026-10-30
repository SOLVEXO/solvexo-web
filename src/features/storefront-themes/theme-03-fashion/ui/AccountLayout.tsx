import type { ReactNode } from 'react';
import { ts } from '@/utils/tStatic';
import { NavLink } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { Bell, Crown, Gift, GraduationCap, Heart, KeyRound, Library, MapPin, MessageSquare, Package, RotateCcw, Star, User, Wallet } from 'lucide-react';
import { fashionTheme as t } from '../theme.config';
import { Page, PageTitle } from './primitives';

/** Digital pages only appear for stores that sell digital downloads or educational resources. */
const buildLinks = (digital: boolean) => [
  ...(digital ? [
    { to: '/library', label: ts('dg.nav_library', 'Library'), icon: Library, end: false },
    { to: '/learn', label: ts('dg.nav_courses', 'Courses'), icon: GraduationCap, end: false },
    { to: '/memberships', label: ts('dg.nav_memberships', 'Memberships'), icon: Crown, end: false },
    { to: '/licenses', label: ts('dg.nav_licenses', 'Licenses'), icon: KeyRound, end: false },
  ] : []),
  { to: '/account', label: ts('account.profile', 'Profile'), icon: User, end: true },
  { to: '/orders', label: ts('account.orders', 'Orders'), icon: Package },
  { to: '/returns', label: ts('account.returns', 'Returns'), icon: RotateCcw },
  { to: '/addresses', label: ts('account.addresses', 'Addresses'), icon: MapPin },
  { to: '/wishlist', label: ts('nav.wishlist', 'Wishlist'), icon: Heart },
  { to: '/reviews', label: ts('account.reviews', 'Reviews'), icon: Star },
  { to: '/gift-cards', label: ts('pg.gift_cards', 'Gift cards'), icon: Gift },
  { to: '/store-credit', label: ts('checkout.storeCredit', 'Store credit'), icon: Wallet },
  { to: '/messages', label: ts('account.messages', 'Messages'), icon: MessageSquare },
  { to: '/notifications', label: ts('account.notifications', 'Notifications'), icon: Bell },
];

/** Shell for every signed-in account page: side navigation on desktop, scrollable tabs on mobile. */
export function AccountLayout({ title, accent, subtitle, actions, children }: { title: string; accent?: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const { store } = useStorefront();
  const digital = !!store.sellsDigital;
  return (
    <Page>
      <PageTitle accent={accent} subtitle={subtitle} actions={actions}>{title}</PageTitle>
      <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <nav aria-label={ts('nav.account', 'Account')} className="fx-hide-scroll -mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
          {buildLinks(digital).map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium no-underline transition-colors lg:rounded-xl"
              style={({ isActive }) => ({ background: isActive ? t.colors.selected : 'transparent', color: isActive ? t.colors.selectedInk : t.colors.ink })}>
              <Icon size={16} aria-hidden />{label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </Page>
  );
}
