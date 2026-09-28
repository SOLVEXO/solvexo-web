/** Shared by the seller's Subscribers page and the admin Newsletter page. */

export const SUBSCRIBER_SOURCE_LABEL: Record<string, string> = {
  store_footer:    'Storefront footer',
  store_section:   'Newsletter section',
  checkout:        'Checkout',
  seller:          'Added by you',
  import:          'Imported',
  platform_footer: 'Solvexo website',
  footer:          'Footer (legacy)',
};

export function fmtSubscriberDate(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function errMsg(err: unknown, fallback: string) {
  return err instanceof Error && err.message ? err.message : fallback;
}
