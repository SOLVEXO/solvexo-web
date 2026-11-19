import { useEffect, useState } from 'react';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { Button, Field, Input, Select, SkeletonBox } from '@/components/comman/ui';
import { apiGetSignupForm, apiUpdateSignupForm, type SignupFormForSeller, type SignupFormSettings } from '@/api/services/signupForms';
import { ErrorBanner, StatCard } from './growthShared';
import { percent } from './growthFormat';

const SETTINGS_KEYS: (keyof SignupFormSettings)[] = [
  'enabled', 'heading', 'body', 'buttonLabel', 'successHeading', 'successMessage', 'discountCode',
  'showAfterPageViews', 'delaySeconds', 'exitIntent', 'teaser', 'teaserText',
];

/** Forms: the email signup popup shown on the online store (Shopify's Forms app popup). */
export function StoreSignupForm() {
  const { storeId } = useStoreWorkspace();
  const [saved, setSaved] = useState<SignupFormForSeller | null>(null);
  const [draft, setDraft] = useState<SignupFormSettings | null>(null);
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    let alive = true;
    apiGetSignupForm(storeId)
      .then(res => { if (alive) { setSaved(res.data); setDraft(res.data); setLoadError(''); } })
      .catch(e => { if (alive) setLoadError(e instanceof Error ? e.message : 'Failed to load the form.'); });
    return () => { alive = false; };
  }, [storeId, reloadKey]);

  const set = <K extends keyof SignupFormSettings>(key: K, value: SignupFormSettings[K]) => {
    setMessage(null);
    setDraft(d => (d ? { ...d, [key]: value } : d));
  };

  const dirty = !!saved && !!draft && SETTINGS_KEYS.some(k => (saved[k] ?? null) !== (draft[k] ?? null));

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload: Partial<SignupFormSettings> = {};
      for (const k of SETTINGS_KEYS) (payload as Record<string, unknown>)[k] = k === 'discountCode' ? (draft.discountCode ?? '') : draft[k];
      const res = await apiUpdateSignupForm(storeId, payload);
      setSaved(res.data);
      setDraft(res.data);
      setMessage({ ok: true, text: 'Saved.' });
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StorePageHeader title="Forms" subtitle="An email signup popup for your online store. Customers who sign up join your subscriber list." />
      <div className="px-4 lg:px-7 pt-5 pb-8 flex flex-col gap-5 max-w-[760px]">
        {loadError && <ErrorBanner message={loadError} onRetry={() => setReloadKey(k => k + 1)} />}
        {!draft && !loadError && <SkeletonBox height={420} rounded="10px" />}

        {saved && draft && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Views" value={saved.views.toLocaleString()} />
              <StatCard label="Submissions" value={saved.submissions.toLocaleString()} />
              <StatCard label="Completion rate" value={percent(saved.views > 0 ? Math.min(100, (saved.submissions / saved.views) * 100) : 0)} />
            </div>

            <div className="bg-white border border-bone rounded-[10px] px-5 py-5 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-bone mb-2">
                <div>
                  <label htmlFor="sf-enabled" className="block text-[14px] font-semibold text-carbon cursor-pointer">Show the popup on my store</label>
                  <p className="text-[12px] text-slate">It is never shown at checkout or on sign-in pages.</p>
                </div>
                <input id="sf-enabled" type="checkbox" className="accent-brand-orange w-4 h-4 cursor-pointer" checked={draft.enabled} onChange={e => set('enabled', e.target.checked)} />
              </div>

              <Field label="Heading" required><Input value={draft.heading} maxLength={120} onChange={e => set('heading', e.target.value)} /></Field>
              <Field label="Text"><Input value={draft.body} maxLength={300} onChange={e => set('body', e.target.value)} /></Field>
              <Field label="Button label" required><Input value={draft.buttonLabel} maxLength={40} onChange={e => set('buttonLabel', e.target.value)} /></Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Success heading" required><Input value={draft.successHeading} maxLength={120} onChange={e => set('successHeading', e.target.value)} /></Field>
                <Field label="Success text"><Input value={draft.successMessage} maxLength={300} onChange={e => set('successMessage', e.target.value)} /></Field>
              </div>
              <Field label="Discount code on the success step" hint="Optional. Must be an active discount code you created under Discounts.">
                <Input value={draft.discountCode ?? ''} maxLength={60} placeholder="e.g. WELCOME10" onChange={e => set('discountCode', e.target.value.toUpperCase())} />
              </Field>
            </div>

            <div className="bg-white border border-bone rounded-[10px] px-5 py-5 flex flex-col gap-1">
              <p className="text-[14px] font-semibold text-carbon mb-1">When it appears</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3">
                <Field label="Show on page view">
                  <Select value={String(draft.showAfterPageViews)} onChange={e => set('showAfterPageViews', Number(e.target.value))}>
                    <option value="1">1st page view</option>
                    <option value="2">2nd page view</option>
                    <option value="3">3rd page view</option>
                  </Select>
                </Field>
                <Field label="Delay (seconds)" hint="0 to 60">
                  <Input type="number" min={0} max={60} step={1} value={draft.delaySeconds} onChange={e => set('delaySeconds', Math.min(60, Math.max(0, Math.floor(Number(e.target.value)) || 0)))} />
                </Field>
              </div>
              <label className="flex items-center gap-2 text-[13px] text-carbon cursor-pointer mb-1" htmlFor="sf-exit">
                <input id="sf-exit" type="checkbox" className="accent-brand-orange" checked={draft.exitIntent} onChange={e => set('exitIntent', e.target.checked)} />
                Also show it when a visitor moves to leave the page (desktop only)
              </label>
              <label className="flex items-center gap-2 text-[13px] text-carbon cursor-pointer" htmlFor="sf-teaser">
                <input id="sf-teaser" type="checkbox" className="accent-brand-orange" checked={draft.teaser} onChange={e => set('teaser', e.target.checked)} />
                Leave a small tab at the bottom of the page once it is closed
              </label>
              {draft.teaser && (
                <div className="mt-2"><Field label="Tab text"><Input value={draft.teaserText} maxLength={40} onChange={e => set('teaserText', e.target.value)} /></Field></div>
              )}
              <p className="text-[11.5px] text-slate mt-2">A visitor who closes the popup, or signs up, will not be shown it again on that device.</p>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="primary" onClick={save} loading={saving} disabled={!dirty}>Save</Button>
              {message && <span className={`text-[12.5px] ${message.ok ? 'text-success' : 'text-error'}`}>{message.text}</span>}
            </div>
          </>
        )}
      </div>
    </>
  );
}
