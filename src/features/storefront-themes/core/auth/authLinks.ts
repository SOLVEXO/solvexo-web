/** `/path` plus `?redirect=` when the buyer was sent here from somewhere other than the home page. */
export function withRedirect(path: string, redirectTo: string): string {
  return redirectTo !== '/' ? `${path}?redirect=${encodeURIComponent(redirectTo)}` : path;
}

export const OTP_LENGTH = 6;
