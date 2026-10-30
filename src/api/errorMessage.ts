/** The message a failed API call should show: the server's own text first, then the error's, then the fallback. */
export function errorMessage(e: unknown, fallback = 'Something went wrong'): string {
  const x = e as { response?: { data?: { message?: unknown } }; message?: unknown } | null;
  const fromServer = x?.response?.data?.message;
  if (typeof fromServer === 'string' && fromServer) return fromServer;
  if (Array.isArray(fromServer) && typeof fromServer[0] === 'string') return fromServer[0];
  return typeof x?.message === 'string' && x.message ? x.message : fallback;
}
