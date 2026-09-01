import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { clsx } from 'clsx';
import QRCode from 'qrcode';
import {
  Smartphone, Apple, Bot, CheckCircle2, ExternalLink, CreditCard,
  Send, Search, Hammer, UploadCloud, Rocket, XCircle, Check, Sparkles, Wrench, Zap,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Card, Button, Field, Input, Textarea, FileDropSelect, EmptyState } from '@/components/comman/ui';
import { StripeCardPayment, isStripeConfigured } from '@/components/comman/ui/StripeCardPayment';
import {
  apiGetStoreAppRequests, apiCreateStoreAppRequest, apiCreatePlatformPaymentIntent, apiConfirmPlatformPayment,
  type StoreAppRequest, type StoreAppPlatformState, type StoreAppPlatformStatus,
} from '@/api/services/storeAppRequests';
import { apiGetPosAppInfo } from '@/api/services/store';

// ── Two completely separate mobile-app products a seller can get, both
// reachable only from this page — deliberately NOT sharing any
// payment/request architecture with each other:
//  1. Solvexo POS — one single, already-published, PAID Google Play listing.
//     Google Play collects payment directly from the merchant on install;
//     our dashboard only shows a QR code/link to that listing (Android only
//     for now) — no Stripe, no request, no per-store "enabled" state at all
//     (see PosAccessSection / StoreService.getPosAppInfo).
//  2. A white-label, BRANDED app for just this store — a real per-platform
//     build submitted to Google Play / the App Store, manually reviewed and
//     published by the Solvexo team, paid for per platform via Stripe
//     (StoreAppRequest, below).
// ──────────────────────────────────────────────────────────────────────────

const RESOLVED_STATUSES = new Set(['not_requested', 'published', 'rejected']);

function isRequestResolved(request: StoreAppRequest) {
  const androidDone = !request.android.requested || RESOLVED_STATUSES.has(request.android.status);
  const iosDone = !request.ios.requested || RESOLVED_STATUSES.has(request.ios.status);
  return androidDone && iosDone;
}

// ── Shared pay-flow: "Pay $X" → Stripe card element → server-side confirm.
// Reused for all four independently-paid platform unlocks on this page
// (branded-app Android, branded-app iOS, POS Android, POS iOS) so none of
// them duplicate the create-intent/confirm/error/loading state by hand.
function PlatformPayFlow({ label, priceLabel, onCreateIntent, onConfirm }: {
  label: string;
  priceLabel: string;
  onCreateIntent: () => Promise<{ clientSecret: string; amount: number }>;
  onConfirm: () => Promise<void>;
}) {
  const [starting, setStarting] = useState(false);
  const [paying, setPaying] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [amount, setAmount] = useState<number | null>(null);
  const [error, setError] = useState('');

  const handleStart = async () => {
    setStarting(true);
    setError('');
    try {
      const res = await onCreateIntent();
      setClientSecret(res.clientSecret);
      setAmount(res.amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : `Failed to start payment for ${label}.`);
    } finally {
      setStarting(false);
    }
  };

  const handleConfirmed = async () => {
    setPaying(true);
    setError('');
    try {
      await onConfirm();
      setClientSecret('');
      setAmount(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment succeeded but confirming access failed — refresh and try again.');
    } finally {
      setPaying(false);
    }
  };

  if (!isStripeConfigured()) {
    return <p className="text-[12px] text-slate">Online payments aren't configured yet — please check back soon.</p>;
  }

  if (clientSecret) {
    return (
      <div className="max-w-[320px]">
        <div className="rounded-lg border border-bone bg-white px-3 py-2.5 mb-2.5 flex items-center justify-between gap-3">
          <span className="text-[11.5px] font-semibold text-charcoal">{priceLabel}</span>
          <span className="text-[14px] font-bold text-charcoal shrink-0">${(amount ?? 0).toFixed(2)}</span>
        </div>
        <StripeCardPayment clientSecret={clientSecret} submitLabel={`Pay $${(amount ?? 0).toFixed(2)}`} onConfirmed={handleConfirmed} />
        {paying && <p className="mt-2 text-[11.5px] text-slate">Confirming your payment…</p>}
        {error && <p className="mt-2 text-[12px] text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <Button variant="outline" size="sm" onClick={handleStart} loading={starting}>
        <span className="inline-flex items-center gap-1.5"><CreditCard size={13} /> Pay for {label}</span>
      </Button>
      {error && <p className="mt-1.5 text-[12px] text-error">{error}</p>}
    </div>
  );
}

// ── Per-platform review pipeline — a small horizontal stepper so a seller
// can see at a glance where their build actually sits, instead of a single
// flat status word. Rejected is a terminal branch shown on its own.
const PLATFORM_STEPS: { key: StoreAppPlatformStatus; label: string; Icon: typeof Send }[] = [
  { key: 'pending', label: 'Requested', Icon: Send },
  { key: 'in_review', label: 'In review', Icon: Search },
  { key: 'building', label: 'Building', Icon: Hammer },
  { key: 'submitted', label: 'Submitted', Icon: UploadCloud },
  { key: 'published', label: 'Live', Icon: Rocket },
];

function PlatformPipeline({ state }: { state: StoreAppPlatformState }) {
  if (state.status === 'rejected') {
    return (
      <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-error-bg">
        <XCircle size={16} className="text-error shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-[12.5px] font-bold text-error">Needs changes</p>
          {state.rejectionReason && (
            <p className="text-[12px] text-error/80 mt-0.5 leading-[1.5]">{state.rejectionReason}</p>
          )}
        </div>
      </div>
    );
  }

  const currentIndex = PLATFORM_STEPS.findIndex(s => s.key === state.status);

  return (
    <div className="flex items-start px-1 pt-1">
      {PLATFORM_STEPS.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const lineActive = i > 0 && i <= currentIndex;
        return (
          <div key={step.key} className="flex-1 flex flex-col items-center relative">
            {i > 0 && (
              <div
                className={clsx('absolute top-[13px] h-[2px]', lineActive ? 'bg-success' : 'bg-bone')}
                style={{ left: '-50%', width: '100%' }}
              />
            )}
            <div
              className={clsx(
                'relative z-10 w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 shrink-0 transition-colors duration-200',
                isDone && 'bg-success border-success text-white',
                isCurrent && 'bg-brand-orange border-brand-orange text-white shadow-[0_0_0_4px_rgba(217,119,87,0.15)]',
                !isDone && !isCurrent && 'bg-white border-bone text-slate',
              )}
            >
              {isDone ? <Check size={13} /> : <step.Icon size={12} />}
            </div>
            <span
              className={clsx(
                'mt-1.5 text-[10px] font-semibold text-center leading-tight',
                (isDone || isCurrent) ? 'text-charcoal' : 'text-slate',
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Per-platform status card ─────────────────────────────────────────────
function PlatformStatusCard({ label, Icon, state, payFlow }: {
  label: string; Icon: typeof Apple; state: StoreAppPlatformState;
  // Present only when this platform hasn't been paid for/requested yet —
  // renders the shared pay-flow so a seller who already bought Android can
  // come back and buy iOS later (or vice versa) without resubmitting anything.
  payFlow?: ReactNode;
}) {
  if (!state.requested) {
    return (
      <div className="flex flex-col gap-2.5 px-3.5 py-3 rounded-xl border border-dashed border-bone bg-[#faf9f5]">
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-slate shrink-0" />
          <span className="flex-1 text-[12.5px] font-medium text-slate">{label} not requested</span>
        </div>
        {payFlow}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3 px-3.5 py-3.5 rounded-xl border border-bone bg-white">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-charcoal shrink-0" />
        <span className="flex-1 text-[13px] font-bold text-charcoal">{label}</span>
        {state.status === 'published' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
            <CheckCircle2 size={12} /> Live
          </span>
        )}
      </div>

      <PlatformPipeline state={state} />

      {state.status === 'published' && state.storeUrl && (
        <a
          href={state.storeUrl} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-brand-orange no-underline w-fit"
        >
          <ExternalLink size={12} /> View live listing
        </a>
      )}
    </div>
  );
}

// ── Request form ─────────────────────────────────────────────────────────
// Just the app's profile/listing details — free to submit. Android and iOS
// are each requested (and paid for) separately afterward from the platform
// cards below, one at a time — this form no longer picks platforms.
function RequestAppForm({ storeId, onSubmitted }: { storeId: string; onSubmitted: (req: StoreAppRequest) => void }) {
  const [appName, setAppName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [fullDescription, setFullDescription] = useState('');
  const [icon, setIcon] = useState<File | null>(null);
  const [featureGraphic, setFeatureGraphic] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const canSubmit =
    !!appName.trim() && !!shortDescription.trim() && !!fullDescription.trim() && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await apiCreateStoreAppRequest(
        storeId,
        { appName: appName.trim(), shortDescription: shortDescription.trim(), fullDescription: fullDescription.trim() },
        icon, featureGraphic,
      );
      onSubmitted(res.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to submit your app request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <Field label="App name" required hint="This is how your app will appear on Google Play / the App Store">
        <Input value={appName} onChange={e => setAppName(e.target.value)} maxLength={50} placeholder="My Store" />
      </Field>

      <Field
        label="Short description" required
        hint={`Users can expand to view your full description (${shortDescription.length}/80)`}
      >
        <Input value={shortDescription} onChange={e => setShortDescription(e.target.value)} maxLength={80} placeholder="Shop My Store on the go." />
      </Field>

      <Field label="Full description" required hint={`${fullDescription.length}/4000 characters`}>
        <Textarea value={fullDescription} onChange={e => setFullDescription(e.target.value)} maxLength={4000} rows={5} />
      </Field>

      <Field label="App icon" hint="Optional — PNG or JPEG, up to 1MB, exactly 512×512px. You can add this later.">
        <FileDropSelect value={icon} onChange={setIcon} label="Upload app icon (512×512)" />
      </Field>

      <Field label="Featured graphic" hint="Optional — PNG or JPEG, up to 15MB, exactly 1,024×500px. You can add this later.">
        <FileDropSelect value={featureGraphic} onChange={setFeatureGraphic} label="Upload feature graphic (1024×500)" />
      </Field>

      <p className="text-[11.5px] text-slate mb-3">
        This just submits your app's profile — Android and iOS are each requested and paid for separately, right after.
      </p>

      {error && <p className="text-[12.5px] text-error mb-3">{error}</p>}

      <Button variant="primary" onClick={handleSubmit} disabled={!canSubmit} loading={submitting}>
        Submit app profile
      </Button>
    </div>
  );
}

// ── Section 1: Your Branded App ──────────────────────────────────────────
function BrandedAppSection({ storeId }: { storeId: string }) {
  const [requests, setRequests] = useState<StoreAppRequest[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(() => {
    if (!storeId) return;
    setLoading(true);
    apiGetStoreAppRequests(storeId)
      .then(res => setRequests(res.data))
      .catch(() => setRequests([]))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Card className="h-[200px] animate-pulse" />;

  const latest = requests?.[0] ?? null;
  const inProgress = latest && !isRequestResolved(latest);

  const applyUpdatedRequest = (updated: StoreAppRequest) => {
    setRequests(prev => (prev && prev.length ? [updated, ...prev.slice(1)] : [updated]));
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-brand-pale-orange flex items-center justify-center shrink-0">
          <Smartphone size={20} className="text-brand-deep-orange" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[15px] font-bold text-charcoal">Your branded app</p>
            {inProgress && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-deep-orange bg-brand-pale-orange px-2 py-[3px] rounded-full">
                In progress
              </span>
            )}
          </div>
          <p className="text-[12.5px] text-slate mt-0.5 leading-[1.5]">
            A dedicated app for your store, published under your own name on Google Play and the App Store.
            The Solvexo team builds and publishes it manually once you submit and pay for a platform.
          </p>
          {!latest && (
            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate">
                <Sparkles size={12} className="text-brand-orange shrink-0" /> Your own brand
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate">
                <Wrench size={12} className="text-brand-orange shrink-0" /> We build it for you
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium text-slate">
                <Rocket size={12} className="text-brand-orange shrink-0" /> Android &amp; iOS, priced separately
              </span>
            </div>
          )}
        </div>
      </div>

      {latest && (
        <div className="mt-5 flex flex-col gap-3">
          <p className="text-[13px] font-bold text-carbon">{latest.appName}</p>
          <div className="flex flex-col gap-3">
            <PlatformStatusCard
              label="Android" Icon={Bot} state={latest.android}
              payFlow={!latest.android.requested ? (
                <PlatformPayFlow
                  label="Android"
                  priceLabel="Android app — build fee"
                  onCreateIntent={() => apiCreatePlatformPaymentIntent(storeId, 'android').then(res => res.data)}
                  onConfirm={async () => {
                    const res = await apiConfirmPlatformPayment(storeId, 'android');
                    applyUpdatedRequest(res.data);
                  }}
                />
              ) : undefined}
            />
            <PlatformStatusCard
              label="iOS" Icon={Apple} state={latest.ios}
              payFlow={!latest.ios.requested ? (
                <PlatformPayFlow
                  label="iOS"
                  priceLabel="iOS app — build fee"
                  onCreateIntent={() => apiCreatePlatformPaymentIntent(storeId, 'ios').then(res => res.data)}
                  onConfirm={async () => {
                    const res = await apiConfirmPlatformPayment(storeId, 'ios');
                    applyUpdatedRequest(res.data);
                  }}
                />
              ) : undefined}
            />
          </div>
        </div>
      )}

      {!latest && !showForm && (
        <EmptyState
          icon={<Smartphone size={28} className="text-brand-orange" />}
          title="No app requested yet"
          description="Submit your app's profile once, then pay for Android and/or iOS whenever you're ready."
          action={{ label: 'Request your app', onClick: () => setShowForm(true) }}
        />
      )}

      {!latest && showForm && (
        <div className="mt-4">
          <RequestAppForm storeId={storeId} onSubmitted={req => { setRequests([req]); setShowForm(false); }} />
        </div>
      )}

      {latest && isRequestResolved(latest) && (
        <div className="mt-4">
          <Button variant="outline" onClick={() => setRequests(null)}>
            Submit another request
          </Button>
        </div>
      )}
    </Card>
  );
}

// ── App-store-style download badge (dark pill, platform icon, two-line label) ──
function StoreBadge({ href, Icon, iconColor, eyebrow, label }: {
  href: string; Icon: typeof Bot; iconColor: string; eyebrow: string; label: string;
}) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-carbon text-white no-underline transition-transform duration-150 hover:-translate-y-px"
    >
      <Icon size={20} className={clsx('shrink-0', iconColor)} />
      <span className="flex flex-col leading-tight">
        <span className="text-[9.5px] text-white/70 uppercase tracking-[0.04em]">{eyebrow}</span>
        <span className="text-[13px] font-bold">{label}</span>
      </span>
    </a>
  );
}

// ── Section 2: Solvexo POS ───────────────────────────────────────────────
// Completely separate from the branded-app flow above: NOT paid through our
// dashboard at all. Solvexo POS is one single, already-published Google Play
// listing that is itself a PAID listing — a merchant scans the QR code,
// lands on that Play Store page, and pays Google directly to install. No
// Stripe, no PaymentIntent, no "enabled" flag, no Android/iOS split as
// separate Solvexo products (iOS isn't offered yet — see StoreService.getPosAppInfo).
function PosAccessSection() {
  const [androidUrl, setAndroidUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    apiGetPosAppInfo()
      .then(res => setAndroidUrl(res.data.android))
      .catch(() => setError('Failed to load Solvexo POS info — please refresh and try again.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!androidUrl) { setQrDataUrl(null); return; }
    let cancelled = false;
    QRCode.toDataURL(androidUrl, { width: 220, margin: 1 })
      .then(dataUrl => { if (!cancelled) setQrDataUrl(dataUrl); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [androidUrl]);

  if (loading) return <Card className="h-[180px] animate-pulse" />;

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-info-bg flex items-center justify-center shrink-0">
          <Zap size={20} className="text-info" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-bold text-charcoal">Solvexo POS</p>
          <p className="text-[12.5px] text-slate mt-0.5 leading-[1.5]">
            Already built, already published — a ready-to-use point-of-sale app for in-person selling.
            Scan the QR code to open its Google Play listing; Google handles payment directly when you install it.
          </p>
        </div>
      </div>

      {error && <p className="text-[12.5px] text-error mt-4">{error}</p>}

      {!error && (
        androidUrl ? (
          <div className="mt-5 flex flex-col sm:flex-row items-start gap-4">
            <div className="w-[132px] h-[132px] rounded-xl border border-bone bg-white flex items-center justify-center shrink-0 p-2">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="Scan to open Solvexo POS on Google Play" className="w-full h-full" />
              ) : (
                <div className="w-full h-full animate-pulse bg-[#faf9f5] rounded-lg" />
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-2.5">
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-charcoal">
                <Bot size={13} className="text-slate shrink-0" /> Android — Google Play
              </span>
              <StoreBadge href={androidUrl} Icon={Bot} iconColor="text-[#3DDC84]" eyebrow="Get it on" label="Google Play" />
              <p className="text-[11.5px] text-slate leading-[1.5]">
                Scan with your phone's camera, or tap the badge above. Payment happens on Google Play — nothing to pay here.
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-5 flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-dashed border-bone bg-[#faf9f5]">
            <Bot size={15} className="text-slate shrink-0" />
            <span className="text-[12.5px] font-medium text-slate">Google Play listing isn't configured yet — please check back soon.</span>
          </div>
        )
      )}
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function StoreMobileApp() {
  const { storeId } = useStoreWorkspace();

  return (
    <div>
      <StorePageHeader title="Mobile App" subtitle="Your branded app, and Solvexo's ready-made POS app" />
      <div className="px-4 lg:px-7 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start">
          <BrandedAppSection storeId={storeId} />
          <PosAccessSection />
        </div>
      </div>
    </div>
  );
}
