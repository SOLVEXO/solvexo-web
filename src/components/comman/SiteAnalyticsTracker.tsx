import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { apiSitePublicConfig, type SitePublicConfig } from '@/api/services/siteAnalytics';
import { hostMode } from '@/utils/platformHost';
import { getStoreSlugFromHost, isCustomDomainCandidate } from '@/utils/storefrontUrl';
import { gaLoaded, isTrackedPath, loadGa, readConsent, saveConsent, skipGa, trackPageView, type ConsentChoice } from '@/utils/siteAnalytics';

// Merchant storefronts share RootLayout but are never tracked by Solvexo's own analytics.
// The superadmin host (paths without /admin) is never a public page either.
const ON_STORE_HOST = !!(getStoreSlugFromHost() || isCustomDomainCandidate()) || hostMode() === 'superadmin';

/**
 * Solvexo's Google Analytics on the public site and sign-up flow. Fetches the measurement id the first time a
 * tracked page is shown; visitors from the EU/EEA/UK/Switzerland see a consent banner first and are only tracked
 * after accepting. Mounted once in RootLayout.
 */
export function SiteAnalyticsTracker() {
  const { pathname, search } = useLocation();
  const tracked = !ON_STORE_HOST && isTrackedPath(pathname);
  const [config, setConfig] = useState<SitePublicConfig | null>(null);
  const [consent, setConsent] = useState<ConsentChoice | null>(readConsent);
  const requested = useRef(false);
  // Track only once there is an id and, where required, the visitor has accepted.
  const measurementId = config?.measurementId ?? null;
  const allowed = !!measurementId && (!config?.consentRequired || consent === 'granted');

  useEffect(() => {
    if (!tracked || requested.current) return;
    requested.current = true;
    apiSitePublicConfig()
      .then(res => setConfig(res.data))
      .catch(() => skipGa()); // analytics must never break the page
  }, [tracked]);

  useEffect(() => {
    if (!config) return;
    if (allowed && measurementId) loadGa(measurementId);
    else if (!measurementId || consent === 'denied') skipGa();
  }, [config, allowed, measurementId, consent]);

  useEffect(() => {
    if (allowed && gaLoaded()) trackPageView(pathname, search);
  }, [allowed, pathname, search]);

  const askConsent = tracked && !!config?.measurementId && config.consentRequired && consent === null;
  if (!askConsent) return null;

  const choose = (choice: ConsentChoice) => { saveConsent(choice); setConsent(choice); };
  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookie consent"
      className="fixed inset-x-3 bottom-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:max-w-[420px] z-[9998] rounded-2xl border border-bone bg-white shadow-[0_12px_40px_rgba(0,0,0,0.14)] p-4"
    >
      <p className="text-[13px] font-semibold text-charcoal">Cookies</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-slate">
        We'd like to use Google Analytics cookies to understand how visitors use Solvexo. Nothing is shared for advertising.{' '}
        <Link to="/cookie-policy" className="text-brand-orange underline">Cookie policy</Link>
      </p>
      <div className="mt-3 flex gap-2 justify-end">
        <button type="button" onClick={() => choose('denied')} className="px-3.5 py-2 rounded-[10px] border border-bone text-[13px] font-medium text-charcoal hover:bg-mist cursor-pointer">
          Decline
        </button>
        <button type="button" onClick={() => choose('granted')} className="px-3.5 py-2 rounded-[10px] bg-brand-orange text-white text-[13px] font-semibold hover:opacity-90 cursor-pointer">
          Accept
        </button>
      </div>
    </div>
  );
}
