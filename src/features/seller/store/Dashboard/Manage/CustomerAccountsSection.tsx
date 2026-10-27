import { Link } from 'react-router-dom';
import { Users } from 'lucide-react';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { SettingsCard, SettingsChoice, SettingsRow } from '@/components/comman/settings';

type Mode = 'optional' | 'required';

const OPTIONS: { value: Mode; label: string; description: string }[] = [
  { value: 'optional', label: 'Accounts are optional', description: 'Customers can check out as guests or create an account.' },
  { value: 'required', label: 'Accounts are required', description: 'Customers must sign in to check out.' },
];

/** Shopify Settings → Customer accounts (Optional / Required).
 *  Presentational only: the owning tab holds `customerAccounts` in the same
 *  form state and save call as the rest of the tab, so one Save button covers
 *  the whole page instead of one per card. */
export function CustomerAccountsSection({ storeId, mode, onMode }: {
  storeId: string;
  mode: Mode;
  onMode: (mode: Mode) => void;
}) {
  const canEdit = hasNavPermission(TokenStorage.getUser(), 'settings.general.manage');

  return (
    <SettingsCard
      title="Customer accounts"
      icon={<Users size={14} />}
      description="Choose whether customers need an account to check out."
    >
      <div role="radiogroup" aria-label="Customer accounts" className="grid gap-2.5 sm:grid-cols-2">
        {OPTIONS.map(o => (
          <SettingsChoice
            key={o.value}
            name="customer-accounts"
            checked={mode === o.value}
            label={o.label}
            description={o.description}
            disabled={!canEdit}
            onChange={() => onMode(o.value)}
          />
        ))}
      </div>

      <div className="mt-1 border-t border-fog">
        <SettingsRow
          label="Authentication"
          description="Let customers sign in with Google or Facebook."
        >
          <Link
            to={`/store/${storeId}/settings/customer-accounts/authentication`}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg border border-bone bg-white text-[12.5px] font-semibold text-charcoal no-underline hover:bg-cream"
          >
            Manage
          </Link>
        </SettingsRow>
      </div>

      {!canEdit && <p className="mt-1 text-[11px] text-slate">You need the "Manage general settings" permission to change this.</p>}
    </SettingsCard>
  );
}
