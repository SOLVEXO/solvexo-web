import { Heart, MessageCircle, Gift, RefreshCw } from 'lucide-react';
import { Toggle } from '@/components/comman/ui';
import type { IdentityBanner } from '@/api/services/storeTheme';

const ROWS: { key: keyof IdentityBanner; label: string; hint: string; Icon: typeof Heart }[] = [
  { key: 'showFollowButton',     label: 'Follow button',     hint: 'Lets buyers follow your store for updates.',                 Icon: Heart },
  { key: 'showMessageButton',    label: 'Message button',    hint: 'Lets buyers message you directly from your store page.',     Icon: MessageCircle },
  { key: 'showLoyaltyButton',    label: 'Loyalty points',    hint: 'Shows a buyer\'s points balance if your Loyalty program is active.', Icon: Gift },
  { key: 'showMembershipButton', label: 'Membership button', hint: 'Shows a shortcut to your paid membership plans, if you have any.', Icon: RefreshCw },
];

// The store-identity banner (logo/name/description at the top of the home
// page) is fixed chrome, not a rearrangeable section — but the seller can
// still choose which of its action buttons appear.
export function StoreInfoTab({ value, onChange }: { value: IdentityBanner; onChange: (next: IdentityBanner) => void }) {
  return (
    <div className="flex flex-col gap-1 max-w-[520px]">
      <p className="text-[12.5px] text-slate mb-2">Choose which buttons appear on your store's identity banner (the top section with your logo and name).</p>
      {ROWS.map(row => (
        <div key={row.key} className="flex items-center gap-3 py-3 border-b border-bone last:border-b-0">
          <div className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center shrink-0">
            <row.Icon size={16} className="text-slate" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-charcoal">{row.label}</p>
            <p className="text-[11.5px] text-slate mt-[1px]">{row.hint}</p>
          </div>
          <Toggle checked={value[row.key]} onChange={v => onChange({ ...value, [row.key]: v })} />
        </div>
      ))}
    </div>
  );
}
