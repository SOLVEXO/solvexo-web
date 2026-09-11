import { useEffect, useState, useCallback } from 'react';
import { RefreshCw, History, AlertTriangle, Globe2, Plus } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button, Input, Toggle, StatusBadge, SkeletonBox, EmptyState, Table, AdminPageHeader, type TableColumn } from '@/components/comman/ui';
import {
  apiGetPlatformConfig, apiUpdateFxConfig, apiGetAdminCurrencies, apiAddCurrency, apiEnableAllCurrencies,
  apiRetryStripeCardPaymentSupport,
  type FxConfig, type EnabledCurrency,
} from '@/api/services/config/adminConfig';
import { apiGetCurrentRates, apiGetFxHistory, apiGetFxStaleness, apiOverrideFxRate, type CurrentRatesMap, type ExchangeRateHistoryRow } from '@/api/services/exchangeRate';

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

// ── Current rate cards ────────────────────────────────────────────────────────
function RateCard({ currency, rate, staleness }: {
  currency: string;
  rate: CurrentRatesMap[string];
  staleness?: { hoursOld: number; isStale: boolean } | null;
}) {
  return (
    <div className="bg-white border border-bone rounded-[10px] px-5 py-4 flex-1 min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[13px] font-bold text-carbon">{currency}</p>
        {staleness?.isStale && <StatusBadge status="Stale" />}
        {rate?.source === 'admin' && !staleness?.isStale && <StatusBadge status="Admin Override" />}
      </div>
      {rate ? (
        <>
          <p className="text-[22px] font-bold text-charcoal leading-tight">
            {currency === 'USD' ? '1.00' : rate.ratePerUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            <span className="text-[12px] font-medium text-slate ml-1">per USD</span>
          </p>
          <p className="text-[11px] text-slate mt-1">
            Updated {formatDate(rate.effectiveFrom)} · {rate.source === 'admin' ? 'manual override' : 'auto-refreshed'}
          </p>
        </>
      ) : (
        <p className="text-[13px] text-error">No rate available</p>
      )}
    </div>
  );
}

// ── Manual override form ──────────────────────────────────────────────────────
// `currencies` is the platform's real, dynamic Markets list (see
// AdminConfigService.getEnabledCurrencies) — this used to be a single
// hardcoded <option value="PKR">, which meant an admin literally could not
// set/refresh a manual rate for any other enabled currency from this page.
function OverrideForm({ currencies, onDone }: { currencies: string[]; onDone: () => void }) {
  const [currency, setCurrency] = useState('PKR');
  const [rate, setRate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // USD excluded — it's the fixed pivot (requireCurrentRate always treats
  // it as 1 regardless of any DB row), so "overriding" it would be a no-op
  // that could only confuse an admin.
  const selectable = currencies.filter(c => c !== 'USD');

  // Keep the selection valid as the real currency list loads in (starts
  // empty on first render) or changes.
  useEffect(() => {
    if (selectable.length > 0 && !selectable.includes(currency)) {
      setCurrency(selectable.includes('PKR') ? 'PKR' : selectable[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectable.join(',')]);

  async function submit() {
    const value = Number(rate);
    if (!value || value <= 0) { setError('Enter a valid rate'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiOverrideFxRate(currency, value);
      // Defensive check — the current backend logic never actually holds an
      // admin-sourced override (the abnormal-jump hold only applies to
      // provider-sourced refreshes), but read the response instead of
      // assuming success so this doesn't silently regress if that ever changes.
      if (!res.data.applied) {
        setError('Rate was not applied — it was held for review instead of taking effect immediately.');
        setSubmitting(false);
        return;
      }
      setRate('');
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set rate — it may be outside the allowed sane band.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] px-5 py-4">
      <p className="text-[13px] font-bold text-carbon mb-1">Set Manual Rate</p>
      <p className="text-[11px] text-slate mb-3">Overrides the auto-refreshed rate immediately. Only applies to checkouts created after this change.</p>
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-[110px]">
          <label className="block text-[11px] font-medium text-charcoal mb-1">Currency</label>
          <select value={currency} onChange={e => setCurrency(e.target.value)} disabled={selectable.length === 0}
            className="w-full px-3 py-2 rounded-lg border border-bone text-[13px] bg-white outline-none cursor-pointer focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 disabled:opacity-50 disabled:cursor-not-allowed">
            {selectable.length === 0
              ? <option value="PKR">PKR</option>
              : selectable.map(code => <option key={code} value={code}>{code}</option>)}
          </select>
        </div>
        <div className="w-[160px]">
          <Input label="Rate (per 1 USD)" type="number" min="1" value={rate} onChange={e => setRate(e.target.value)} placeholder="278" />
        </div>
        <Button variant="primary" loading={submitting} onClick={submit}>Apply</Button>
      </div>
      {error && <p className="text-[12px] text-error mt-2 flex items-center gap-1"><AlertTriangle size={13} />{error}</p>}
    </div>
  );
}

// ── Add a single currency ─────────────────────────────────────────────────────
// The one-at-a-time counterpart to the "Enable All Currencies" button above —
// for an admin who wants just one more real currency live with a specific
// sanity band, rather than every currency Solvexo's metadata table knows.
function AddCurrencyForm({ existing, onDone }: { existing: string[]; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');
  const [min, setMin] = useState('');
  const [max, setMax] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    const normalized = code.trim().toUpperCase();
    const minVal = Number(min);
    const maxVal = Number(max);
    if (!/^[A-Z]{3}$/.test(normalized)) { setError('Enter a real 3-letter ISO currency code'); return; }
    if (existing.includes(normalized)) { setError(`${normalized} is already enabled`); return; }
    if (!minVal || !maxVal || maxVal <= minVal) { setError('Enter a valid band — max must be greater than min'); return; }
    setSubmitting(true);
    setError('');
    try {
      await apiAddCurrency(normalized, minVal, maxVal);
      setCode(''); setMin(''); setMax(''); setOpen(false);
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add currency.');
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mt-3 text-[12px] font-medium text-brand-orange flex items-center gap-1 hover:underline">
        <Plus size={13} /> Add a single currency with a custom band
      </button>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-bone">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-[100px]">
          <Input label="Code" value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="SEK" maxLength={3} />
        </div>
        <div className="w-[130px]">
          <Input label="Band Min (per USD)" type="number" min="0.0001" step="any" value={min} onChange={e => setMin(e.target.value)} placeholder="0.0001" />
        </div>
        <div className="w-[130px]">
          <Input label="Band Max (per USD)" type="number" min="0.0001" step="any" value={max} onChange={e => setMax(e.target.value)} placeholder="1000000" />
        </div>
        <Button variant="primary" size="sm" loading={submitting} onClick={submit}>Add</Button>
        <Button variant="outline" size="sm" onClick={() => { setOpen(false); setError(''); }}>Cancel</Button>
      </div>
      {error && <p className="text-[12px] text-error mt-2 flex items-center gap-1"><AlertTriangle size={13} />{error}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function AdminFxSettings() {
  usePageTitle('FX Settings');
  const [rates, setRates] = useState<CurrentRatesMap>({});
  const [staleness, setStaleness] = useState<Record<string, { hoursOld: number; isStale: boolean } | null>>({});
  const [fxConfig, setFxConfig] = useState<FxConfig | null>(null);
  const [history, setHistory] = useState<ExchangeRateHistoryRow[]>([]);
  const [currencies, setCurrencies] = useState<EnabledCurrency[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [enablingAll, setEnablingAll] = useState(false);
  const [enableAllMessage, setEnableAllMessage] = useState('');
  const [retryingCode, setRetryingCode] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ratesRes, staleRes, configRes, historyRes, currenciesRes] = await Promise.all([
        apiGetCurrentRates(),
        apiGetFxStaleness(),
        apiGetPlatformConfig(),
        apiGetFxHistory({ limit: 15 }),
        apiGetAdminCurrencies(),
      ]);
      setRates(ratesRes.data);
      setStaleness(staleRes.data);
      setFxConfig(configRes.data.fxConfig);
      setHistory(historyRes.data.items);
      setCurrencies(currenciesRes.data);
    } catch {
      // handled per-section below via empty states
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Enables every real ISO-4217 currency Solvexo's own metadata table knows
  // about that isn't already enabled here — the one-click counterpart to
  // adding ~120 currencies by hand (see AdminConfigService.enableAllCurrencies).
  // Newly-enabled currencies auto-refresh going forward via the daily FX
  // cron (Frankfurter + ExchangeRate-API, covering all but a rare currency
  // neither free provider prices) — no need to set a rate for each by hand.
  async function enableAllCurrencies() {
    setEnablingAll(true);
    setEnableAllMessage('');
    try {
      const res = await apiEnableAllCurrencies();
      setEnableAllMessage(
        res.data.added.length > 0
          ? `Enabled ${res.data.added.length} new currencies. They'll get a real rate on the next FX refresh.`
          : 'Every real currency was already enabled.',
      );
      await load();
    } catch (err) {
      setEnableAllMessage(err instanceof Error ? err.message : 'Failed to enable all currencies.');
    } finally {
      setEnablingAll(false);
    }
  }

  // Clears one currency's learned "Stripe rejected this" flag back to
  // unknown, so the next real checkout attempt tries Stripe fresh — for
  // after Stripe adds support, or if the original rejection looked like a
  // one-off Stripe-side issue rather than a genuine unsupported currency.
  async function retryStripeCardPaymentSupport(code: string) {
    setRetryingCode(code);
    try {
      await apiRetryStripeCardPaymentSupport(code);
      await load();
    } catch {
      // best-effort — chip just stays flagged, admin can try again
    } finally {
      setRetryingCode(null);
    }
  }

  async function toggleAutoRefresh(value: boolean) {
    if (!fxConfig) return;
    setSavingConfig(true);
    try {
      const res = await apiUpdateFxConfig({ autoRefreshEnabled: value });
      setFxConfig(res.data.fxConfig);
    } finally {
      setSavingConfig(false);
    }
  }

  const historyColumns: TableColumn<ExchangeRateHistoryRow>[] = [
    { key: 'currency', header: 'Currency', render: h => <span className="font-semibold text-charcoal">{h.currency}</span> },
    { key: 'ratePerUSD', header: 'Rate (per USD)', render: h => <span className="text-graphite">{h.ratePerUSD}</span> },
    { key: 'source', header: 'Source', render: h => <span className="text-slate capitalize">{h.source}</span> },
    { key: 'effectiveFrom', header: 'Effective From', render: h => <span className="text-slate whitespace-nowrap">{formatDate(h.effectiveFrom)}</span> },
    {
      key: 'status', header: 'Status',
      render: h => !h.isRejected ? <StatusBadge status="Active" />
        : h.rejectionReason === 'abnormal_jump' ? <StatusBadge status="Flagged" />
        : h.rejectionReason === 'sanity_band' ? <StatusBadge status="Suspended" />
        : <StatusBadge status="Held" />,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="FX Settings"
        subtitle="The single authoritative PKR/USD exchange rate used across checkout, settlement, and refunds."
        actions={<Button variant="outline" size="sm" icon={<RefreshCw size={14} />} onClick={load}>Refresh</Button>}
      />

      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-5">
        <div className="flex gap-4 flex-wrap">
          {loading ? (
            <SkeletonBox className="h-24 w-full" />
          ) : (
            Object.keys(rates).length === 0 ? (
              <EmptyState icon={<AlertTriangle size={28} className="text-slate" />} title="No rates configured" description="Set a manual rate below to get started." />
            ) : (
              Object.entries(rates).map(([currency, rate]) => (
                <RateCard key={currency} currency={currency} rate={rate} staleness={staleness[currency]} />
              ))
            )
          )}
        </div>

        <OverrideForm currencies={currencies.map(c => c.code)} onDone={load} />

        <div className="bg-white border border-bone rounded-[10px] px-5 py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-[13px] font-bold text-carbon flex items-center gap-2"><Globe2 size={15} className="text-slate" /> Enabled Currencies</p>
              <p className="text-[11px] text-slate mt-[2px]">
                {loading ? 'Loading…' : `${currencies.length} of 152 real ISO-4217 currencies enabled for checkout/settlement.`}
              </p>
            </div>
            <Button variant="primary" size="sm" loading={enablingAll} onClick={enableAllCurrencies}>Enable All Currencies</Button>
          </div>
          {enableAllMessage && <p className="text-[12px] text-slate mt-2">{enableAllMessage}</p>}
          {currencies.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {currencies.map(c => (
                c.stripeCardPaymentSupported === false ? (
                  <span
                    key={c.code}
                    title="Stripe rejected an online card charge in this currency — buyers only see Cash on Delivery / Bank Transfer for it. Click Retry after Stripe adds support."
                    className="inline-flex items-center gap-1 px-2 py-[3px] rounded-md bg-error-bg text-[11px] font-medium text-error border border-error/30"
                  >
                    <AlertTriangle size={11} />
                    {c.code} — no card payment
                    <button
                      type="button"
                      onClick={() => retryStripeCardPaymentSupport(c.code)}
                      disabled={retryingCode === c.code}
                      className="ml-1 underline bg-transparent border-none p-0 text-error cursor-pointer disabled:opacity-50"
                    >
                      {retryingCode === c.code ? '…' : 'Retry'}
                    </button>
                  </span>
                ) : (
                  <span key={c.code} className="px-2 py-[3px] rounded-md bg-bone/60 text-[11px] font-medium text-charcoal border border-bone">{c.code}</span>
                )
              ))}
            </div>
          )}
          <AddCurrencyForm existing={currencies.map(c => c.code)} onDone={load} />
        </div>

        {fxConfig && (
          <div className="bg-white border border-bone rounded-[10px] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-[13px] font-bold text-carbon">Auto-refresh from provider</p>
              <p className="text-[11px] text-slate mt-[2px]">Daily automatic rate refresh (sanity-band + abnormal-jump checked before ever becoming current).</p>
            </div>
            <Toggle checked={fxConfig.autoRefreshEnabled} onChange={toggleAutoRefresh} disabled={savingConfig} />
          </div>
        )}

        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          <div className="px-5 py-[14px] border-b border-bone flex items-center gap-2">
            <History size={14} className="text-slate" />
            <p className="text-[13px] font-bold text-carbon">Rate History</p>
          </div>
          <Table
            columns={historyColumns}
            data={history}
            keyExtractor={h => h._id}
            loading={loading}
            emptyState={{ icon: <History size={28} className="text-slate" />, title: 'No history yet', description: 'Rate changes will appear here.' }}
          />
        </div>
      </div>
    </div>
  );
}
