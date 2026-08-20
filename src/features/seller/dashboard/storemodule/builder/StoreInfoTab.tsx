import { Heart, MessageCircle, Gift, RefreshCw, Award, Users, Package, Star } from 'lucide-react';
import { Toggle, Field } from '@/components/comman/ui';
import type { IdentityBanner, IdentityBannerLayout } from '@/api/services/storeTheme';

const BUTTON_ROWS: { key: keyof IdentityBanner; label: string; hint: string; Icon: typeof Heart }[] = [
  { key: 'showFollowButton',     label: 'Follow button',     hint: 'Lets buyers follow your store for updates.',                 Icon: Heart },
  { key: 'showMessageButton',    label: 'Message button',    hint: 'Lets buyers message you directly from your store page.',     Icon: MessageCircle },
  { key: 'showLoyaltyButton',    label: 'Loyalty points',    hint: 'Shows a buyer\'s points balance if your Loyalty program is active.', Icon: Gift },
  { key: 'showMembershipButton', label: 'Membership button', hint: 'Shows a shortcut to your paid membership plans, if you have any.', Icon: RefreshCw },
];

const STAT_ROWS: { key: keyof IdentityBanner; label: string; hint: string; Icon: typeof Award }[] = [
  { key: 'showBadges',        label: 'Seller badges',   hint: 'Verified / Top Seller / Featured badges, when you have any.', Icon: Award },
  { key: 'showFollowerCount', label: 'Follower count',  hint: 'How many buyers follow your store.',                          Icon: Users },
  { key: 'showProductCount',  label: 'Product count',   hint: "Not shown yet elsewhere — your store's total live listings.",  Icon: Package },
  { key: 'showRating',        label: 'Star rating',     hint: 'Your average buyer rating.',                                  Icon: Star },
];

const LAYOUT_OPTIONS: { value: IdentityBannerLayout; label: string; hint: string }[] = [
  { value: 'standard',  label: 'Standard',  hint: 'A medium cover photo with your logo and details below it — today\'s default look.' },
  { value: 'compact',   label: 'Compact',   hint: 'A shorter cover photo, more room for your page content right away.' },
  { value: 'immersive', label: 'Immersive', hint: 'A tall, full-width cover photo with your details overlaid on it.' },
];

function BoolRow({ label, hint, Icon, checked, onChange }: { label: string; hint: string; Icon: typeof Heart; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-bone last:border-b-0">
      <div className="w-9 h-9 rounded-lg bg-cream flex items-center justify-center shrink-0">
        <Icon size={16} className="text-slate" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-charcoal">{label}</p>
        <p className="text-[11.5px] text-slate mt-[1px]">{hint}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}

// The store-identity banner (logo/name/description at the top of the home
// page) is fixed chrome, not a rearrangeable section (see the storefront
// plan's Architectural Boundary) — but layout/visibility around it is fully
// configurable: 3 real compositions (not just a CSS tweak), plus which
// stats/badges show and how much of the description is visible before it
// gets clamped.
export function StoreInfoTab({ value, onChange }: { value: IdentityBanner; onChange: (next: IdentityBanner) => void }) {
  return (
    <div className="flex flex-col gap-6 max-w-[560px]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate mb-2">Banner layout</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LAYOUT_OPTIONS.map(opt => (
            <button
              key={opt.value} type="button" onClick={() => onChange({ ...value, layout: opt.value })}
              className={`text-left px-3 py-2.5 rounded-lg border cursor-pointer transition-colors ${(value.layout ?? 'standard') === opt.value ? 'border-brand-orange bg-brand-pale-orange' : 'border-bone bg-white hover:bg-cream'}`}
            >
              <p className="text-[12.5px] font-bold text-charcoal">{opt.label}</p>
              <p className="text-[11px] text-slate mt-[2px] leading-snug">{opt.hint}</p>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate mb-1">Buttons</p>
        <p className="text-[12px] text-slate mb-1">Choose which action buttons appear on your identity banner.</p>
        {BUTTON_ROWS.map(row => (
          <BoolRow key={row.key} label={row.label} hint={row.hint} Icon={row.Icon} checked={value[row.key] as boolean} onChange={v => onChange({ ...value, [row.key]: v })} />
        ))}
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate mb-1">Stats & badges</p>
        {STAT_ROWS.map(row => (
          <BoolRow key={row.key} label={row.label} hint={row.hint} Icon={row.Icon} checked={value[row.key] as boolean} onChange={v => onChange({ ...value, [row.key]: v })} />
        ))}
      </div>

      <Field label="Description length" hint="Clamp a long store description so it doesn't push your content down.">
        <select
          className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none"
          value={value.descriptionMaxLines ?? ''}
          onChange={e => onChange({ ...value, descriptionMaxLines: e.target.value === '' ? null : Number(e.target.value) })}
        >
          <option value="">Show full description</option>
          <option value={1}>1 line</option>
          <option value={2}>2 lines</option>
          <option value={3}>3 lines</option>
        </select>
      </Field>
    </div>
  );
}
