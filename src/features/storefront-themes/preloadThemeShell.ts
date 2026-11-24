import { ssrRouteFor } from './ssrRoutes';
import type { StorefrontRouteKey } from './registry';

/**
 * Starts downloading a theme's layout + the chunk of the page being opened before the router needs them, so the screen is
 * not blank while they arrive. Kept free of any import of the registry's code on purpose (type import only): the router calls
 * this at boot on a store host, and pulling the registry in would put every theme into the main bundle.
 * Pages bundled with the storefront already (most of Maison's) need nothing here.
 */
type Loader = () => Promise<unknown>;

const SHELLS: Record<string, Loader[]> = {
  'theme-04-tech': [
    () => import('./theme-04-tech/layout/TechLayout'),
    () => import('./theme-04-tech/pages/TechContentPages'),
  ],
  'theme-05-ledup': [
    () => import('./theme-05-ledup/layout/LedupLayout'),
    () => import('./theme-05-ledup/pages/LedupContentPages'),
  ],
};

/** Page chunks that are NOT part of the shell, by route. Must match the lazy imports in `registry.ts`. */
const PAGE_CHUNKS: Record<string, Partial<Record<StorefrontRouteKey, Loader>>> = {
  'theme-03-fashion': {
    blogIndex: () => import('./theme-03-fashion/pages/FashionBlogIndexPage'),
    blogPost: () => import('./theme-03-fashion/pages/FashionBlogPostPage'),
    faqs: () => import('./theme-03-fashion/pages/FashionFaqsPage'),
    customPage: () => import('./theme-03-fashion/pages/FashionCustomPage'),
  },
  'theme-04-tech': {
    product: () => import('./theme-04-tech/pages/TechProductPage'),
    collection: () => import('./theme-04-tech/pages/TechListingPages'),
    category: () => import('./theme-04-tech/pages/TechListingPages'),
    collections: () => import('./theme-04-tech/pages/TechCollectionsPage'),
    blogIndex: () => import('./theme-04-tech/pages/TechBlogIndexPage'),
    blogPost: () => import('./theme-04-tech/pages/TechBlogPostPage'),
    faqs: () => import('./theme-04-tech/pages/TechFaqsPage'),
  },
  'theme-05-ledup': {
    product: () => import('./theme-05-ledup/pages/LedupProductPage'),
    collection: () => import('./theme-05-ledup/pages/LedupListingPages'),
    category: () => import('./theme-05-ledup/pages/LedupListingPages'),
    collections: () => import('./theme-05-ledup/pages/LedupCollectionsPage'),
    blogIndex: () => import('./theme-05-ledup/pages/LedupBlogFaqPages'),
    blogPost: () => import('./theme-05-ledup/pages/LedupBlogFaqPages'),
    faqs: () => import('./theme-05-ledup/pages/LedupBlogFaqPages'),
  },
};

const started = new Map<string, Promise<unknown>>();

function once(key: string, load: Loader): Promise<unknown> {
  let p = started.get(key);
  if (!p) {
    p = load().catch(() => { started.delete(key); });
    started.set(key, p);
  }
  return p;
}

/** Resolves when the theme's layout and (given an address) the page it opens are loaded. Never rejects. */
export function preloadThemeShell(themeId: string | null | undefined, path?: string): Promise<void> {
  if (!themeId) return Promise.resolve();
  const jobs: Promise<unknown>[] = (SHELLS[themeId] ?? []).map((load, i) => once(`${themeId}#shell${i}`, load));
  const key = path ? ssrRouteFor(path)?.key : undefined;
  const page = key ? PAGE_CHUNKS[themeId]?.[key] : undefined;
  if (page && key) jobs.push(once(`${themeId}#${key}`, page));
  return Promise.all(jobs).then(() => undefined);
}
