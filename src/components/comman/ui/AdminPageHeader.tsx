import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title:     string;
  subtitle?: string;
  actions?:  ReactNode;
  /** Small branded icon badge before the title — used sparingly (e.g. the
   *  admin landing page) rather than on every page, so it stays a
   *  deliberate accent instead of one more arbitrary variant. */
  icon?:     ReactNode;
}

// The admin panel had two competing header conventions — a sticky bordered
// bar (AdminBanners, AdminFaqs, AdminPlatformPlans, ...) and a plain h1 block
// that scrolls away with the page (AdminUsers, AdminLeads, AdminMarketplace,
// ...). This is the one they converge on: sticky wins (it keeps the title
// and primary action visible on a long table), and padding is responsive
// (px-4 on mobile, px-7 from sm: up) rather than some pages being fixed at
// px-7 regardless of viewport.
export function AdminPageHeader({ title, subtitle, actions, icon }: AdminPageHeaderProps) {
  return (
    <div className="bg-white border-b border-bone px-4 sm:px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between gap-3 flex-wrap">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex size-9 items-center justify-center rounded-xl bg-brand-pale-orange text-brand-deep-orange shrink-0">
            {icon}
          </div>
        )}
        <div key={title}>
          <h1 className="solvexo-title-reveal text-[18px] font-bold text-charcoal leading-[1.3]">{title}</h1>
          {subtitle && <p className="solvexo-subtitle-reveal text-[12px] text-slate mt-[2px]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </div>
  );
}
