import type { ReactNode } from 'react';

/** Shared card frame for the SaaS Metrics tabs. */
export function Card({ title, subtitle, children, action }: { title: string; subtitle?: string; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="bg-white border border-bone rounded-[10px] px-5 py-4">
      <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
        <div><h2 className="text-[14px] font-bold text-charcoal">{title}</h2>{subtitle && <p className="text-[11.5px] text-slate mt-0.5">{subtitle}</p>}</div>
        {action}
      </div>
      {children}
    </section>
  );
}
export const Empty = ({ text }: { text: string }) => <p className="text-[12.5px] text-slate py-6 text-center">{text}</p>;

