import { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Renders `children` inside a real `<iframe>` (not just a width-constrained
 * div) so a Tablet/Mobile preview actually triggers the storefront's own
 * responsive breakpoints — Tailwind's `sm:`/`md:`/`lg:` classes respond to
 * the *viewport* width, which a shrunk container alone can't fake; an iframe
 * gets its own real, independent viewport. Every stylesheet/style tag from
 * the host page is cloned into the iframe's document once it loads, and
 * content is portaled into its body — React context (cart/wishlist/currency/
 * auth-gate, all provided above the router) still flows through normally,
 * since a portal only changes *where in the DOM* something renders, not its
 * position in the React tree.
 *
 * Shared by `LivePreviewPage.tsx` (real-data preview) and `ThemePreviewPage.tsx`
 * (demo-data theme preview) — extracted so neither duplicates this.
 */
// If the iframe hasn't produced a usable document by this point, something
// genuinely unusual happened (not just "load hasn't fired yet" — both the
// `load` listener and the immediate `readyState==='complete'` check below
// already cover that race normally). Rather than leave the preview silently
// blank forever with no explanation, surface it.
const MOUNT_TIMEOUT_MS = 5000;

export function DeviceFrame({ width, children }: { width: number; children: React.ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);
  const [mountFailed, setMountFailed] = useState(false);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setMountFailed(false);

    const timeoutId = window.setTimeout(() => setMountFailed(true), MOUNT_TIMEOUT_MS);

    // Vite's dev server injects/replaces <style>/<link> tags into the main
    // document lazily as more components/routes are touched — a one-time
    // clone at iframe-load only captured whatever existed at that instant,
    // so the preview would silently drift out of sync with real styling
    // (utility classes used for the first time later never made it in).
    // A MutationObserver on the main document's <head> keeps re-cloning
    // anything new into the iframe for as long as it's mounted.
    const cloneNode = (node: Element) => {
      const doc = iframe.contentDocument;
      if (doc) doc.head.appendChild(node.cloneNode(true));
    };
    const copyStylesAndMount = () => {
      const doc = iframe.contentDocument;
      if (!doc) return;
      doc.head.innerHTML = '';
      document.querySelectorAll('style, link[rel="stylesheet"]').forEach(cloneNode);
      doc.body.style.margin = '0';
      window.clearTimeout(timeoutId);
      setMountFailed(false);
      setMountNode(doc.body);
    };
    iframe.addEventListener('load', copyStylesAndMount);
    if (iframe.contentDocument?.readyState === 'complete') copyStylesAndMount();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element && (node.tagName === 'STYLE' || (node.tagName === 'LINK' && node.getAttribute('rel') === 'stylesheet'))) {
            cloneNode(node);
          }
        }
      }
    });
    observer.observe(document.head, { childList: true });

    return () => {
      window.clearTimeout(timeoutId);
      iframe.removeEventListener('load', copyStylesAndMount);
      observer.disconnect();
    };
  }, []);

  return (
    <div style={{ position: 'relative', width, height: '100%' }}>
      <iframe ref={iframeRef} title="Storefront preview" style={{ width, height: '100%', border: 'none', display: 'block' }} />
      {mountNode && createPortal(children, mountNode)}
      {!mountNode && mountFailed && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <p className="text-[13px] text-slate px-6 text-center">
            The preview didn't load. Try reopening this tab — if it keeps happening, your browser may be blocking the preview frame.
          </p>
        </div>
      )}
    </div>
  );
}
