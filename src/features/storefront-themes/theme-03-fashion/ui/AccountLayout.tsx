import type { ReactNode } from 'react';
import { ts } from '@/utils/tStatic';
import { NavLink } from 'react-router-dom';
import { Bell, Gift, Heart, MapPin, MessageSquare, Package, RotateCcw, Star, User, Wallet } from 'lucide-react';
import { fashionTheme as t } from '../theme.config';
import { Page, PageTitle } from './primitives';

const LINKS = [
  { to: '/account', label: 'Profile', icon: User, end: true },
  { to: '/orders', label: 'Orders', icon: Package },
  { to: '/returns', label: 'Returns', icon: RotateCcw },
  { to: '/addresses', label: 'Addresses', icon: MapPin },
  { to: '/wishlist', label: 'Wishlist', icon: Heart },
  { to: '/reviews', label: 'Reviews', icon: Star },
  { to: '/gift-cards', label: 'Gift cards', icon: Gift },
  { to: '/store-credit', label: 'Store credit', icon: Wallet },
  { to: '/messages', label: 'Messages', icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', icon: Bell },
];

/** Shell for every signed-in account page: side navigation on desktop, scrollable tabs on mobile. */
export function AccountLayout({ title, accent, subtitle, actions, children }: { title: string; accent?: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <Page>
      <PageTitle accent={accent} subtitle={subtitle} actions={actions}>{title}</PageTitle>
      <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr] lg:gap-10">
        <nav aria-label={ts('nav.account', 'Account')} className="fx-hide-scroll -mx-1 flex gap-1 overflow-x-auto px-1 lg:sticky lg:top-24 lg:flex-col lg:overflow-visible">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className="flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-medium no-underline transition-colors lg:rounded-xl"
              style={({ isActive }) => ({ background: isActive ? t.colors.ink : 'transparent', color: isActive ? t.colors.bg : t.colors.ink })}>
              <Icon size={16} aria-hidden />{label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </Page>
  );
}
