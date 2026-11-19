import { useEffect, useState } from 'react';
import { Modal, Button, SkeletonBox } from '@/components/comman/ui';
import { apiGetEmailCampaignReport, type EmailCampaign, type EmailCampaignReport } from '@/api/services/emailCampaigns';
import { apiGetAttribution, type AttributionRow } from '@/api/services/growth';
import { formatMoney } from '@/utils/currency';

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="bg-cream rounded-lg px-3 py-2.5">
      <p className="text-[10px] font-medium text-slate uppercase tracking-[0.06em] mb-0.5">{label}</p>
      <p className="text-[18px] font-bold text-carbon leading-[1.15]">{value}</p>
      {hint && <p className="text-[10.5px] text-slate mt-0.5">{hint}</p>}
    </div>
  );
}

/** One campaign's report: delivery, opens, clicks, the links people clicked, and the sales its tagged links brought in. */
export function EmailCampaignReportModal({ storeId, campaign, onClose }: { storeId: string; campaign: EmailCampaign; onClose: () => void }) {
  const [report, setReport] = useState<EmailCampaignReport | null>(null);
  const [sales, setSales] = useState<{ row: AttributionRow | null; currency: string } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    apiGetEmailCampaignReport(storeId, campaign._id)
      .then(res => {
        if (!alive) return;
        setReport(res.data);
        // Sales come from Growth: the visits whose utm_campaign is this campaign's tag (email links are tagged automatically).
        apiGetAttribution(storeId, { range: '90d', model: 'last_non_direct', by: 'campaign' })
          .then(a => { if (alive) setSales({ row: a.data.rows.find(r => r.key === res.data.utmCampaign) ?? null, currency: a.data.currency }); })
          .catch(() => { if (alive) setSales({ row: null, currency: 'USD' }); });
      })
      .catch(e => { if (alive) setError(e instanceof Error ? e.message : 'Failed to load the report.'); });
    return () => { alive = false; };
  }, [storeId, campaign._id]);

  return (
    <Modal title={`Report — ${campaign.name}`} onClose={onClose} width={560} footer={<Button variant="primary" onClick={onClose}>Close</Button>}>
      {error && <p className="text-[12.5px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>}
      {!report && !error && <SkeletonBox height={220} rounded="10px" />}
      {report && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Stat label="Recipients" value={report.recipients.toLocaleString()} />
            <Stat label="Delivered" value={report.sent.toLocaleString()} hint={report.failed > 0 ? `${report.failed.toLocaleString()} failed` : undefined} />
            <Stat label="Open rate" value={`${report.openRate}%`} hint={`${report.opens.toLocaleString()} opened`} />
            <Stat label="Click rate" value={`${report.clickRate}%`} hint={`${report.clicks.toLocaleString()} clicked`} />
            {sales?.row ? (
              <>
                <Stat label="Orders" value={sales.row.orders.toLocaleString()} hint={`${sales.row.sessions.toLocaleString()} visits`} />
                <Stat label="Sales" value={formatMoney(sales.row.sales, sales.currency)} />
              </>
            ) : (
              <div className="col-span-2 sm:col-span-2 bg-cream rounded-lg px-3 py-2.5 text-[11.5px] text-slate">
                {sales ? 'No visits from this email have been recorded yet.' : 'Loading sales…'}
              </div>
            )}
          </div>

          <div>
            <p className="text-[13px] font-semibold text-carbon mb-1.5">Top links</p>
            {report.topLinks.length === 0 ? (
              <p className="text-[12px] text-slate">No link clicks yet.</p>
            ) : (
              <div className="border border-bone rounded-lg divide-y divide-bone">
                {report.topLinks.map(l => (
                  <div key={l.url} className="flex items-center justify-between gap-3 px-3 py-2">
                    <span className="text-[12px] text-charcoal truncate" title={l.url}>{l.url}</span>
                    <span className="text-[12px] font-semibold text-carbon shrink-0">{l.clicks.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate leading-snug">
            Opens are approximate: some mail apps load images automatically or block them. Links to your store carry <code>utm_campaign={report.utmCampaign}</code>, so the visits and sales they bring in show up here and under Growth.
            Unsubscribes and spam complaints per email are not reported yet.
          </p>
        </div>
      )}
    </Modal>
  );
}
