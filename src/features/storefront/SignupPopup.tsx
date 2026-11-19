import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { apiGetPublicSignupForm, apiRecordSignupFormView, apiSubmitSignupForm, type PublicSignupForm } from '@/api/services/signupForms';

// The email signup popup (Shopify: Forms). It appears on the visitor's n-th page view, after a delay and/or when the cursor
// leaves the page (desktop only); closing it leaves a small teaser tab, and it never comes back on its own once dismissed or
// once the visitor subscribed (remembered in this browser). It is never shown at checkout, on sign-in pages, or inside the theme
// editor's preview frame.

const flagKey = (storeId: string) => `solvexo:signup-popup:${storeId}`;
const viewsKey = (storeId: string) => `solvexo:signup-popup-views:${storeId}`;
type Flag = 'dismissed' | 'subscribed' | null;

function readFlag(storeId: string): Flag {
  try { const v = localStorage.getItem(flagKey(storeId)); return v === 'dismissed' || v === 'subscribed' ? v : null; } catch { return null; }
}
function writeFlag(storeId: string, v: Exclude<Flag, null>) {
  try { localStorage.setItem(flagKey(storeId), v); } catch { /* the popup just may show again next visit */ }
}
/** Counts storefront pages seen in this browsing session. */
function bumpPageViews(storeId: string): number {
  try {
    const n = (Number(sessionStorage.getItem(viewsKey(storeId))) || 0) + 1;
    sessionStorage.setItem(viewsKey(storeId), String(n));
    return n;
  } catch { return 1; }
}
const NEVER_SHOW_ON = /^\/(checkout|login|register|verify-otp|forgot-password|reset-password|account|orders|order-status|cod-confirm)(\/|$)/;

export function SignupPopup({ storeId, brandColor, font, radius }: { storeId: string; brandColor: string; font?: string; radius?: string }) {
  const { pathname } = useLocation();
  const [form, setForm] = useState<PublicSignupForm | null>(null);
  const [flag, setFlag] = useState<Flag>(() => readFlag(storeId));
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'done'>('form');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ message: string; code: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const shownOnce = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const blocked = NEVER_SHOW_ON.test(pathname) || (typeof window !== 'undefined' && window.self !== window.top);

  // The popup's settings (nothing comes back when the seller has it switched off).
  useEffect(() => {
    let alive = true;
    apiGetPublicSignupForm(storeId).then(r => { if (alive) setForm(r.data ?? null); }).catch(() => { /* a failed lookup just means no popup */ });
    return () => { alive = false; };
  }, [storeId]);

  // Triggers: page view number, delay, exit intent.
  useEffect(() => {
    if (!form || flag || blocked || shownOnce.current) return;
    const seen = bumpPageViews(storeId);
    if (seen < form.showAfterPageViews) return;
    const show = () => {
      if (shownOnce.current) return;
      shownOnce.current = true;
      setOpen(true);
      apiRecordSignupFormView(storeId).catch(() => undefined);
    };
    const timer = window.setTimeout(show, Math.max(0, form.delaySeconds) * 1000);
    const hasHover = typeof window.matchMedia === 'function' && window.matchMedia('(hover: hover)').matches;
    const onLeave = (e: MouseEvent) => { if (e.clientY <= 0 && !e.relatedTarget) show(); };
    if (form.exitIntent && hasHover) document.addEventListener('mouseout', onLeave);
    return () => { window.clearTimeout(timer); document.removeEventListener('mouseout', onLeave); };
  }, [form, flag, blocked, storeId, pathname]);

  const close = () => {
    setOpen(false);
    if (!flag) { writeFlag(storeId, 'dismissed'); setFlag('dismissed'); }
  };

  // Esc closes; focus goes to the email box.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    inputRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await apiSubmitSignupForm(storeId, email.trim());
      writeFlag(storeId, 'subscribed');
      setFlag('subscribed');
      setResult({ message: res.message ?? '', code: res.data?.discountCode ?? null });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (!form || blocked) return null;

  // The store's own button radius (a CSS length such as "8px" or "9999px") for inputs and buttons; cards keep a fixed soft corner.
  const r = radius || '8px';
  const ff = font || undefined;

  return (
    <>
      {!open && flag === 'dismissed' && form.teaser && (
        <button
          type="button"
          onClick={() => { setStep('form'); setOpen(true); }}
          style={{ background: brandColor, borderRadius: '12px 12px 0 0', fontFamily: ff }}
          className="fixed left-4 bottom-0 z-[900] px-4 py-2 text-[13px] font-semibold text-white shadow-lg cursor-pointer border-0"
        >
          {form.teaserText || 'Subscribe'}
        </button>
      )}

      {open && (
        <div role="presentation" className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50" onMouseDown={e => { if (e.target === e.currentTarget) close(); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="signup-popup-title" style={{ borderRadius: 16, fontFamily: ff }} className="relative w-full max-w-[420px] bg-white p-7 shadow-2xl text-center">
            <button type="button" onClick={close} aria-label="Close" className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-[20px] leading-none text-neutral-500 hover:text-neutral-900 bg-transparent border-0 cursor-pointer">×</button>

            {step === 'form' ? (
              <form onSubmit={submit} noValidate={false}>
                <h2 id="signup-popup-title" className="text-[22px] font-bold text-neutral-900 mb-2">{form.heading}</h2>
                {form.body && <p className="text-[14px] text-neutral-600 mb-5">{form.body}</p>}
                <label htmlFor="signup-popup-email" className="sr-only">Email address</label>
                <input
                  id="signup-popup-email" ref={inputRef} type="email" required autoComplete="email" inputMode="email"
                  value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"
                  style={{ borderRadius: r }}
                  className="w-full px-3.5 py-3 text-[15px] border border-neutral-300 outline-none focus:border-neutral-900 mb-3"
                />
                {error && <p role="alert" className="text-[13px] text-red-600 mb-3">{error}</p>}
                <button type="submit" disabled={busy} style={{ background: brandColor, borderRadius: r }} className="w-full py-3 text-[15px] font-semibold text-white border-0 cursor-pointer disabled:opacity-60">
                  {busy ? '…' : form.buttonLabel}
                </button>
                <p className="text-[11px] text-neutral-500 mt-3">By subscribing you agree to receive marketing emails. You can unsubscribe at any time.</p>
              </form>
            ) : (
              <div>
                <h2 id="signup-popup-title" className="text-[22px] font-bold text-neutral-900 mb-2">{form.successHeading}</h2>
                <p className="text-[14px] text-neutral-600 mb-5">{result?.message || form.successMessage}</p>
                {result?.code && (
                  <div className="mb-5 px-4 py-3 border-2 border-dashed border-neutral-300" style={{ borderRadius: 12 }}>
                    <p className="text-[11px] uppercase tracking-wider text-neutral-500 mb-1">Your discount code</p>
                    <p className="text-[22px] font-bold tracking-widest text-neutral-900 mb-2">{result.code}</p>
                    <button type="button" onClick={() => { navigator.clipboard?.writeText(result.code!).then(() => setCopied(true)).catch(() => undefined); }} className="text-[13px] font-semibold underline bg-transparent border-0 cursor-pointer text-neutral-700">
                      {copied ? 'Copied' : 'Copy code'}
                    </button>
                  </div>
                )}
                <button type="button" onClick={() => setOpen(false)} style={{ background: brandColor, borderRadius: r }} className="w-full py-3 text-[15px] font-semibold text-white border-0 cursor-pointer">Continue shopping</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
