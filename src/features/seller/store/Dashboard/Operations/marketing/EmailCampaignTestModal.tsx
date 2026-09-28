import { useState } from 'react';
import { Modal, Button } from '@/components/comman/ui';
import { apiSendEmailCampaignTest, type EmailCampaign } from '@/api/services/emailCampaigns';

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';

/** "Send test email" — the campaign as a subscriber would get it, to the
 *  seller's own inbox by default. */
export function EmailCampaignTestModal({ storeId, campaign, onClose }: { storeId: string; campaign: EmailCampaign; onClose: () => void }) {
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const res = await apiSendEmailCampaignTest(storeId, campaign._id, email.trim() || undefined);
      setResult({ ok: true, text: res.message || 'Test email sent.' });
    } catch (err) {
      setResult({ ok: false, text: err instanceof Error ? err.message : 'Failed to send test email.' });
    } finally {
      setSending(false);
    }
  }

  return (
    <Modal
      title="Send test email"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button onClick={send} loading={sending}>Send test</Button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="text-[12.5px] text-charcoal">
          Sends "<span className="font-semibold">[Test] {campaign.subject}</span>" exactly as subscribers will see it. Opens and clicks aren't tracked.
        </p>
        <div>
          <label htmlFor="campaign-test-email" className="block text-[12px] font-medium text-charcoal mb-1.5">Send to</label>
          <input id="campaign-test-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Leave empty to use your account email" className={INPUT_CLS} />
        </div>
        {result && <p className={`text-[12px] ${result.ok ? 'text-success' : 'text-error'}`}>{result.text}</p>}
      </div>
    </Modal>
  );
}
