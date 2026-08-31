import { createContext, useContext } from 'react';

// Default `true` ("ready, don't wait") so anything rendered outside
// PublicLayout's provider — every other layout in the app — never blocks on
// a splash that isn't even mounted there.
const BrandSplashReadyContext = createContext(true);

export const BrandSplashReadyProvider = BrandSplashReadyContext.Provider;

/** True once the one-time brand splash (if this load was ever going to show
 *  one) has fully finished. A page whose hero has a mount-triggered
 *  entrance animation should hold it behind this — otherwise the animation
 *  plays out invisibly underneath the splash overlay and only its already-
 *  settled end state is visible once the curtain lifts. */
export function useBrandSplashReady(): boolean {
  return useContext(BrandSplashReadyContext);
}
