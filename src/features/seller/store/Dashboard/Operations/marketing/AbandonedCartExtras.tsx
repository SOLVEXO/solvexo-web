import { useState } from 'react';
import { apiSendAbandonedCartTest, type AbandonedCartSettings } from '@/api/services/abandonedCart';
import { Button } from '@/components/comman/ui';

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';

/** The settings added to Abandoned Cart Recovery: a discount code shown in the reminder, and an optional second reminder. */
export function AbandonedCartExtras({ storeId, settings, onChange }: { storeId: string; settings: AbandonedCartSettings; onChange: (patch: Partial<AbandonedCartSettings>) => void }) {
  const second = settings.secondReminderEnabled === true;
  const [testEmail, setTestEmail] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function sendTest() {
    setTesting(true);
    setTestMsg(null);
    try {
      const res = await apiSendAbandonedCartTest(storeId, testEmail.trim() || undefined);
      setTestMsg({ ok: true, text: res.message || 'Test email sent.' });
    } catch (e) {
      setTestMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not send the test email.' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <>
      <div className="border-t border-bone pt-3.5">
        <label htmlFor="ac-audience" className="text-xs font-medium text-graphite mb-[5px] block">Send to</label>
        <select id="ac-audience" value={settings.audience ?? 'subscribed'} onChange={e => onChange({ audience: e.target.value as 'subscribed' | 'all' })} className={INPUT_CLS}>
          <option value="subscribed">Customers who accept marketing</option>
          <option value="all">All customers</option>
        </select>
        <p className="text-[11px] text-slate mt-1">Same choice as Shopify's “To:” field. With “All customers”, check the marketing rules that apply where your customers live. Anyone who unsubscribed is never emailed.</p>
      </div>

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
        <p className="text-[11px] text-slate mt-1">Type a code you already made under Discounts. It is shown in the email as “Your code”. Leave empty for no discount.</p>
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

      <div className="border-t border-bone pt-3.5">
        <label htmlFor="ac-test-email" className="text-xs font-medium text-graphite mb-[5px] block">Send a test email (saved settings)</label>
        <div className="flex gap-2">
          <input id="ac-test-email" type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)} placeholder="Leave empty to use your store's contact email" className={INPUT_CLS} />
          <Button variant="outline" onClick={sendTest} loading={testing}>Send test</Button>
        </div>
        {testMsg && <p className={`text-[12px] mt-1.5 ${testMsg.ok ? 'text-success' : 'text-error'}`}>{testMsg.text}</p>}
        <p className="text-[11px] text-slate mt-1">The test uses your last saved settings — save first if you just changed the message.</p>
      </div>
    </>
  );
}
