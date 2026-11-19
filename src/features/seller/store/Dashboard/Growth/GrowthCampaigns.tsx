import { useEffect, useState } from 'react';
import { Link2, Megaphone, Pencil, Plus, Trash2, Archive, ArchiveRestore } from 'lucide-react';
import { ActionMenu, type ActionMenuItem, Badge, Button, Field, Input, Modal, Select, Table, type TableColumn } from '@/components/comman/ui';
import { formatMoney } from '@/utils/currency';
import {
  apiCreateMarketingCampaign, apiDeleteMarketingCampaign, apiGetCampaignsReport, apiUpdateMarketingCampaign,
  type AttributionRow, type CampaignChannel, type CampaignReportRow, type CampaignsReport, type GrowthRange,
} from '@/api/services/growth';
import { ErrorBanner, RangeSelect } from './growthShared';
import { percent } from './growthFormat';

const CHANNEL_LABEL: Record<CampaignChannel, string> = {
  email: 'Email', social: 'Social media', paid: 'Paid ads', search: 'Search ads', influencer: 'Influencer / affiliate', other: 'Other',
};
// What a tracking link is tagged with when the campaign does not set its own source / medium.
const LINK_DEFAULTS: Record<CampaignChannel, { source: string; medium: string }> = {
  email: { source: 'email', medium: 'email' },
  social: { source: 'social', medium: 'social' },
  paid: { source: 'ads', medium: 'cpc' },
  search: { source: 'search', medium: 'cpc' },
  influencer: { source: 'influencer', medium: 'social' },
  other: { source: 'other', medium: 'referral' },
};

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);

function CampaignFormModal({ storeId, initial, onClose, onSaved }: {
  storeId: string; initial: CampaignReportRow | null; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [channel, setChannel] = useState<CampaignChannel>(initial?.channel ?? 'social');
  const [tag, setTag] = useState(initial?.utmCampaign ?? '');
  const [tagTouched, setTagTouched] = useState(false);
  const [source, setSource] = useState(initial?.utmSource ?? '');
  const [medium, setMedium] = useState(initial?.utmMedium ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const effectiveTag = isEdit ? initial!.utmCampaign : (tagTouched ? tag : slug(name));

  const save = async () => {
    if (!name.trim()) { setError('Give the campaign a name.'); return; }
    if (!effectiveTag) { setError('The campaign tag cannot be empty.'); return; }
    setSaving(true);
    setError('');
    try {
      if (isEdit) await apiUpdateMarketingCampaign(storeId, initial!._id, { name: name.trim(), channel });
      else {
        await apiCreateMarketingCampaign(storeId, {
          name: name.trim(), channel, utmCampaign: effectiveTag,
          utmSource: source.trim() || null, utmMedium: medium.trim() || null,
        });
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save the campaign.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit campaign' : 'Create campaign'}
      onClose={onClose}
      width={520}
      footer={<><Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button><Button variant="primary" onClick={save} loading={saving}>{isEdit ? 'Save changes' : 'Create campaign'}</Button></>}
    >
      {error && <p className="mb-3 text-[12.5px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>}
      <Field label="Campaign name" required>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Eid sale" />
      </Field>
      <Field label="Main channel">
        <Select value={channel} onChange={e => setChannel(e.target.value as CampaignChannel)}>
          {(Object.keys(CHANNEL_LABEL) as CampaignChannel[]).map(c => <option key={c} value={c}>{CHANNEL_LABEL[c]}</option>)}
        </Select>
      </Field>
      <Field label="Campaign tag (utm_campaign)" hint={isEdit ? 'The tag cannot be changed after the campaign is created.' : 'Visits that carry this tag are counted for this campaign.'}>
        <Input value={isEdit ? initial!.utmCampaign : effectiveTag} disabled={isEdit} onChange={e => { setTagTouched(true); setTag(e.target.value.toLowerCase()); }} placeholder="eid-sale" />
      </Field>
      {!isEdit && (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Source (optional)" hint={`Default: ${LINK_DEFAULTS[channel].source}`}><Input value={source} onChange={e => setSource(e.target.value)} placeholder={LINK_DEFAULTS[channel].source} /></Field>
          <Field label="Medium (optional)" hint={`Default: ${LINK_DEFAULTS[channel].medium}`}><Input value={medium} onChange={e => setMedium(e.target.value)} placeholder={LINK_DEFAULTS[channel].medium} /></Field>
        </div>
      )}
    </Modal>
  );
}

/** "Get a tracking link": the store link tagged with the campaign's UTM values, ready to paste into an ad, post or bio. */
function TrackingLinkModal({ campaign, storeUrl, onClose }: { campaign: CampaignReportRow; storeUrl: string; onClose: () => void }) {
  const defaults = LINK_DEFAULTS[campaign.channel];
  const [path, setPath] = useState('/');
  const [source, setSource] = useState(campaign.utmSource ?? defaults.source);
  const [medium, setMedium] = useState(campaign.utmMedium ?? defaults.medium);
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);

  let link = '';
  try {
    const u = new URL(path.startsWith('/') ? path : `/${path}`, storeUrl);
    if (source.trim()) u.searchParams.set('utm_source', source.trim());
    if (medium.trim()) u.searchParams.set('utm_medium', medium.trim());
    u.searchParams.set('utm_campaign', campaign.utmCampaign);
    if (content.trim()) u.searchParams.set('utm_content', content.trim());
    link = u.toString();
  } catch { link = ''; }

  return (
    <Modal title={`Tracking link — ${campaign.name}`} onClose={onClose} width={520} footer={<Button variant="primary" onClick={onClose}>Done</Button>}>
      <p className="text-[12.5px] text-slate mb-3">Use this link in your ad, post or bio. Visits and sales that come through it are counted for this campaign.</p>
      <Field label="Page" hint="Where the link should land, e.g. /collections/summer"><Input value={path} onChange={e => setPath(e.target.value)} /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Source"><Input value={source} onChange={e => setSource(e.target.value)} /></Field>
        <Field label="Medium"><Input value={medium} onChange={e => setMedium(e.target.value)} /></Field>
      </div>
      <Field label="Content (optional)" hint="Tell two links in the same campaign apart, e.g. the influencer's name"><Input value={content} onChange={e => setContent(e.target.value)} /></Field>
      <div className="flex gap-2 mt-1">
        <div className="flex-1"><Input readOnly value={link} onFocus={e => e.currentTarget.select()} /></div>
        <Button variant="outline" icon={<Link2 size={14} />} disabled={!link}
          onClick={() => { navigator.clipboard?.writeText(link).then(() => setCopied(true)).catch(() => setCopied(false)); }}>
          {copied ? 'Copied' : 'Copy link'}
        </Button>
      </div>
    </Modal>
  );
}

/** Growth → Campaigns: saved campaigns with what each one brought in. */
export function GrowthCampaigns({ storeId, storeUrl }: { storeId: string; storeUrl: string | null }) {
  const [range, setRange] = useState<GrowthRange>('30d');
  const [data, setData] = useState<CampaignsReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [formFor, setFormFor] = useState<CampaignReportRow | 'new' | null>(null);
  const [linkFor, setLinkFor] = useState<CampaignReportRow | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CampaignReportRow | null>(null);
  const [busy, setBusy] = useState(false);

  const [reloadKey, setReloadKey] = useState(0);
  const load = () => { setLoading(true); setError(''); setReloadKey(k => k + 1); };

  useEffect(() => {
    let alive = true;
    apiGetCampaignsReport(storeId, range)
      .then(res => { if (alive) { setData(res.data); setLoading(false); } })
      .catch(e => { if (alive) { setError(e instanceof Error ? e.message : 'Failed to load campaigns.'); setLoading(false); } });
    return () => { alive = false; };
  }, [storeId, range, reloadKey]);

  const money = (n: number) => formatMoney(n, data?.currency);

  const setStatus = async (c: CampaignReportRow, status: 'active' | 'archived') => {
    setActionError('');
    try { await apiUpdateMarketingCampaign(storeId, c._id, { status }); load(); }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Failed to update the campaign.'); }
  };

  const remove = async () => {
    if (!confirmDelete) return;
    setBusy(true);
    setActionError('');
    try { await apiDeleteMarketingCampaign(storeId, confirmDelete._id); setConfirmDelete(null); load(); }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Failed to delete the campaign.'); }
    finally { setBusy(false); }
  };

  const saveUntracked = async (row: AttributionRow) => {
    setActionError('');
    try { await apiCreateMarketingCampaign(storeId, { name: row.key, utmCampaign: row.key, channel: 'other' }); load(); }
    catch (e) { setActionError(e instanceof Error ? e.message : 'Failed to save the campaign.'); }
  };

  const columns: TableColumn<CampaignReportRow>[] = [
    {
      key: 'name', header: 'Campaign', render: c => (
        <div className="min-w-0"><p className="font-semibold text-carbon truncate">{c.name}</p><p className="text-[11.5px] text-slate">utm_campaign={c.utmCampaign}</p></div>
      ),
    },
    { key: 'channel', header: 'Channel', render: c => <span className="text-[12.5px]">{CHANNEL_LABEL[c.channel]}</span> },
    { key: 'status', header: 'Status', render: c => <Badge color={c.status === 'active' ? 'green' : 'gray'}>{c.status === 'active' ? 'Active' : 'Archived'}</Badge> },
    { key: 'sessions', header: 'Sessions', render: c => c.sessions.toLocaleString() },
    { key: 'orders', header: 'Orders', render: c => c.orders.toLocaleString() },
    { key: 'sales', header: 'Sales', render: c => money(c.sales) },
    { key: 'cr', header: 'Conversion rate', render: c => percent(c.conversionRate) },
    {
      key: 'actions', header: '', align: 'right', render: c => {
        const items: ActionMenuItem[] = [
          ...(storeUrl ? [{ label: 'Get a tracking link', icon: <Link2 size={14} />, onClick: () => setLinkFor(c) }] : []),
          { label: 'Edit', icon: <Pencil size={14} />, onClick: () => setFormFor(c) },
          c.status === 'active'
            ? { label: 'Archive', icon: <Archive size={14} />, onClick: () => setStatus(c, 'archived') }
            : { label: 'Unarchive', icon: <ArchiveRestore size={14} />, onClick: () => setStatus(c, 'active') },
          { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setConfirmDelete(c) },
        ];
        return <ActionMenu items={items} />;
      },
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[12.5px] text-slate max-w-[560px]">
          A campaign groups one marketing effort. Visits are counted for it when they arrive through a link tagged with its campaign tag.
          Emails sent from Messaging are tagged automatically with the email campaign's name.
        </p>
        <div className="flex items-center gap-2">
          <RangeSelect value={range} onChange={v => { setLoading(true); setError(''); setRange(v); }} />
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => setFormFor('new')}>Create campaign</Button>
        </div>
      </div>

      {(error || actionError) && <ErrorBanner message={error || actionError} onRetry={error ? load : undefined} />}

      <div className="bg-white border border-bone rounded-xl overflow-hidden">
        <Table
          columns={columns}
          data={data?.campaigns ?? []}
          keyExtractor={c => c._id}
          loading={loading && !data}
          emptyState={{
            icon: <Megaphone size={26} className="text-slate/50" />,
            title: 'No campaigns yet',
            description: 'Create a campaign, then use its tracking link in your ads, posts and emails to see what each one earns.',
            action: { label: 'Create campaign', icon: <Plus size={14} />, onClick: () => setFormFor('new') },
          }}
        />
      </div>

      {data && data.untracked.length > 0 && (
        <div>
          <p className="text-[14px] font-bold text-carbon mb-1">Tags with visits but no campaign</p>
          <p className="text-[12.5px] text-slate mb-2">These utm_campaign tags brought visits to your store. Save one as a campaign to keep it organised.</p>
          <div className="bg-white border border-bone rounded-xl divide-y divide-bone">
            {data.untracked.slice(0, 10).map(r => (
              <div key={r.key} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold text-carbon truncate">{r.key}</p>
                  <p className="text-[11.5px] text-slate">{r.sessions.toLocaleString()} sessions · {r.orders.toLocaleString()} orders · {money(r.sales)}</p>
                </div>
                <Button variant="outline" onClick={() => saveUntracked(r)}>Save as campaign</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {formFor && (
        <CampaignFormModal storeId={storeId} initial={formFor === 'new' ? null : formFor} onClose={() => setFormFor(null)} onSaved={() => { setFormFor(null); load(); }} />
      )}
      {linkFor && storeUrl && <TrackingLinkModal campaign={linkFor} storeUrl={storeUrl} onClose={() => setLinkFor(null)} />}
      {confirmDelete && (
        <Modal title="Delete campaign?" onClose={() => setConfirmDelete(null)}
          footer={<><Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={busy}>Cancel</Button><Button variant="danger" onClick={remove} loading={busy}>Delete</Button></>}>
          <p className="text-[13px] text-slate">"{confirmDelete.name}" will be removed from this list. Past visits and orders are not affected; they will show under "Tags with visits but no campaign".</p>
        </Modal>
      )}
    </div>
  );
}
