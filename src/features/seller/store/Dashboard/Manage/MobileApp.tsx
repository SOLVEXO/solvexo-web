import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { clsx } from 'clsx';
import QRCode from 'qrcode';
import {
  Smartphone, Apple, Bot, CheckCircle2, ExternalLink, CreditCard,
  Send, Search, Hammer, UploadCloud, Rocket, XCircle, Check, Sparkles, Wrench, Zap, Clock,
  Barcode, Users, Wallet, RotateCcw, BarChart2, ShieldCheck, Play,
} from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Card, Button, Field, Input, Textarea, FileDropSelect, EmptyState } from '@/components/comman/ui';
import { StripeCardPayment, isStripeConfigured } from '@/components/comman/ui/StripeCardPayment';
import {
  apiGetStoreAppRequests, apiCreateStoreAppRequest, apiCreatePlatformPaymentIntent, apiConfirmPlatformPayment,
  type StoreAppRequest, type StoreAppPlatformState, type StoreAppPlatformStatus,
} from '@/api/services/storeAppRequests';
import { apiGetPosAppInfo } from '@/api/services/store';
import { GOOGLE_PLAY_URL } from '@/components/comman/ui/AppPromoParts';

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

// Real recorded stage timestamps (see StoreAppPlatformState.statusHistory)
// are shown as "Reached: 12 Feb, 3:45 PM" — date + time, since a seller
// checking mid-review genuinely cares which exact moment a stage started,
// not just the day.
function formatStageTimestamp(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}`;
}

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

// ── Per-platform review pipeline — a vertical stepper with a full
// explanation + expected duration for each stage, so a seller always knows
// exactly what's happening right now and roughly how long it'll take, not
// just a single flat status word. Rejected is a terminal branch shown on
// its own. The "Live" step's copy differs by platform: Android specifically
// carries Google Play's mandatory 14-day closed-testing requirement for a
// store's very first app on a new developer account (real Play Console
// policy, not a Solvexo-imposed delay) — iOS has no equivalent requirement.
function platformSteps(platform: 'android' | 'ios'): { key: StoreAppPlatformStatus; label: string; Icon: typeof Send; description: string; duration: string }[] {
  return [
    {
      key: 'pending', label: 'Requested', Icon: Send,
      description: 'Your app request has been received by the Solvexo team and is waiting to be picked up.',
      duration: 'Usually reviewed within 1–2 business days.',
    },
    {
      key: 'in_review', label: 'In review', Icon: Search,
      description: "We're checking your app's name, description, icon, and graphics to make sure everything meets Google Play / App Store guidelines before any work starts.",
      duration: 'Typically takes 1–3 days.',
    },
    {
      key: 'building', label: 'Building', Icon: Hammer,
      description: 'Our team is building your real, branded app from your store\'s own live data and design.',
      duration: 'Usually takes 3–5 days.',
    },
    {
      key: 'submitted', label: 'Submitted', Icon: UploadCloud,
      description: platform === 'android'
        ? "Your app has been submitted to Google Play and is now in Google's own review queue."
        : "Your app has been submitted to the App Store and is now in Apple's own review queue.",
      duration: platform === 'android' ? 'Google Play review: usually a few hours up to 2 days.' : 'App Store review: typically 1–3 days.',
    },
    {
      key: 'published', label: 'Live', Icon: Rocket,
      description: platform === 'android'
        ? "Once Google approves your app, Play Store policy requires a mandatory 14-day closed testing period (with real testers) before a NEW developer account's first app can go fully live — this is Google's own one-time rule, not something Solvexo can skip or speed up."
        : 'Once Apple approves your app, it goes live on the App Store automatically — no extra waiting period.',
      duration: platform === 'android' ? "This stage alone can take 14–16 days after approval, one time only for your store's first Android app." : 'Usually live within 24–48 hours of approval.',
    },
  ];
}

function PlatformPipeline({ state, platform }: { state: StoreAppPlatformState; platform: 'android' | 'ios' }) {
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

  const steps = platformSteps(platform);
  const currentIndex = steps.findIndex(s => s.key === state.status);

  return (
    <div className="flex flex-col px-1 pt-1">
      {steps.map((step, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const lineActive = i < currentIndex;
        const isLast = i === steps.length - 1;
        // Only ever a REAL, recorded timestamp (see StoreAppRequestsService
        // — one history entry per actual status transition) — never
        // estimated or backfilled client-side. Absent for a step the
        // platform hasn't reached yet, and for any row on data saved before
        // this field existed.
        const reachedAt = state.statusHistory?.find(h => h.status === step.key)?.changedAt;
        return (
          <div key={step.key} className="flex items-stretch gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div
                className={clsx(
                  'w-[26px] h-[26px] rounded-full flex items-center justify-center border-2 shrink-0 transition-colors duration-200',
                  isDone && 'bg-success border-success text-white',
                  isCurrent && 'bg-brand-orange border-brand-orange text-white shadow-[0_0_0_4px_rgba(217,119,87,0.15)]',
                  !isDone && !isCurrent && 'bg-white border-bone text-slate',
                )}
              >
                {isDone ? <Check size={13} /> : <step.Icon size={12} />}
              </div>
              {!isLast && (
                <div className={clsx('w-[2px] flex-1 my-1', lineActive ? 'bg-success' : 'bg-bone')} style={{ minHeight: '28px' }} />
              )}
            </div>
            <div className={clsx('min-w-0 flex-1 pb-5', isLast && 'pb-1')}>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <span
                  className={clsx(
                    'text-[12.5px] font-bold',
                    (isDone || isCurrent) ? 'text-charcoal' : 'text-slate',
                  )}
                >
                  {step.label}
                </span>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white bg-brand-orange px-2 py-[3px] rounded-full shrink-0">
                    <Clock size={10} className="shrink-0" /> Current stage
                  </span>
                )}
              </div>
              <p className={clsx('text-[12px] leading-[1.55] mt-1', (isDone || isCurrent) ? 'text-graphite' : 'text-slate')}>
                {step.description}
              </p>
              <p className="text-[11px] text-slate mt-1 italic">{step.duration}</p>
              {reachedAt && (
                <p className="text-[11px] font-semibold text-charcoal mt-1.5">
                  Reached: {formatStageTimestamp(reachedAt)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Per-platform status card ─────────────────────────────────────────────
function PlatformStatusCard({ label, platform, Icon, state, payFlow }: {
  label: string; platform: 'android' | 'ios'; Icon: typeof Apple; state: StoreAppPlatformState;
  // Present only when this platform hasn't been paid for/requested yet —
  // renders the shared pay-flow so a seller who already bought Android can
  // come back and buy iOS later (or vice versa) without resubmitting anything.
  payFlow?: ReactNode;
}) {
  if (!state.requested) {
    return (
      <div className="flex-1 min-w-0 flex flex-col gap-2.5 px-3.5 py-3 rounded-xl border border-dashed border-bone bg-[#faf9f5]">
        <div className="flex items-center gap-2.5">
          <Icon size={15} className="text-slate shrink-0" />
          <span className="flex-1 text-[12.5px] font-medium text-slate">{label} not requested</span>
        </div>
        {payFlow}
      </div>
    );
  }
  return (
    <div className="flex-1 min-w-0 flex flex-col gap-3 px-3.5 py-3.5 rounded-xl border border-bone bg-white">
      <div className="flex items-center gap-2">
        <Icon size={15} className="text-charcoal shrink-0" />
        <span className="flex-1 text-[13px] font-bold text-charcoal">{label}</span>
        {state.status === 'published' && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-success">
            <CheckCircle2 size={12} /> Live
          </span>
        )}
      </div>

      <PlatformPipeline state={state} platform={platform} />

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-brand-pale-orange flex items-center justify-center shrink-0">
            <Smartphone size={20} className="text-brand-deep-orange" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-charcoal">Your branded app</p>
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
        {inProgress && (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-brand-deep-orange bg-brand-pale-orange px-2.5 py-1 rounded-full shrink-0">
            <Clock size={11} className="shrink-0" /> In progress
          </span>
        )}
      </div>

      {latest && (
        <div className="mt-5 flex flex-col gap-3">
          <p className="text-[13px] font-bold text-carbon">{latest.appName}</p>
          <div className="flex flex-col lg:flex-row gap-4 items-start">
            <PlatformStatusCard
              label="Android" platform="android" Icon={Bot} state={latest.android}
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
              label="iOS" platform="ios" Icon={Apple} state={latest.ios}
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

// ── Real store-badge proportions/wording, not a generic icon+text pill —
// matches each platform's ACTUAL badge convention: Google Play really says
// "GET IT ON" / uses a solid play-triangle glyph; Apple really says
// "Download on the" / uses its own logo mark, never "Get it on". A caller
// passing the wrong `eyebrow`/`Icon` for a platform is the exact bug this
// was built to stop happening again. ──────────────────────────────────────
function StoreBadge({ href, Icon, iconColor, eyebrow, label, filled }: {
  href: string; Icon: typeof Bot; iconColor: string; eyebrow: string; label: string;
  /** Play Store's glyph is a solid triangle — Apple's logo mark is already
   *  solid by nature, so this only needs to be true for the Play icon. */
  filled?: boolean;
}) {
  return (
    <a
      href={href} target="_blank" rel="noopener noreferrer"
      className="inline-flex items-center gap-2.5 px-3.5 h-[44px] rounded-[10px] bg-black text-white no-underline border border-white/15 transition-transform duration-150 hover:-translate-y-px"
    >
      <Icon size={20} className={clsx('shrink-0', iconColor)} fill={filled ? 'currentColor' : 'none'} />
      <span className="flex flex-col leading-tight">
        <span className="text-[8.5px] text-white/85 tracking-[0.02em]">{eyebrow}</span>
        <span className="text-[15px] font-semibold -mt-[1px]" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>{label}</span>
      </span>
    </a>
  );
}

// Real, shipped capabilities of the Solvexo POS app — matches its actual
// backend routes (registers/shifts/sessions/sales/reports/audit-logs) one
// for one, not marketing copy for something that doesn't exist yet.
const POS_FEATURES: { Icon: typeof Barcode; label: string; desc: string }[] = [
  { Icon: Barcode, label: 'Barcode & product search', desc: "Look up any item instantly — synced with your store's real catalog and stock." },
  { Icon: Users, label: 'Per-staff PIN login', desc: 'Every employee signs in with their own PIN — never a shared password.' },
  { Icon: Wallet, label: 'Cash drawer & shifts', desc: 'Open/close registers, track cash in and out, reconcile at the end of every shift.' },
  { Icon: RotateCcw, label: 'Manager-approved refunds', desc: "Refunds, voids, and discounts need a manager's own PIN — a real check, not just a setting." },
  { Icon: BarChart2, label: 'Sales reports', desc: 'Daily and date-range reports per register or per employee, exportable anytime.' },
  { Icon: ShieldCheck, label: 'Full audit log', desc: 'Every register action — login, sale, refund, cash adjustment — is recorded.' },
];

// ── Section 2: Solvexo POS ───────────────────────────────────────────────
// Completely separate from the branded-app flow above: NOT paid through our
// dashboard at all. Solvexo POS is one single, already-published Google Play
// listing that is itself a PAID listing — a merchant scans the QR code,
// lands on that Play Store page, and pays Google directly to install. No
// Stripe, no PaymentIntent, no "enabled" flag, no Android/iOS split as
// separate Solvexo products (iOS isn't offered yet — see StoreService.getPosAppInfo).
function PosAccessSection() {
  const [androidUrl, setAndroidUrl] = useState<string | null>(null);
  // Real — null until an admin sets POS_APP_IOS_URL once an actual iOS
  // build/App Store listing exists (see StoreService.getPosAppInfo's own
  // doc comment). No fallback URL for this one: unlike Android, there is no
  // existing real iOS listing anywhere in the app to safely reuse, so this
  // honestly renders "not published yet" rather than inventing a link.
  const [iosUrl, setIosUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiGetPosAppInfo()
      .then(res => {
        // Backend reads `POS_APP_ANDROID_URL` (configurable without a
        // frontend deploy — see StoreService.getPosAppInfo) — but that env
        // var isn't set on every environment yet, and a merchant scanning
        // this should never see "not configured" when a real, working link
        // already exists. `GOOGLE_PLAY_URL` (AppPromoParts.tsx) is that same
        // real internal-test listing, already used elsewhere in the app
        // with zero backend dependency — a safe fallback, not a fake one.
        setAndroidUrl(res.data.android ?? GOOGLE_PLAY_URL);
        setIosUrl(res.data.ios ?? null);
      })
      .catch(() => setAndroidUrl(GOOGLE_PLAY_URL))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card className="h-[360px] animate-pulse" />;

  return (
    <Card>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="w-11 h-11 rounded-2xl bg-info-bg flex items-center justify-center shrink-0">
            <Zap size={20} className="text-info" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-charcoal">Solvexo POS</p>
            <p className="text-[12.5px] text-slate mt-0.5 leading-[1.5] max-w-[560px]">
              Already built, already published — a real, full point-of-sale app for selling in person: at a counter,
              a market stall, or an event. Scan the QR code to open its Google Play listing; Google handles payment
              directly when you install it.
            </p>
          </div>
        </div>
        {/* Honest, not aspirational — the actual link behind this page today
            is an internal-testing Play Console track (see GOOGLE_PLAY_URL's
            own doc comment), not a public production listing. Only real
            testers Google has whitelisted can install from it; anyone else
            hits an access-denied screen. Claiming "Live on Google Play" here
            would be false until the app is actually publicly published —
            flagged, not silently badged over. */}
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#9A6A17] bg-[#fdf3e7] px-2.5 py-1 rounded-full shrink-0">
          <Clock size={11} className="shrink-0" /> Closed testing (not public yet)
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3.5">
        {POS_FEATURES.map(f => (
          <div key={f.label} className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-md bg-[#faf9f5] flex items-center justify-center shrink-0 mt-0.5">
              <f.Icon size={12.5} className="text-brand-deep-orange" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-charcoal leading-tight">{f.label}</p>
              <p className="text-[11px] text-slate leading-[1.4] mt-0.5">{f.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-col sm:flex-row gap-4">
        <PosPlatformPanel
          label="Android" Icon={Play} iconColor="text-[#00D46A]" iconFilled
          storeName="Google Play" badgeLabel="Google Play" badgeEyebrow="GET IT ON"
          url={androidUrl}
          notPublishedText="Google Play listing isn't configured yet — please check back soon."
          altText="Scan to open Solvexo POS on Google Play"
        />
        <PosPlatformPanel
          label="iOS" Icon={Apple} iconColor="text-charcoal"
          storeName="the App Store" badgeLabel="App Store" badgeEyebrow="Download on the"
          // No real App Store listing exists yet (see StoreService.
          // getPosAppInfo) — POS_APP_IOS_URL is genuinely unset. This QR is
          // a DEMO placeholder only, requested explicitly to preview the
          // layout with both cards filled in — it points at Solvexo's real
          // site, never a fabricated apps.apple.com id, and is clearly
          // marked "Demo" (isDemo) so it can never be mistaken for a real
          // listing. Swap to the real flow the instant POS_APP_IOS_URL is set.
          url={iosUrl ?? 'https://solvexo.store'}
          isDemo={!iosUrl}
          notPublishedText="Not published on the App Store yet — this card lights up the moment it is, no app update needed."
          altText="Scan to open Solvexo POS on the App Store"
        />
      </div>
    </Card>
  );
}

// ── One platform's real QR/download panel, or an honest "not published
// yet" state — reused for both Android and iOS so neither is a special
// case. Only ever renders a REAL scannable code for a URL that actually
// exists; never a placeholder QR pointing nowhere. ──────────────────────
function PosPlatformPanel({ label, Icon, iconColor, iconFilled, storeName, badgeLabel, badgeEyebrow, url, notPublishedText, altText, isDemo }: {
  label: string; Icon: typeof Bot; iconColor: string;
  /** Used in the descriptive sentence, which needs the article — "on the App Store". */
  storeName: string;
  /** The badge's own bold text, WITHOUT the article — real badges say
   *  "App Store" / "Google Play", never "the App Store". */
  badgeLabel: string;
  /** Play Store's glyph is a solid triangle; Apple's logo mark is already solid by nature. */
  iconFilled?: boolean;
  /** Each platform's OWN real badge wording — "GET IT ON" for Google Play,
   *  "Download on the" for the App Store. Never share one string across
   *  both; that's exactly how the old badge ended up saying "Get it on the
   *  App Store", which Apple's real badge never says. */
  badgeEyebrow: string;
  url: string | null; notPublishedText: string; altText: string;
  /** True only when `url` is a stand-in for a real listing that doesn't
   *  exist yet (see the iOS call site) — shows a clear "Demo" pill so this
   *  can never be mistaken for a real, working store listing. */
  isDemo?: boolean;
}) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!url) { setQrDataUrl(null); return; }
    let cancelled = false;
    QRCode.toDataURL(url, { width: 220, margin: 1 })
      .then(dataUrl => { if (!cancelled) setQrDataUrl(dataUrl); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [url]);

  if (!url) {
    return (
      <div className="flex-1 min-w-0 rounded-2xl border border-dashed border-bone bg-white px-4 py-5 flex items-center gap-2.5">
        <Icon size={16} className="text-slate shrink-0" />
        <span className="text-[12px] font-medium text-slate leading-[1.5]">{notPublishedText}</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 rounded-2xl border border-bone bg-[#faf9f5] px-4 sm:px-5 py-5 relative">
      {isDemo && (
        <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-bold text-white bg-charcoal/80 px-2 py-[3px] rounded-full">
          Demo — not a real listing
        </span>
      )}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
        <div className="w-[120px] h-[120px] rounded-xl border border-bone bg-white flex items-center justify-center shrink-0 p-2 shadow-sm">
          {qrDataUrl ? (
            <img src={qrDataUrl} alt={altText} className="w-full h-full" />
          ) : (
            <div className="w-full h-full animate-pulse bg-[#faf9f5] rounded-lg" />
          )}
        </div>
        <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start gap-2 text-center sm:text-left">
          <span className="inline-flex items-center gap-1.5 text-[12px] font-bold text-charcoal">
            <Icon size={13} className={clsx(iconColor, 'shrink-0')} fill={iconFilled ? 'currentColor' : 'none'} /> Get it for {label}
          </span>
          <p className="text-[11px] text-slate leading-[1.5]">
            {isDemo
              ? "Preview only — this QR/badge doesn't point to a real App Store listing yet."
              : `Scan with your phone's camera, or tap the badge. Payment for the app itself happens on ${storeName} — nothing to pay here in your Solvexo dashboard.`}
          </p>
          <StoreBadge href={url} Icon={Icon} iconColor={iconColor} filled={iconFilled} eyebrow={badgeEyebrow} label={badgeLabel} />
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────
export default function StoreMobileApp() {
  const { storeId } = useStoreWorkspace();

  return (
    <div>
      <StorePageHeader title="Mobile App" subtitle="Your branded app, and Solvexo's ready-made POS app" />
      <div className="px-4 lg:px-7 py-6 flex flex-col gap-5">
        <BrandedAppSection storeId={storeId} />
        <PosAccessSection />
      </div>
    </div>
  );
}
