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
 * Shared by `BuilderPreview.tsx` (real-data preview) and `ThemePreviewPage.tsx`
 * (demo-data theme preview) — extracted so neither duplicates this.
 */
export function DeviceFrame({ width, children }: { width: number; children: React.ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [mountNode, setMountNode] = useState<HTMLElement | null>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
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
      iframe.removeEventListener('load', copyStylesAndMount);
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <iframe ref={iframeRef} title="Storefront preview" style={{ width, height: '100%', border: 'none', display: 'block' }} />
      {mountNode && createPortal(children, mountNode)}
    </>
  );
}
