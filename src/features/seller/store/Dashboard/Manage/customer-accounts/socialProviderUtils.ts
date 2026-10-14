export type ProviderState = 'connected' | 'attention' | 'not_connected';

export function providerState(status: 'connected' | 'not_connected', lastError: string | null): ProviderState {
  if (status !== 'connected') return 'not_connected';
  return lastError ? 'attention' : 'connected';
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}
