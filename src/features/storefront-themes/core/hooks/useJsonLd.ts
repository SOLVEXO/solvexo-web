import { useEffect } from 'react';

/** Puts a schema.org JSON-LD block in <head> (search engines read it for rich results) and removes it when the page changes. */
export function useJsonLd(id: string, data: Record<string, unknown> | null) {
  const json = data ? JSON.stringify(data) : null;
  useEffect(() => {
    if (!json) return;
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id = `ld-${id}`;
    el.text = json.replace(/</g, '\\u003c'); // never lets text close the script tag
    document.head.appendChild(el);
    return () => { el.remove(); };
  }, [id, json]);
}
