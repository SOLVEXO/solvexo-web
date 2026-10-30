import { Link } from 'react-router-dom';
import { AlertCircle, ChevronRight, Mail } from 'lucide-react';
import { Button, Card, Toggle } from '@/components/comman/ui';
import type { CustomerEmailGroup, CustomerEmailSetting, StoreNotificationSettings } from '@/api/services/storeNotifications';

const GROUPS: { id: CustomerEmailGroup; title: string }[] = [
  { id: 'orders', title: 'Orders' },
  { id: 'returns', title: 'Returns & exchanges' },
  { id: 'invoices', title: 'Invoices & gift cards' },
  { id: 'digital', title: 'Digital products & memberships' },
];

interface Props {
  storeId: string;
  settings: StoreNotificationSettings | null;
  loading: boolean;
  loadError: string;
  rowError: string;
  onRetry: () => void;
  onToggle: (key: string, enabled: boolean) => void;
  onOpen: (email: CustomerEmailSetting) => void;
}

/** Customer emails, grouped. Each row is one click target (opens the editor); the switch is its own control. */
export function CustomerEmailsList({ storeId, settings, loading, loadError, rowError, onRetry, onToggle, onOpen }: Props) {
  if (loading && !settings) return null;

  if (loadError || !settings) {
    return (
      <Card padding="none">
        <div className="p-5 flex items-center justify-between gap-4">
          <p role="alert" className="flex items-center gap-1.5 text-[12.5px] text-error"><AlertCircle size={14} /> {loadError || 'Could not load.'}</p>
          <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
        </div>
      </Card>
    );
  }

  const customized = settings.events.filter(e => e.customized).length;
  const off = settings.events.filter(e => !e.enabled).length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12.5px] text-slate">
          {settings.events.length} emails · {customized} customized · {off} off. Customers see them under <b className="text-charcoal font-semibold">{settings.storeName ?? 'your store name'}</b>.
        </p>
      </div>

      {settings.deliveryWarning && (
        <p role="alert" className="flex items-start gap-2 text-[12.5px] text-error bg-error-bg rounded-lg px-3 py-2.5">
          <AlertCircle size={14} className="mt-0.5 shrink-0" />
          <span>
            The last {settings.deliveryWarning.consecutiveFailures} emails to your customers could not be delivered, so they may not be getting order updates.
            Open an order and use <b>Resend</b> once email is working again.
          </span>
        </p>
      )}
      {rowError && <p role="alert" className="flex items-center gap-1.5 text-[12px] text-error"><AlertCircle size={13} /> {rowError}</p>}

      {GROUPS.map(group => {
        const emails = settings.events.filter(e => e.group === group.id);
        if (emails.length === 0) return null;
        return (
          <section key={group.id} aria-labelledby={`grp-${group.id}`}>
            <h3 id={`grp-${group.id}`} className="text-[11px] font-semibold text-slate uppercase tracking-[0.06em] mb-1.5 px-1">{group.title}</h3>
            <Card padding="none">
              <ul className="divide-y divide-bone">
                {emails.map(ev => (
                  <li key={ev.key} className="flex items-stretch hover:bg-cream/60 transition-colors">
                    <button
                      type="button"
                      onClick={() => onOpen(ev)}
                      className="flex-1 min-w-0 flex items-center gap-3 px-4 py-3 text-left bg-transparent border-0 cursor-pointer"
                      aria-label={`Edit the "${ev.label}" email`}
                    >
                      <span className="size-8 rounded-lg bg-cream border border-bone flex items-center justify-center shrink-0">
                        <Mail size={14} className={ev.enabled ? 'text-brand-orange' : 'text-slate'} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="text-[13px] pointer-coarse:text-[15px] font-semibold text-charcoal">{ev.label}</span>
                          {ev.customized && <span className="text-[10.5px] pointer-coarse:text-[12px] font-medium text-brand-deep-orange bg-brand-pale-orange px-1.5 py-0.5 rounded">Customized</span>}
                          {!ev.enabled && <span className="text-[10.5px] pointer-coarse:text-[12px] font-medium text-slate bg-bone px-1.5 py-0.5 rounded">Off</span>}
                        </span>
                        <span className="block text-[12px] pointer-coarse:text-[13px] text-slate mt-0.5 line-clamp-2 sm:line-clamp-1">{ev.description}</span>
                      </span>
                      <ChevronRight size={15} className="text-slate shrink-0" aria-hidden />
                    </button>
                    <div className="flex items-center pr-4 pl-2 shrink-0 min-w-[88px] sm:w-[112px] justify-end">
                      {ev.canDisable
                        ? <Toggle checked={ev.enabled} onChange={v => onToggle(ev.key, v)} ariaLabel={`Send the "${ev.label}" email`} />
                        : <span className="text-[11px] font-medium text-slate bg-bone px-2 py-1 rounded whitespace-nowrap">Always sent</span>}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        );
      })}

      <p className="text-[11.5px] text-slate px-1">
        Abandoned-checkout reminders are in <Link to={`/store/${storeId}/marketing/cart`} className="text-brand-orange hover:underline">Marketing → Abandoned Cart</Link>.
        Sign-up codes are sent under your store name and can't be switched off.
      </p>
    </div>
  );
}
