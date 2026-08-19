import { useState, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'motion/react';
import {
  Store, MonitorSmartphone, Sparkles, BarChart3, PackageCheck, Users,
  ChevronDown, ArrowRight, Menu, X, LifeBuoy, HelpCircle, Mail,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SolvexoLogo } from './SolvexoLogo';
import { TokenStorage } from '@/api/services/auth';
import { NotificationBell } from './NotificationBell';
import { ProfileAvatar } from './ProfileAvatar';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { useCompactOnScroll } from './BuyerNavbar';
import { PLATFORM_PRODUCTS } from '@/features/buyer/data/platformProducts';
import { SOLUTIONS } from '@/features/buyer/data/solutions';

const PRODUCT_ICONS: Record<string, LucideIcon> = {
  'store-builder': Store,
  pos: MonitorSmartphone,
  'ai-commerce': Sparkles,
  analytics: BarChart3,
  inventory: PackageCheck,
  'orders-customers': Users,
};

const RESOURCE_LINKS = [
  { Icon: HelpCircle, label: 'FAQ', desc: 'Answers to common questions', path: '/faq' },
  { Icon: LifeBuoy,    label: 'Help Center', desc: 'Get support from our team', path: '/help' },
  { Icon: Mail,        label: 'Contact Us', desc: 'Reach sales, support or partnerships', path: '/contact-us' },
];

type MenuKey = 'products' | 'solutions' | 'resources' | null;

function DesktopMenuButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-1 text-[13px] font-medium px-1 py-2 bg-transparent border-none cursor-pointer transition-colors',
        active ? 'text-brand-orange' : 'text-charcoal hover:text-brand-orange',
      )}
    >
      {label} <ChevronDown size={13} className={clsx('transition-transform duration-200', active && 'rotate-180')} />
    </button>
  );
}

export function PublicMegaNavbar() {
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const { scrolled } = useCompactOnScroll();
  const [openMenu, setOpenMenu] = useState<MenuKey>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openNow = useCallback((key: MenuKey) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenMenu(key);
  }, []);
  const closeSoon = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenMenu(null), 120);
  }, []);

  const loggedIn = TokenStorage.isLoggedIn();

  return (
    <>
      <header
        className={clsx(
          'sticky top-0 z-50 transition-[background-color,border-color,box-shadow] duration-200 border-b',
          scrolled ? 'bg-white/95 backdrop-blur-md border-bone shadow-[0_1px_0_rgba(0,0,0,0.03)]' : 'bg-white/80 backdrop-blur-sm border-transparent',
        )}
        onMouseLeave={closeSoon}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-[60px] flex items-center justify-between gap-4">
          <Link to="/" className="shrink-0" aria-label="Solvexo home">
            <SolvexoLogo size={28} />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-6">
            <div onMouseEnter={() => openNow('products')}>
              <DesktopMenuButton label="Products" active={openMenu === 'products'} onClick={() => openNow(openMenu === 'products' ? null : 'products')} />
            </div>
            <div onMouseEnter={() => openNow('solutions')}>
              <DesktopMenuButton label="Solutions" active={openMenu === 'solutions'} onClick={() => openNow(openMenu === 'solutions' ? null : 'solutions')} />
            </div>
            <div onMouseEnter={() => openNow('resources')}>
              <DesktopMenuButton label="Resources" active={openMenu === 'resources'} onClick={() => openNow(openMenu === 'resources' ? null : 'resources')} />
            </div>
            <Link to="/pricing" onMouseEnter={() => openNow(null)} className="text-[13px] font-medium text-charcoal hover:text-brand-orange transition-colors">Pricing</Link>
            <Link to="/sellers" onMouseEnter={() => openNow(null)} className="text-[13px] font-medium text-charcoal hover:text-brand-orange transition-colors">For Sellers</Link>
          </nav>

          {/* Actions */}
          <div className="hidden lg:flex items-center gap-3 shrink-0">
            {loggedIn ? (
              <>
                <NotificationBell />
                <ProfileAvatar />
              </>
            ) : (
              <>
                <button onClick={() => navigate('/login')} className="text-[13px] font-medium text-charcoal hover:text-brand-orange transition-colors bg-transparent border-none cursor-pointer">
                  Log in
                </button>
                <button
                  onClick={sellEntry.go}
                  disabled={sellEntry.loading}
                  className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-white bg-brand-orange hover:bg-brand-deep-orange transition-colors rounded-lg px-4 py-[9px] border-none cursor-pointer disabled:opacity-60"
                >
                  Start Selling
                </button>
              </>
            )}
          </div>

          <button onClick={() => setMobileOpen(true)} className="lg:hidden bg-transparent border-none cursor-pointer text-carbon p-1" aria-label="Open menu">
            <Menu size={22} />
          </button>
        </div>

        {/* Mega menu panels */}
        <AnimatePresence>
          {openMenu && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={() => openNow(openMenu)}
              className="hidden lg:block absolute left-0 right-0 top-full bg-white border-b border-bone shadow-xl"
            >
              <div className="max-w-[1280px] mx-auto px-8 py-7">
                {openMenu === 'products' && (
                  <div className="grid grid-cols-3 gap-2">
                    {PLATFORM_PRODUCTS.map(p => {
                      const Icon = PRODUCT_ICONS[p.slug] ?? Store;
                      return (
                        <Link
                          key={p.slug}
                          to={`/products/${p.slug}`}
                          onClick={() => setOpenMenu(null)}
                          className="flex items-start gap-3 rounded-xl p-3 hover:bg-cream transition-colors"
                        >
                          <span className="w-9 h-9 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
                            <Icon size={17} className="text-brand-orange" />
                          </span>
                          <span>
                            <span className="block text-[13px] font-semibold text-carbon">{p.name}</span>
                            <span className="block text-[11.5px] text-slate leading-snug mt-0.5">{p.tagline}</span>
                          </span>
                        </Link>
                      );
                    })}
                    <Link
                      to="/products"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center justify-between rounded-xl p-3 bg-cream text-[13px] font-semibold text-brand-orange hover:bg-brand-pale-orange transition-colors col-span-1"
                    >
                      Explore all products <ArrowRight size={14} />
                    </Link>
                  </div>
                )}

                {openMenu === 'solutions' && (
                  <div className="grid grid-cols-4 gap-2">
                    {SOLUTIONS.map(s => (
                      <Link
                        key={s.slug}
                        to={`/solutions/${s.slug}`}
                        onClick={() => setOpenMenu(null)}
                        className="rounded-xl p-3 hover:bg-cream transition-colors"
                      >
                        <span className="block text-[13px] font-semibold text-carbon">{s.name}</span>
                        <span className="block text-[11.5px] text-slate leading-snug mt-0.5">{s.headline}</span>
                      </Link>
                    ))}
                    <Link
                      to="/solutions"
                      onClick={() => setOpenMenu(null)}
                      className="flex items-center justify-between rounded-xl p-3 bg-cream text-[13px] font-semibold text-brand-orange hover:bg-brand-pale-orange transition-colors"
                    >
                      All solutions <ArrowRight size={14} />
                    </Link>
                  </div>
                )}

                {openMenu === 'resources' && (
                  <div className="grid grid-cols-3 gap-2 max-w-[600px]">
                    {RESOURCE_LINKS.map(r => (
                      <Link
                        key={r.path}
                        to={r.path}
                        onClick={() => setOpenMenu(null)}
                        className="flex items-start gap-3 rounded-xl p-3 hover:bg-cream transition-colors"
                      >
                        <span className="w-9 h-9 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
                          <r.Icon size={16} className="text-brand-orange" />
                        </span>
                        <span>
                          <span className="block text-[13px] font-semibold text-carbon">{r.label}</span>
                          <span className="block text-[11.5px] text-slate leading-snug mt-0.5">{r.desc}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden fixed inset-0 z-[60] bg-black/40"
            onClick={() => setMobileOpen(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              onClick={e => e.stopPropagation()}
              className="absolute right-0 top-0 bottom-0 w-[86%] max-w-[360px] bg-white overflow-y-auto"
            >
              <div className="flex items-center justify-between px-5 h-[60px] border-b border-bone">
                <SolvexoLogo size={26} />
                <button onClick={() => setMobileOpen(false)} className="bg-transparent border-none cursor-pointer text-carbon p-1" aria-label="Close menu">
                  <X size={22} />
                </button>
              </div>
              <div className="p-5 flex flex-col gap-6">
                <MobileSection title="Products" items={PLATFORM_PRODUCTS.map(p => ({ label: p.name, path: `/products/${p.slug}` }))} viewAll="/products" onNavigate={() => setMobileOpen(false)} />
                <MobileSection title="Solutions" items={SOLUTIONS.map(s => ({ label: s.name, path: `/solutions/${s.slug}` }))} viewAll="/solutions" onNavigate={() => setMobileOpen(false)} />
                <MobileSection title="Resources" items={RESOURCE_LINKS.map(r => ({ label: r.label, path: r.path }))} onNavigate={() => setMobileOpen(false)} />
                <div className="flex flex-col gap-3 pt-2 border-t border-bone">
                  <Link to="/pricing" onClick={() => setMobileOpen(false)} className="text-[13.5px] font-semibold text-carbon">Pricing</Link>
                  <Link to="/sellers" onClick={() => setMobileOpen(false)} className="text-[13.5px] font-semibold text-carbon">For Sellers</Link>
                </div>
                <div className="flex flex-col gap-2.5 pt-2">
                  {loggedIn ? (
                    <ProfileAvatar />
                  ) : (
                    <>
                      <button onClick={() => { setMobileOpen(false); navigate('/login'); }} className="text-[13.5px] font-semibold text-charcoal border border-bone rounded-lg py-2.5 bg-transparent cursor-pointer">
                        Log in
                      </button>
                      <button onClick={() => { setMobileOpen(false); sellEntry.go(); }} className="text-[13.5px] font-semibold text-white bg-brand-orange rounded-lg py-2.5 border-none cursor-pointer">
                        Start Selling
                      </button>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MobileSection({ title, items, viewAll, onNavigate }: { title: string; items: { label: string; path: string }[]; viewAll?: string; onNavigate: () => void }) {
  return (
    <div>
      <p className="text-[11px] font-bold text-slate uppercase tracking-[0.08em] mb-2.5">{title}</p>
      <div className="flex flex-col gap-2">
        {items.map(item => (
          <Link key={item.path} to={item.path} onClick={onNavigate} className="text-[13.5px] text-charcoal py-1">
            {item.label}
          </Link>
        ))}
        {viewAll && (
          <Link to={viewAll} onClick={onNavigate} className="text-[13px] font-semibold text-brand-orange py-1 inline-flex items-center gap-1">
            View all <ArrowRight size={13} />
          </Link>
        )}
      </div>
    </div>
  );
}
