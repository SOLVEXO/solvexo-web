/**
 * What the dashboard says about whether buyers can actually shop. A store is `active` straight after onboarding,
 * but during the free trial (or once it has ended / the store is locked) checkout is closed until a plan is chosen,
 * and the storefront can be hidden behind "Coming soon" or a password. Only a public store on a plan is "live".
 */
export function storeLiveStatus(input: {
  storeStatus?: string | null;
  privacyMode?: 'public' | 'password' | 'coming_soon' | null;
  /** SellerPlatformSubscription status; undefined while it is loading. */
  planStatus?: string | null;
}): { live: boolean; label: string } {
  const { storeStatus, privacyMode, planStatus } = input;
  if (storeStatus === 'pending') return { live: false, label: 'Store is pending review' };
  if (storeStatus === 'suspended') return { live: false, label: 'Store is suspended' };
  if (storeStatus !== 'active') return { live: false, label: 'Store is not live yet' };
  if (planStatus === 'trialing' || planStatus === 'trial_ended' || planStatus === 'locked') {
    return { live: false, label: 'Not taking orders yet — choose a plan to open checkout' };
  }
  if (privacyMode === 'coming_soon') return { live: false, label: 'Storefront shows "Coming soon"' };
  if (privacyMode === 'password') return { live: false, label: 'Storefront is password protected' };
  return { live: true, label: 'Store is live' };
}
