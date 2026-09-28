import { useEffect, useState, type ReactNode } from 'react';
import { Gift, PackageCheck, TrendingDown, HeartHandshake, MailCheck, Palette, Send, type LucideIcon } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { EmailCampaignEditor } from './EmailCampaignEditor';
import { AUTOMATION_MERGE_TAGS, automationStarterDesign } from './automationDesigns';
import { isEmailDesign } from './emailDesign';
import { SkeletonBox, Button, PlanFeatureLock } from '@/components/comman/ui';
import {
  apiGetAutomationSettings, apiUpdateAutomationSettings, apiGetAutomationStats, apiSendAutomationTest,
  type MarketingAutomationSettings, type MarketingAutomationStats, type AutomationType,
} from '@/api/services/marketingAutomations';

const INPUT_CLS = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none text-charcoal bg-white box-border transition-shadow duration-150 focus:ring-2 focus:ring-brand-orange/40 focus:border-brand-orange/50';

type Section = Exclude<keyof MarketingAutomationSettings, 'doubleOptIn'>;

const META: Record<Section, { type: AutomationType; title: string; Icon: LucideIcon; description: string; tags: string[]; marketing: boolean }> = {
  welcome: {
    type: 'welcome', title: 'Welcome email', Icon: Gift, marketing: false,
    description: 'Sent right after someone subscribes from your storefront footer or Newsletter section. Checkout sign-ups get no extra email.',
    tags: ['{{customerName}}', '{{storeName}}'],
  },
  backInStock: {
    type: 'back_in_stock', title: 'Back in stock', Icon: PackageCheck, marketing: false,
    description: 'Shoppers tap "Notify me" on a sold-out product; they get one email as soon as it can be bought again. Checked every 10 minutes.',
    tags: ['{{customerName}}', '{{storeName}}', '{{productName}}'],
  },
  priceDrop: {
    type: 'price_drop', title: 'Price drop', Icon: TrendingDown, marketing: true,
    description: "Emails subscribed customers when an item on their wishlist gets cheaper by at least the percentage you set. Checked hourly.",
    tags: ['{{customerName}}', '{{storeName}}', '{{productName}}', '{{oldPrice}}', '{{newPrice}}'],
  },
  winBack: {
    type: 'win_back', title: 'Win-back', Icon: HeartHandshake, marketing: true,
    description: "Emails subscribed customers who haven't ordered in a while — once per lapse, so nobody is emailed repeatedly. Checked daily.",
    tags: ['{{customerName}}', '{{storeName}}'],
  },
};

const ORDER: Section[] = ['welcome', 'backInStock', 'priceDrop', 'winBack'];

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-[38px] h-[22px] rounded-full border-none cursor-pointer transition-colors duration-150 shrink-0 ${checked ? 'bg-brand-orange' : 'bg-bone'}`}
    >
      <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-[left] duration-150 ${checked ? 'left-[19px]' : 'left-[3px]'}`} />
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-charcoal mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-slate mt-1">{hint}</p>}
    </div>
  );
}

function AutomationCard<S extends Section>({
  storeId, section, initial, stats, marketingLocked, onSaved,
}: {
  storeId: string;
  section: S;
  initial: MarketingAutomationSettings[S];
  stats: MarketingAutomationStats | null;
  marketingLocked: boolean;
  onSaved: (next: MarketingAutomationSettings) => void;
}) {
  const meta = META[section];
  const { store } = useStoreWorkspace();
  const [draft, setDraft] = useState(initial);
  const [editorOpen, setEditorOpen] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  // A save returns fresh settings — take them as the new baseline (adjusted
  // during render rather than in an effect, per React's guidance).
  const [baseline, setBaseline] = useState(initial);
  if (baseline !== initial) {
    setBaseline(initial);
    setDraft(initial);
  }

  const set = <K extends keyof MarketingAutomationSettings[S]>(key: K, value: MarketingAutomationSettings[S][K]) =>
    setDraft(d => ({ ...d, [key]: value }));

  // Throws on failure — the design editor shows its own error.
  async function persist(patch: MarketingAutomationSettings[S]) {
    const res = await apiUpdateAutomationSettings(storeId, { [section]: patch } as Partial<MarketingAutomationSettings>);
    onSaved(res.data);
  }

  async function save(patch = draft) {
    setSaving(true);
    setMessage(null);
    try {
      await persist(patch);
      setMessage({ ok: true, text: 'Saved' });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  }

  async function sendTest(email?: string) {
    const res = await apiSendAutomationTest(storeId, section, email);
    return res.message || 'Test email sent';
  }

  async function quickTest() {
    setTesting(true);
    setMessage(null);
    try {
      setMessage({ ok: true, text: await sendTest() });
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : 'Failed to send test.' });
    } finally {
      setTesting(false);
    }
  }

  const d = draft as Record<string, unknown>;
  const designed = isEmailDesign(d.design);
  const sent30 = stats?.last30Days[meta.type] ?? 0;
  const sentAll = stats?.allTime[meta.type] ?? 0;

  return (
    <div className="bg-white border border-bone rounded-[10px] px-5 py-4 flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 rounded-lg bg-brand-pale-orange text-brand-deep-orange flex items-center justify-center shrink-0">
          <meta.Icon size={17} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[14px] font-bold text-carbon">{meta.title}</p>
            <span className={`px-2 py-[2px] rounded-full text-[10.5px] font-semibold ${d.enabled ? 'bg-success-bg text-success' : 'bg-mist text-slate'}`}>
              {d.enabled ? 'On' : 'Off'}
            </span>
          </div>
          <p className="text-[12px] text-slate mt-0.5">{meta.description}</p>
          <p className="text-[11px] text-slate mt-1">
            Sent: <span className="font-semibold text-charcoal">{sent30.toLocaleString()}</span> in the last 30 days · {sentAll.toLocaleString()} all time
          </p>
        </div>
        <Toggle
          checked={!!d.enabled}
          label={`Turn ${meta.title} ${d.enabled ? 'off' : 'on'}`}
          onChange={v => { const next = { ...draft, enabled: v }; setDraft(next); save(next); }}
        />
      </div>

      {meta.marketing && marketingLocked && (
        <p className="text-[11.5px] text-warning bg-warning-bg rounded-md px-3 py-2">
          Your current plan doesn't include Email Campaigns, so this automation won't send until you upgrade.
        </p>
      )}

      {section === 'backInStock' && stats && (
        <div className="rounded-lg border border-bone bg-[#faf9f6] px-3 py-2.5">
          <p className="text-[12px] text-charcoal"><span className="font-semibold">{stats.pendingBackInStock.toLocaleString()}</span> shopper request(s) waiting for a restock</p>
          {stats.topBackInStockProducts.length > 0 && (
            <ul className="mt-1.5 flex flex-col gap-0.5">
              {stats.topBackInStockProducts.map(p => (
                <li key={p.productId} className="text-[11.5px] text-slate flex justify-between gap-3">
                  <span className="truncate">{p.name}</span><span className="shrink-0">{p.requests} waiting</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        {section === 'priceDrop' && (
          <Field label="Minimum price drop (%)" hint="1–90. Smaller cuts add up until they reach this.">
            <input type="number" min={1} max={90} value={String(d.minDropPercent ?? '')} className={`${INPUT_CLS} max-w-[140px]`}
              onChange={e => set('minDropPercent' as never, Number(e.target.value) as never)} />
          </Field>
        )}
        {section === 'winBack' && (
          <Field label="Send after no order for (days)" hint="14–365.">
            <input type="number" min={14} max={365} value={String(d.afterDays ?? '')} className={`${INPUT_CLS} max-w-[140px]`}
              onChange={e => set('afterDays' as never, Number(e.target.value) as never)} />
          </Field>
        )}
        <Field label="Subject">
          <input value={String(d.subject ?? '')} maxLength={200} className={INPUT_CLS} onChange={e => set('subject' as never, e.target.value as never)} />
        </Field>
        {designed ? (
          <div className="rounded-lg border border-brand-orange/30 bg-brand-pale-orange/40 px-3 py-2.5 flex flex-wrap items-center gap-2">
            <Palette size={15} className="text-brand-deep-orange" />
            <p className="text-[12px] text-charcoal flex-1 min-w-[160px]">This email uses a custom design.</p>
            <Button size="xs" variant="outline" onClick={() => setEditorOpen(true)}>Edit design</Button>
            <Button size="xs" variant="ghost" onClick={() => {
              if (!window.confirm('Switch back to the simple text email? Your design will be removed.')) return;
              const next = { ...draft, design: null, html: null } as MarketingAutomationSettings[S];
              setDraft(next); save(next);
            }}>Use simple text</Button>
          </div>
        ) : (
          <Field label="Message" hint={`Plain text — blank line = new paragraph. Merge tags: ${meta.tags.join(' ')}`}>
            <textarea value={String(d.message ?? '')} rows={5} className={`${INPUT_CLS} resize-y`} onChange={e => set('message' as never, e.target.value as never)} />
          </Field>
        )}
        {(section === 'welcome' || section === 'winBack') && (
          <Field label="Discount code (optional)" hint="Must be an existing coupon code from the Coupons tab. Shown as a highlighted code in the email.">
            <input value={String(d.discountCode ?? '')} placeholder="WELCOME10" className={`${INPUT_CLS} max-w-[220px] uppercase`}
              onChange={e => set('discountCode' as never, (e.target.value.trim() ? e.target.value.toUpperCase() : null) as never)} />
          </Field>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        {message && <p className={`text-[12px] mr-auto ${message.ok ? 'text-success' : 'text-error'}`}>{message.text}</p>}
        {!designed && <Button size="sm" variant="outline" icon={<Palette size={13} />} onClick={() => setEditorOpen(true)}>Design email</Button>}
        <Button size="sm" variant="outline" icon={<Send size={13} />} loading={testing} onClick={quickTest}>Send test</Button>
        <Button size="sm" variant="outline" disabled={!dirty || saving} onClick={() => setDraft(initial)}>Discard</Button>
        <Button size="sm" loading={saving} disabled={!dirty} onClick={() => save()}>Save</Button>
      </div>

      {editorOpen && (
        <EmailCampaignEditor
          storeId={storeId}
          store={store}
          campaign={null}
          onClose={() => setEditorOpen(false)}
          automation={{
            title: meta.title,
            subject: String(d.subject ?? ''),
            design: isEmailDesign(d.design)
              ? d.design
              : automationStarterDesign(section, { subject: String(d.subject ?? ''), message: String(d.message ?? ''), discountCode: (d.discountCode as string | null) ?? null }, store?.logo ?? null),
            mergeTags: AUTOMATION_MERGE_TAGS[section],
            onSave: async ({ subject, design, html }) => {
              const next = { ...draft, subject, design, html } as MarketingAutomationSettings[S];
              await persist(next);
              setDraft(next);
            },
            onSendTest: sendTest,
          }}
        />
      )}
    </div>
  );
}

/** Shopify's "Confirm email subscription" — a store-wide setting, not an email. */
function DoubleOptInCard({ storeId, value, onSaved }: { storeId: string; value: boolean; onSaved: (next: MarketingAutomationSettings) => void }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function toggle(next: boolean) {
    setSaving(true);
    setError('');
    try {
      const res = await apiUpdateAutomationSettings(storeId, { doubleOptIn: next });
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] px-5 py-4 flex items-start gap-3">
      <span className="w-9 h-9 rounded-lg bg-brand-pale-orange text-brand-deep-orange flex items-center justify-center shrink-0">
        <MailCheck size={17} />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-carbon">Double opt-in</p>
        <p className="text-[12px] text-slate mt-0.5">
          New sign-ups from your storefront and checkout get a "Confirm your subscription" email, and only become subscribers after they click it.
          Fewer fake or mistyped addresses, better deliverability. Contacts you add or import aren't affected.
        </p>
        {error && <p className="text-[12px] text-error mt-1">{error}</p>}
      </div>
      <div className={saving ? 'opacity-50 pointer-events-none' : ''}>
        <Toggle checked={value} label={`Turn double opt-in ${value ? 'off' : 'on'}`} onChange={toggle} />
      </div>
    </div>
  );
}

/** Marketing → Automations: welcome, back-in-stock, price drop, win-back. */
export function MarketingAutomations({ storeId, emailFeature }: { storeId: string; emailFeature?: { allowed: boolean; requiredPlan: string | null } }) {
  const [settings, setSettings] = useState<MarketingAutomationSettings | null>(null);
  const [stats, setStats] = useState<MarketingAutomationStats | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!storeId) return;
    let cancelled = false;
    Promise.all([apiGetAutomationSettings(storeId), apiGetAutomationStats(storeId)])
      .then(([s, st]) => { if (!cancelled) { setSettings(s.data); setStats(st.data); } })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load automations.'); });
    return () => { cancelled = true; };
  }, [storeId]);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-[15px] font-bold text-carbon">Automations</p>
        <p className="text-[12.5px] text-slate mt-0.5">
          Emails that send themselves when something happens. Price drop and win-back only go to your subscribers, and every marketing email has an unsubscribe link.
        </p>
      </div>

      {emailFeature && !emailFeature.allowed && (
        <PlanFeatureLock
          label="Price drop & win-back automations"
          description="Welcome and back-in-stock emails work on every plan. Price drop and win-back need a plan with Email Campaigns."
          requiredPlan={emailFeature.requiredPlan}
        />
      )}

      {error && <p className="text-[12px] text-error">{error}</p>}

      {!settings && !error ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 4 }).map((_, i) => <SkeletonBox key={i} height={140} rounded="10px" />)}</div>
      ) : settings && (
        <>
        <DoubleOptInCard storeId={storeId} value={settings.doubleOptIn} onSaved={setSettings} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {ORDER.map(section => (
            <AutomationCard
              key={section}
              storeId={storeId}
              section={section}
              initial={settings[section]}
              stats={stats}
              marketingLocked={!!emailFeature && !emailFeature.allowed}
              onSaved={setSettings}
            />
          ))}
        </div>
        </>
      )}
    </div>
  );
}
