import { useEffect, useRef, useState } from 'react';
import { apiGetLinkPreview, type LinkPreviewData } from '@/api/services/messaging';

// Matches the composer's typed text as the sender types/pastes a link — same
// "resolve before send, sender can dismiss" flow WhatsApp/Instagram use.
// Deliberately only ever looks at the FIRST URL in the text (matches real
// WhatsApp behavior — a message with several links still only unfurls one).
const URL_RE = /(https?:\/\/[^\s]+)/i;
const DEBOUNCE_MS = 500;

export function useLinkPreviewDraft(text: string) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissedUrl, setDismissedUrl] = useState<string | null>(null);
  const requestId = useRef(0);

  useEffect(() => {
    const match = text.match(URL_RE);
    const url = match?.[0] ?? null;

    if (!url) {
      setPreview(null);
      setLoading(false);
      return;
    }
    if (url === dismissedUrl) { setPreview(null); return; }
    if (preview?.url === url) return; // already resolved this exact URL

    const thisRequest = ++requestId.current;
    const timer = setTimeout(() => {
      setLoading(true);
      apiGetLinkPreview(url)
        .then(res => { if (requestId.current === thisRequest) setPreview(res); })
        .catch(() => { if (requestId.current === thisRequest) setPreview(null); })
        .finally(() => { if (requestId.current === thisRequest) setLoading(false); });
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  function dismiss() {
    if (preview) setDismissedUrl(preview.url);
    setPreview(null);
  }

  function reset() {
    setPreview(null);
    setDismissedUrl(null);
    setLoading(false);
  }

  return { preview, loading, dismiss, reset };
}
