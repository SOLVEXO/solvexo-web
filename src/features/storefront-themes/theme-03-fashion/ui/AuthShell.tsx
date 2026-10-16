import type { ReactNode } from 'react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { fashionTheme as t } from '../theme.config';

/** Centered card layout for sign in / register / OTP / password pages. */
export function AuthShell({ title, accent, subtitle, children, footer }: { title: string; accent?: string; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode }) {
  const { store } = useStorefront();
  return (
    <div className="grid place-items-center" style={{ padding: `clamp(32px, 6vw, 80px) ${t.layout.containerPadX}`, background: t.colors.bgAlt, minHeight: 'min(80vh, 760px)', fontFamily: t.fonts.body, color: t.colors.ink }}>
      <div className="w-full max-w-[460px] p-7 md:p-10" style={{ background: t.colors.bg, borderRadius: 28, border: `1px solid ${t.colors.border}` }}>
        <p className="m-0 mb-6 text-center text-sm font-semibold tracking-tight" style={{ color: t.colors.inkMuted }}>{store.name}</p>
        <h1 className="m-0 text-center text-[clamp(26px,3.4vw,34px)] font-medium leading-[1.15] tracking-tight" style={{ fontFamily: t.fonts.display }}>
          {title}{accent && <> <span className="fx-serif" style={{ fontSize: '1.06em' }}>{accent}</span></>}
        </h1>
        {subtitle && <p className="m-0 mt-3 text-center text-[15px] leading-relaxed" style={{ color: t.colors.inkMuted }}>{subtitle}</p>}
        <div className="mt-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm" style={{ color: t.colors.inkMuted }}>{footer}</div>}
      </div>
    </div>
  );
}
