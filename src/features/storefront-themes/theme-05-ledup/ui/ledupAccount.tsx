import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { ArrowLeft, LogOut } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { useLogout } from '@/hooks/auth/useLogout';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import type { BadgeTone, OrderBadgeInfo } from '../../orderUi';
import { ledupTheme as t } from '../theme.config';
import { PillButton } from './ledupForm';
import { LedupBox, LedupBreadcrumbs } from './ledupUiPort';

interface NavItem { to: string; label: string; end?: boolean }

/** The account menu in the design's groups (dashboard / shopping / reviews / digital / money & messages), each group closed by a hairline. */
function buildGroups(digital: boolean): NavItem[][] {
  return [
    [
      { to: '/account', label: ts('tx.account.dashboard', 'Account dashboard'), end: true },
      { to: '/addresses', label: ts('account.addresses', 'Address book') },
      { to: '/orders', label: ts('account.orders', 'My orders') },
      { to: '/returns', label: ts('account.returns', 'Returns') },
    ],
    [
      { to: '/wishlist', label: ts('nav.wishlist', 'My wish list') },
      { to: '/reviews', label: ts('account.reviews', 'My product reviews') },
    ],
    ...(digital ? [[
      { to: '/library', label: ts('dg.nav_library', 'My library') },
      { to: '/learn', label: ts('dg.nav_courses', 'Courses') },
      { to: '/memberships', label: ts('dg.nav_memberships', 'Memberships') },
      { to: '/licenses', label: ts('dg.nav_licenses', 'Licenses') },
    ]] : []),
    [
      { to: '/gift-cards', label: ts('pg.gift_cards', 'Gift cards') },
      { to: '/store-credit', label: ts('checkout.storeCredit', 'Store credit') },
      { to: '/messages', label: ts('account.messages', 'Messages') },
      { to: '/notifications', label: ts('account.notifications', 'Notifications') },
    ],
  ];
}

/** Shell for every signed-in account page: a soft panel menu with a blue bar on the active item (a scrolling tab strip on phones). */
export function LedupAccountLayout({ title, crumb, subtitle, actions, children }: { title: string; crumb?: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const { store } = useStorefront();
  const logout = useLogout();
  const groups = buildGroups(!!store.sellsDigital);
  const flat = groups.flat();
  const linkBase = 'block whitespace-nowrap px-4 py-2.5 text-sm no-underline';
  return (
    <LedupBox>
      <LedupBreadcrumbs items={[{ label: ts('pg.home', 'Home'), to: '/' }, { label: crumb ?? title }]} />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="m-0 text-[clamp(26px,3.6vw,40px)] font-semibold leading-tight" style={{ fontFamily: t.fonts.display }}>{title}</h1>
          {subtitle && <p className="m-0 mt-2 max-w-[620px] text-sm" style={{ color: t.colors.inkMuted }}>{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
        <nav aria-label={ts('nav.account', 'Account')} className="lg:sticky lg:top-24">
          <ul className="tx-hide-scroll m-0 flex list-none gap-1 overflow-x-auto p-0 lg:hidden">
            {flat.map(i => (
              <li key={i.to} className="shrink-0"><NavLink to={i.to} end={i.end} className={`${linkBase}`} style={({ isActive }) => ({ background: isActive ? t.colors.accent : t.colors.bgAlt, color: isActive ? t.colors.accentInk : t.colors.ink, borderRadius: t.fieldRadiusPx })}>{i.label}</NavLink></li>
            ))}
          </ul>
          <div className="hidden p-3 lg:block" style={{ background: t.colors.bgAlt, borderRadius: t.cardRadiusPx }}>
            {groups.map((g, gi) => (
              <ul key={gi} className="m-0 list-none p-0" style={gi > 0 ? { borderTop: `1px solid ${t.colors.border}`, marginTop: 8, paddingTop: 8 } : undefined}>
                {g.map(i => (
                  <li key={i.to}>
                    <NavLink to={i.to} end={i.end} className={linkBase} style={({ isActive }) => ({ color: isActive ? t.colors.ink : t.colors.inkMuted, fontWeight: isActive ? 600 : 400, borderInlineStart: `3px solid ${isActive ? t.colors.accent : 'transparent'}` })}>{i.label}</NavLink>
                  </li>
                ))}
              </ul>
            ))}
            <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${t.colors.border}` }}>
              <button type="button" onClick={() => void logout('/')} className="flex w-full cursor-pointer items-center gap-2 border-0 bg-transparent px-4 py-2.5 text-start text-sm" style={{ color: t.colors.inkMuted }}><LogOut size={15} aria-hidden />{ts('account.logout', 'Log out')}</button>
            </div>
          </div>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </LedupBox>
  );
}

/** A section with an underlined heading, like "Account information" in the design. */
export function LedupSection({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="mb-9">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3 pb-3" style={{ borderBottom: `1px solid ${t.colors.border}` }}>
        <h2 className="m-0 text-lg font-semibold" style={{ fontFamily: t.fonts.display }}>{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** Account pages need a real (non-guest) account; a guest is sent to /login and sees a message meanwhile. */
export function RequireAccount({ children }: { children: ReactNode }) {
  const guest = useRequireRealAccount();
  return guest ? <p role="status" className="m-0 p-10 text-center text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.redirecting_to_sign_in', 'Redirecting to sign in')}</p> : <>{children}</>;
}

/** Square status chip; the colour follows the tone, read each render so the seller's colours apply. */
export function LedupStatusChip({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  const c = { success: t.colors.success, warning: t.colors.warning, info: t.colors.accent, danger: t.colors.danger, neutral: t.colors.inkMuted }[tone];
  return <span className="inline-block px-2.5 py-0.5 text-xs font-semibold" style={{ background: `color-mix(in srgb, ${c} 14%, transparent)`, color: c, borderRadius: t.badgeRadiusPx }}>{children}</span>;
}
export function LedupOrderChip({ badge }: { badge: OrderBadgeInfo }) {
  return <LedupStatusChip tone={badge.tone}>{badge.label}</LedupStatusChip>;
}

export function LedupBackLink({ to, children }: { to: string; children: ReactNode }) {
  return <Link to={to} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium no-underline" style={{ color: t.colors.accent }}><ArrowLeft size={15} className="tx-flip-rtl" aria-hidden />{children}</Link>;
}

/** Previous / Next pager with a live "Page x of y" label. Renders nothing for a single page. */
export function LedupPager({ page, totalPages, onChange, busy }: { page: number; totalPages: number; onChange: (p: number) => void; busy?: boolean }) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={ts('pg.pagination', 'Pagination')} className="mt-6 flex items-center justify-between gap-3">
      <PillButton variant="outline" disabled={page <= 1 || busy} onClick={() => onChange(page - 1)}>{ts('orders.previous', 'Previous')}</PillButton>
      <span aria-live="polite" className="text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.page_page_of_total', 'Page {{page}} of {{total}}', { page, total: totalPages })}</span>
      <PillButton variant="outline" disabled={page >= totalPages || busy} onClick={() => onChange(page + 1)}>{ts('orders.next', 'Next')}</PillButton>
    </nav>
  );
}

/** Same call shape the customer pages use: `*accent*` markers in the title are only an accent in other themes, Tech prints plain text. */
export function AccountLayout({ title, subtitle, actions, children }: { title: string; accent?: string; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  const plain = title.replace(/\*/g, '');
  return <LedupAccountLayout title={plain} crumb={plain} subtitle={subtitle} actions={actions}>{children}</LedupAccountLayout>;
}
