import type { ReactNode } from 'react';
import { ssrSnapshot } from '@/utils/ssrSnapshot';

/** A Suspense fallback that keeps showing the server-rendered page while the app's code loads; `fallback` when there is none. */
export function SsrSnapshot({ fallback }: { fallback: ReactNode }) {
  const html = ssrSnapshot();
  // The page's own server-rendered markup (see utils/ssrSnapshot.ts), never anything typed by a visitor.
  return html ? <div data-sx-snapshot="" dangerouslySetInnerHTML={{ __html: html }} /> : <>{fallback}</>;
}
