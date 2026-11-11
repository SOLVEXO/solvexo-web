import type { AbandonedCartSettings } from '@/api/services/abandonedCart';

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';

/** The settings added to Abandoned Cart Recovery: a discount code shown in the reminder, and an optional second reminder. */
export function AbandonedCartExtras({ settings, onChange }: { settings: AbandonedCartSettings; onChange: (patch: Partial<AbandonedCartSettings>) => void }) {
  const second = settings.secondReminderEnabled === true;
  return (
    <>
      <div className="border-t border-bone pt-3.5">
        <label htmlFor="ac-discount" className="text-xs font-medium text-graphite mb-[5px] block">Discount code in the reminder (optional)</label>
        <input
          id="ac-discount"
          value={settings.discountCode ?? ''}
          onChange={e => onChange({ discountCode: e.target.value.toUpperCase() })}
          placeholder="e.g. COMEBACK10"
          maxLength={60}
          className={INPUT_CLS}
        />
        <p className="text-[11px] text-slate mt-1">Type a code you already made under Marketing → Coupons. It is shown in the email as “Your code”. Leave empty for no discount.</p>
      </div>

      <div className="border-t border-bone pt-3.5 flex flex-col gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <label htmlFor="ac-second-on" className="text-[13px] font-medium text-charcoal block cursor-pointer">Send a second reminder</label>
            <p className="text-[11.5px] text-slate">One more email if they still have not ordered. Never more than two in total.</p>
          </div>
          <input id="ac-second-on" type="checkbox" checked={second} onChange={e => onChange({ secondReminderEnabled: e.target.checked })} className="cursor-pointer" />
        </div>

        {second && (
          <>
            <div>
              <label htmlFor="ac-second-hours" className="text-xs font-medium text-graphite mb-[5px] block">Send it this many hours after the first one</label>
              <input
                id="ac-second-hours"
                type="number"
                min={6}
                max={168}
                value={settings.secondReminderDelayHours ?? 24}
                onChange={e => onChange({ secondReminderDelayHours: Number(e.target.value) })}
                className={INPUT_CLS}
              />
              <p className="text-[11px] text-slate mt-1">Between 6 and 168 hours (7 days).</p>
            </div>
            <div>
              <label htmlFor="ac-second-subject" className="text-xs font-medium text-graphite mb-[5px] block">Second email subject</label>
              <input id="ac-second-subject" value={settings.secondSubject ?? ''} onChange={e => onChange({ secondSubject: e.target.value })} className={INPUT_CLS} />
            </div>
            <div>
              <label htmlFor="ac-second-message" className="text-xs font-medium text-graphite mb-[5px] block">Second email message</label>
              <textarea id="ac-second-message" value={settings.secondMessage ?? ''} onChange={e => onChange({ secondMessage: e.target.value })} rows={3} className={`${INPUT_CLS} resize-none`} />
              <p className="text-[11px] text-slate mt-1">Use {'{{customerName}}'}, {'{{storeName}}'}, {'{{cartUrl}}'} and {'{{discountCode}}'}.</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
