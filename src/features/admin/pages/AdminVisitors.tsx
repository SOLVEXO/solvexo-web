import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Clock, Eye, Globe2, MousePointerClick, Radio, Settings2, UserPlus, Users } from 'lucide-react';
import { Button, MetricCard, Toggle } from '@/components/comman/ui';
import { AdminPageHeader } from '@/components/comman/ui/AdminPageHeader';
import { AreaChart } from '@/components/comman/charts';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { ChartCardSkeleton, TableCardSkeleton } from '@/components/comman/analytics/AnalyticsSkeletons';
import { usePageTitle } from '@/hooks/usePageTitle';
import { can } from '@/hooks/auth/useCan';
import { useStableToast } from './sales/sales.utils';
import { whatsappHref } from '@/utils/whatsapp';
import { Card, Empty } from './saas/parts';
import {
  apiSaveSiteSettings, apiSiteAcquisition, apiSiteContent, apiSiteFunnel, apiSiteOverview, apiSiteRealtime, apiSiteSettings,
  apiSiteSetupSteps, apiStoreJourney, type StoreJourney,
  type SiteAcquisition, type SiteAnalyticsSettings, type SiteContent, type SiteFunnel, type SiteOverview, type SiteRange,
  type SiteRealtime, type TotalMetric,
} from '@/api/services/siteAnalytics';

const RANGES: { id: SiteRange; label: string }[] = [
  { id: '7d', label: '7 days' }, { id: '28d', label: '28 days' }, { id: '90d', label: '90 days' }, { id: '365d', label: '12 months' },
];
const fmt = (n: number) => n.toLocaleString('en-US');
const pct = (n: number | null | undefined, digits = 1) => (n === null || n === undefined ? '—' : `${n.toLocaleString('en-US', { maximumFractionDigits: digits })}%`);
const duration = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${Math.round(s % 60)}s` : `${Math.round(s)}s`);
const errorText = (e: unknown) => (e instanceof Error ? e.message : 'Could not load this report.');

/** Loads one report for `key` (the selected range); each section loads and fails on its own. */
function useReport<T>(key: string, load: () => Promise<{ data: T }>) {
  const [state, setState] = useState<{ key: string | null; data: T | null; error: string | null }>({ key: null, data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  const loadRef = useRef(load);
  useEffect(() => { loadRef.current = load; });
  useEffect(() => {
    let cancelled = false;
    loadRef.current()
      .then(res => { if (!cancelled) setState({ key, data: res.data, error: null }); })
      .catch(e => { if (!cancelled) setState({ key, data: null, error: errorText(e) }); });
    return () => { cancelled = true; };
  }, [key, attempt]);
  const loading = state.key !== key || (attempt > 0 && !state.data && !state.error);
  return { data: state.data, error: state.key === key ? state.error : null, loading, reload: () => { setState(s => ({ ...s, error: null, key: null })); setAttempt(a => a + 1); } };
}

/** Super Admin → Website Visitors: Solvexo's own public site and sign-up traffic, from Google Analytics 4. */
export function AdminVisitors() {
  usePageTitle('Website Visitors');
  const [settings, setSettings] = useState<SiteAnalyticsSettings | null>(null);
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [range, setRange] = useState<SiteRange>('28d');
  const [showSettings, setShowSettings] = useState(false);

  // `check` makes one small live request to Google so a wrong key, property or permission shows here straight away.
  const loadSettings = useCallback(() => {
    apiSiteSettings(true).then(res => { setSettings(res.data); setSettingsError(null); }).catch(e => setSettingsError(errorText(e)));
  }, []);
  useEffect(() => { loadSettings(); }, [loadSettings]);

  const connected = !!settings?.ga4.connected;
  const tracking = !!settings?.measurementId && settings.enabled;

  return (
    <>
      <AdminPageHeader
        title="Website Visitors"
        subtitle="Who visits Solvexo's public site and sign-up, where they come from, and how many become stores. From Google Analytics."
        icon={<MousePointerClick size={18} />}
      />
      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-5">
        {settingsError && <AnalyticsErrorState message={settingsError} onRetry={loadSettings} />}
        {settings && (
          <StatusBar
            settings={settings}
            onOpenSettings={() => setShowSettings(v => !v)}
            canEdit={can('config.manage')}
          />
        )}
        {settings && (showSettings || !tracking) && can('config.manage') && (
          <SettingsCard settings={settings} onSaved={s => { setSettings(s); setShowSettings(false); }} />
        )}
        {settings && <ProblemsCard settings={settings} onRetry={loadSettings} />}
        {settings && !settings.ga4.source && <ConnectCard />}
        {settings && connected && (
          <>
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div role="radiogroup" aria-label="Date range" className="inline-flex rounded-[10px] border border-bone bg-white p-0.5">
                {RANGES.map(r => (
                  <button
                    key={r.id}
                    type="button"
                    role="radio"
                    aria-checked={range === r.id}
                    onClick={() => setRange(r.id)}
                    className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium cursor-pointer ${range === r.id ? 'bg-brand-orange text-white' : 'text-graphite hover:bg-mist'}`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              <p className="text-[11.5px] text-slate">Compared with the {RANGES.find(r => r.id === range)!.label.toLowerCase()} before. Reports refresh every 10 minutes.</p>
            </div>
            <Realtime />
            <Overview range={range} />
            <Funnel range={range} />
            <SetupSteps range={range} />
            <StoreJourneyCard range={range} />
            <Acquisition range={range} />
            <Content range={range} />
          </>
        )}
      </div>
    </>
  );
}

function StatusBar({ settings, onOpenSettings, canEdit }: { settings: SiteAnalyticsSettings; onOpenSettings: () => void; canEdit: boolean }) {
  const tracking = !!settings.measurementId && settings.enabled;
  const fromEnv = settings.measurementIdSource?.startsWith('env:') ? settings.measurementIdSource.slice(4) : null;
  const g = settings.ga4;
  const chip = (ok: boolean, text: string) => (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-medium ${ok ? 'bg-success-bg text-success' : 'bg-warning-bg text-warning'}`}>
      {ok ? <CheckCircle2 size={12} /> : <Activity size={12} />}{text}
    </span>
  );
  const reportsText = g.connected
    ? `Reports from ${g.propertyId ?? 'Google Analytics'}${g.source === 'service_account' && g.serviceAccountEmail ? ` via ${g.serviceAccountEmail}` : ''}`
    : g.ok === false ? 'Reports failing (see below)'
      : g.status === 'needs_reauth' ? 'Google Analytics needs reconnecting' : 'Reports not connected';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {chip(tracking, tracking ? `Tracking on (${settings.measurementId}${fromEnv ? `, from ${fromEnv}` : ''})` : settings.measurementId ? 'Tracking paused' : 'Tracking not set up')}
      {chip(g.connected, reportsText)}
      {canEdit && (
        <Button variant="ghost" size="sm" onClick={onOpenSettings} className="ml-auto">
          <Settings2 size={14} /> Settings
        </Button>
      )}
    </div>
  );
}

/** What Google or the server environment said is wrong, in plain words, with a re-check button. */
function ProblemsCard({ settings, onRetry }: { settings: SiteAnalyticsSettings; onRetry: () => void }) {
  const items = [...settings.env.problems, ...(settings.ga4.ok === false && settings.ga4.lastError ? [settings.ga4.lastError] : [])];
  if (!items.length) return null;
  return (
    <section role="alert" className="bg-error-bg border border-error/30 rounded-[10px] px-5 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h2 className="text-[14px] font-bold text-error">Google Analytics isn't working yet</h2>
          <ul className="mt-1.5 list-disc pl-5 text-[12.5px] text-charcoal space-y-1">
            {items.map((t, i) => <li key={i} className="break-words">{t}</li>)}
          </ul>
        </div>
        <Button variant="ghost" size="sm" onClick={onRetry}>Check again</Button>
      </div>
    </section>
  );
}

function SettingsCard({ settings, onSaved }: { settings: SiteAnalyticsSettings; onSaved: (s: SiteAnalyticsSettings) => void }) {
  const toast = useStableToast();
  const savedHere = settings.measurementIdSource === 'settings';
  const envVariable = settings.measurementIdSource?.startsWith('env:') ? settings.measurementIdSource.slice(4) : null;
  const [measurementId, setMeasurementId] = useState(savedHere ? settings.measurementId ?? '' : '');
  const [enabled, setEnabled] = useState(settings.enabled);
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      const res = await apiSaveSiteSettings({ measurementId: measurementId.trim(), enabled });
      toast.success('Website analytics saved');
      onSaved(res.data);
    } catch (e) {
      toast.error(errorText(e));
    } finally {
      setSaving(false);
    }
  };
  return (
    <Card
      title="Tracking"
      subtitle="Google Analytics runs only on Solvexo's public pages and sign-up. Merchant stores, seller dashboards and this admin panel are never tracked. Visitors from the EU and UK are asked for consent first."
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_auto] items-end">
        <div>
          <label htmlFor="ga-measurement-id" className="block text-[12px] font-medium text-charcoal mb-1.5">Measurement ID</label>
          <input
            id="ga-measurement-id"
            value={measurementId}
            onChange={e => setMeasurementId(e.target.value.toUpperCase())}
            placeholder={envVariable ? settings.measurementId ?? 'G-XXXXXXXXXX' : 'G-XXXXXXXXXX'}
            className="w-full px-3 py-2 rounded-[10px] border border-bone bg-white text-[13px] outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/15"
          />
          <p className="mt-1.5 text-[11.5px] text-slate">
            {envVariable
              ? <>Using <strong>{settings.measurementId}</strong> from <code>{envVariable}</code> on the API server. An ID saved here takes priority.</>
              : 'Google Analytics → Admin → Data streams → your website stream.'}
            {settings.detectedMeasurementId && !measurementId && (
              <>
                {' '}Found on your connected property:{' '}
                <button type="button" onClick={() => setMeasurementId(settings.detectedMeasurementId!)} className="text-brand-orange font-semibold underline cursor-pointer">
                  use {settings.detectedMeasurementId}
                </button>
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12.5px] text-charcoal">
            <Toggle checked={enabled} onChange={setEnabled} ariaLabel="Tracking on" /> Tracking on
          </div>
          <Button variant="primary" size="sm" loading={saving} onClick={save}>Save</Button>
        </div>
      </div>
    </Card>
  );
}

function ConnectCard() {
  return (
    <Card title="Connect Google Analytics to see reports" subtitle="Reports are read from Google Analytics with read-only access. Use either option.">
      <p className="text-[12.5px] font-semibold text-charcoal">Option A: a service account (server variables)</p>
      <ol className="list-decimal pl-5 mt-1 text-[12.5px] text-graphite space-y-1.5">
        <li>In Google Cloud Console, enable the <strong>Google Analytics Data API</strong> and <strong>Google Analytics Admin API</strong>, create a service account and download its JSON key.</li>
        <li>In Google Analytics → Admin → <strong>Property access management</strong>, add the service account's email (…@….iam.gserviceaccount.com) as <strong>Viewer</strong>.</li>
        <li>On the API server, set <code>GA4_SERVICE_ACCOUNT_JSON</code> to the whole key (or base64 of it) and <code>GA4_PROPERTY_ID</code> to the property number (Admin → Property settings), then restart the API.</li>
      </ol>
      <p className="mt-3 text-[12.5px] font-semibold text-charcoal">Option B: sign in with Google</p>
      <p className="mt-1 text-[12.5px] text-graphite">
        Open <Link to="/admin/seo" className="text-brand-orange font-semibold underline">SEO</Link> → <strong>Integrations</strong> → Google Analytics, sign in with the Google account that owns the property and enter the property ID.
      </p>
    </Card>
  );
}

function trendProps(m: TotalMetric | undefined) {
  if (!m || m.change === null) return {};
  return { trend: `${m.change > 0 ? '+' : ''}${pct(m.change)}`, trendUp: m.change >= 0 };
}

function Overview({ range }: { range: SiteRange }) {
  const r = useReport<SiteOverview>(range, () => apiSiteOverview(range));
  const [metric, setMetric] = useState<'users' | 'sessions' | 'pageViews'>('users');
  if (r.error) return <AnalyticsErrorState message={r.error} onRetry={r.reload} />;
  const t = r.data?.totals;
  const series = r.data?.series ?? [];
  const label = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return (
    <>
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Visitors" value={t ? fmt(t.users.value) : '—'} icon={<Users size={16} />} loading={r.loading && !t} sparkline={series.map(s => s.users)} {...trendProps(t?.users)} />
        <MetricCard label="New visitors" value={t ? fmt(t.newUsers.value) : '—'} icon={<UserPlus size={16} />} loading={r.loading && !t} {...trendProps(t?.newUsers)} />
        <MetricCard label="Sessions" value={t ? fmt(t.sessions.value) : '—'} icon={<Activity size={16} />} loading={r.loading && !t} sparkline={series.map(s => s.sessions)} {...trendProps(t?.sessions)} />
        <MetricCard label="Page views" value={t ? fmt(t.pageViews.value) : '—'} icon={<Eye size={16} />} loading={r.loading && !t} sparkline={series.map(s => s.pageViews)} {...trendProps(t?.pageViews)} />
        <MetricCard label="Avg. visit" value={t ? duration(t.avgSessionSeconds.value) : '—'} icon={<Clock size={16} />} loading={r.loading && !t} {...trendProps(t?.avgSessionSeconds)} />
        <MetricCard label="Engaged visits" value={t ? pct(t.engagementRate.value * 100) : '—'} icon={<MousePointerClick size={16} />} loading={r.loading && !t} sub="Over 10s, 2+ pages or a key event" {...trendProps(t?.engagementRate)} />
      </div>
      {r.loading && !r.data ? <ChartCardSkeleton height={260} /> : (
        <AreaChart
          title="Visitors over time"
          subtitle="Per day"
          data={series.map(s => ({ ...s, label: label(s.date) }))}
          dataKey={metric}
          height={260}
          loading={r.loading}
          emptyValueLabel="No visits recorded in this period yet"
          action={(
            <select aria-label="Chart metric" value={metric} onChange={e => setMetric(e.target.value as typeof metric)} className="px-2.5 py-1.5 rounded-[8px] border border-bone bg-white text-[12px] cursor-pointer">
              <option value="users">Visitors</option>
              <option value="sessions">Sessions</option>
              <option value="pageViews">Page views</option>
            </select>
          )}
        />
      )}
    </>
  );
}

/** A labelled horizontal bar list: value bars scaled to the largest row. */
function BarList({ rows, empty }: { rows: { label: ReactNode; value: number; note?: string }[]; empty: string }) {
  if (!rows.length) return <Empty text={empty} />;
  const max = Math.max(...rows.map(r => r.value), 1);
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map((r, i) => (
        <li key={i} className="relative rounded-[8px] overflow-hidden">
          <div className="absolute inset-y-0 left-0 bg-brand-orange/10" style={{ width: `${(r.value / max) * 100}%` }} aria-hidden />
          <div className="relative flex items-center justify-between gap-3 px-2.5 py-1.5 text-[12.5px]">
            <span className="text-charcoal truncate min-w-0">{r.label}</span>
            <span className="shrink-0 text-graphite tabular-nums">{fmt(r.value)}{r.note && <span className="text-slate"> · {r.note}</span>}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function Acquisition({ range }: { range: SiteRange }) {
  const r = useReport<SiteAcquisition>(range, () => apiSiteAcquisition(range));
  if (r.error) return <AnalyticsErrorState message={r.error} onRetry={r.reload} />;
  if (!r.data) return <TableCardSkeleton rows={6} />;
  const d = r.data;
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Traffic sources" subtitle="Sessions by channel">
        <BarList rows={d.channels.map(c => ({ label: c.channel, value: c.sessions, note: `${pct(c.engagementRate * 100, 0)} engaged` }))} empty="No sessions yet." />
      </Card>
      <Card title="Source / medium" subtitle="Sessions from each referrer">
        <BarList rows={d.sources.map(s => ({ label: `${s.source} / ${s.medium}`, value: s.sessions }))} empty="No sessions yet." />
      </Card>
      {d.campaigns.length > 0 && (
        <Card title="Campaigns" subtitle="Sessions from links tagged with utm_campaign">
          <BarList rows={d.campaigns.map(c => ({ label: c.campaign, value: c.sessions }))} empty="" />
        </Card>
      )}
    </div>
  );
}

function Content({ range }: { range: SiteRange }) {
  const r = useReport<SiteContent>(range, () => apiSiteContent(range));
  if (r.error) return <AnalyticsErrorState message={r.error} onRetry={r.reload} />;
  if (!r.data) return <TableCardSkeleton rows={6} />;
  const d = r.data;
  const deviceTotal = d.devices.reduce((s, x) => s + x.users, 0);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card title="Top pages" subtitle="Page views">
        <BarList rows={d.pages.map(p => ({ label: <code className="text-[12px]">{p.path}</code>, value: p.views, note: `${fmt(p.users)} visitors` }))} empty="No page views yet." />
      </Card>
      <Card title="Landing pages" subtitle="Where visits start">
        <BarList rows={d.landingPages.map(p => ({ label: <code className="text-[12px]">{p.path}</code>, value: p.sessions, note: `${pct(p.engagementRate * 100, 0)} engaged` }))} empty="No sessions yet." />
      </Card>
      <Card title="Countries" subtitle="Visitors">
        <BarList rows={d.countries.map(c => ({ label: c.country, value: c.users }))} empty="No visitors yet." />
      </Card>
      <Card title="Cities" subtitle="Visitors">
        <BarList rows={d.cities.map(c => ({ label: `${c.city}, ${c.country}`, value: c.users }))} empty="No visitors yet." />
      </Card>
      <Card title="Devices" subtitle="Share of visitors">
        {d.devices.length === 0 ? <Empty text="No visitors yet." /> : (
          <div className="flex flex-col gap-2">
            <div className="flex h-3 rounded-full overflow-hidden bg-mist" aria-hidden>
              {d.devices.map((x, i) => <div key={x.device} style={{ width: `${(x.users / deviceTotal) * 100}%`, background: ['#d97757', '#2a78d6', '#1baf7a', '#6250d6'][i % 4] }} />)}
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-1 text-[12.5px]">
              {d.devices.map((x, i) => (
                <li key={x.device} className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full" style={{ background: ['#d97757', '#2a78d6', '#1baf7a', '#6250d6'][i % 4] }} aria-hidden />
                  <span className="capitalize text-charcoal">{x.device}</span>
                  <span className="text-slate">{pct((x.users / deviceTotal) * 100, 0)} · {fmt(x.users)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
}

/** One bar per step, as a share of the first step. */
function StepBars({ steps, unit }: { steps: { key: string; label: string; count: number; fromPrevious: number | null }[]; unit?: string }) {
  const first = steps[0]?.count || 1;
  return (
    <ol className="flex flex-col gap-2">
      {steps.map((s, i) => (
        <li key={s.key} className="grid grid-cols-[minmax(0,180px)_1fr_auto] items-center gap-3 text-[12.5px]">
          <span className="text-charcoal">{i + 1}. {s.label}</span>
          <div className="h-6 rounded-[6px] bg-mist overflow-hidden" aria-hidden>
            <div className="h-full bg-brand-orange rounded-[6px]" style={{ width: `${Math.max((s.count / first) * 100, s.count ? 1.5 : 0)}%` }} />
          </div>
          <span className="tabular-nums text-graphite text-right min-w-[110px]">
            <strong className="text-charcoal">{fmt(s.count)}</strong>{unit && i === 0 ? <span className="text-slate"> {unit}</span> : null}
            {s.fromPrevious !== null && <span className="text-slate"> · {pct(s.fromPrevious)} of previous</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

function Funnel({ range }: { range: SiteRange }) {
  const r = useReport<SiteFunnel>(range, () => apiSiteFunnel(range));
  if (r.error) return <AnalyticsErrorState message={r.error} onRetry={r.reload} />;
  if (!r.data) return <TableCardSkeleton rows={5} />;
  return (
    <Card title="Sign-up funnel" subtitle="Visitors who reached each step in this period (each step counted on its own, so a later step can include people who skipped an earlier one)">
      <StepBars steps={r.data.steps.map(s => ({ key: s.key, label: s.label, count: s.users, fromPrevious: s.fromPrevious }))} />
    </Card>
  );
}

function SetupSteps({ range }: { range: SiteRange }) {
  const r = useReport<SiteFunnel>(range, () => apiSiteSetupSteps(range));
  if (r.error) return <AnalyticsErrorState message={r.error} onRetry={r.reload} />;
  if (!r.data) return <TableCardSkeleton rows={5} />;
  return (
    <Card title="Store setup steps" subtitle="Visitors who opened each step of the store setup wizard. The biggest drop shows the step to simplify.">
      <StepBars steps={r.data.steps.map(s => ({ key: s.key, label: s.label, count: s.users, fromPrevious: s.fromPrevious }))} />
    </Card>
  );
}

const shortDate = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

function StoreJourneyCard({ range }: { range: SiteRange }) {
  const r = useReport<StoreJourney>(range, () => apiStoreJourney(range));
  if (r.error) return <AnalyticsErrorState message={r.error} onRetry={r.reload} />;
  if (!r.data) return <TableCardSkeleton rows={6} />;
  const { steps, followUp, followUpTotal } = r.data;
  return (
    <Card title="From new store to live store" subtitle="Stores created in this period and how far they got. From Solvexo's own data, so it includes every store, not only visitors Google Analytics saw.">
      <StepBars steps={steps.map(s => ({ key: s.key, label: s.label, count: s.stores, fromPrevious: s.fromPrevious }))} unit="stores" />
      <div className="mt-5">
        <p className="text-[12.5px] font-semibold text-charcoal">Help these stores add their first product</p>
        <p className="text-[11.5px] text-slate mt-0.5">
          {followUpTotal === 0 ? 'Every new store in this period has added a product.' : `${fmt(followUpTotal)} new store${followUpTotal === 1 ? ' has' : 's have'} no products yet${followUpTotal > followUp.length ? ` (showing the newest ${followUp.length})` : ''}. A quick WhatsApp or call usually gets them going.`}
        </p>
        {followUp.length > 0 && (
          <div className="mt-2 overflow-x-auto">
            <table className="w-full text-[12.5px] min-w-[620px]">
              <thead>
                <tr className="text-left text-slate border-b border-bone">
                  <th className="py-2 pr-3 font-medium">Store</th>
                  <th className="py-2 pr-3 font-medium">Owner</th>
                  <th className="py-2 pr-3 font-medium">Contact</th>
                  <th className="py-2 pr-3 font-medium">Created</th>
                  <th className="py-2 font-medium">Plan</th>
                </tr>
              </thead>
              <tbody>
                {followUp.map(s => {
                  const wa = whatsappHref(s.phone);
                  return (
                    <tr key={s.storeId} className="border-b border-bone/70 align-top">
                      <td className="py-2 pr-3 text-charcoal">{s.storeUrl ? <a href={s.storeUrl} target="_blank" rel="noreferrer" className="hover:text-brand-orange">{s.storeName || 'Untitled store'}</a> : (s.storeName || 'Untitled store')}</td>
                      <td className="py-2 pr-3 text-charcoal">{s.ownerName || '—'}</td>
                      <td className="py-2 pr-3">
                        <div className="flex flex-col">
                          {s.phone && (wa ? <a href={wa} target="_blank" rel="noreferrer" className="text-brand-orange hover:underline">{s.phone}</a> : <span>{s.phone}</span>)}
                          {s.email && <a href={`mailto:${s.email}`} className="text-graphite hover:underline">{s.email}</a>}
                          {!s.phone && !s.email && <span className="text-slate">—</span>}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-graphite tabular-nums">{shortDate(s.createdAt)}</td>
                      <td className="py-2 text-graphite">{s.planChosen ? 'Chosen' : 'Trial'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

function Realtime() {
  const [data, setData] = useState<SiteRealtime | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const load = () => apiSiteRealtime()
      .then(res => { if (!cancelled) { setData(res.data); setError(null); } })
      .catch(e => { if (!cancelled) setError(errorText(e)); });
    load();
    const t = setInterval(load, 60_000);
    return () => { cancelled = true; clearInterval(t); };
  }, []);
  if (error) return <AnalyticsErrorState message={error} />;
  return (
    <section className="bg-white border border-bone rounded-[10px] px-5 py-4 grid gap-4 md:grid-cols-[200px_1fr_1fr]">
      <div>
        <p className="flex items-center gap-1.5 text-[12px] font-semibold text-success"><Radio size={13} className="animate-pulse" /> Right now</p>
        <p className="text-[34px] font-bold text-charcoal leading-tight tabular-nums" aria-label="Visitors right now">{data ? fmt(data.activeUsers) : '—'}</p>
        <p className="text-[11.5px] text-slate">visitors in the last 30 minutes</p>
      </div>
      <div>
        <p className="text-[12px] font-semibold text-charcoal mb-1.5">Pages</p>
        <BarList rows={(data?.pages ?? []).slice(0, 5).map(p => ({ label: p.title, value: p.users }))} empty="Nobody on the site right now." />
      </div>
      <div>
        <p className="text-[12px] font-semibold text-charcoal mb-1.5 flex items-center gap-1"><Globe2 size={12} /> Countries</p>
        <BarList rows={(data?.countries ?? []).slice(0, 5).map(c => ({ label: c.country, value: c.users }))} empty="—" />
      </div>
    </section>
  );
}
