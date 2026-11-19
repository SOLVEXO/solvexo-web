import { useState } from 'react';
import { Navigate, useParams, useSearchParams } from 'react-router-dom';
import { saveDiscountCode, safeRedirectPath } from '@/utils/discountLink';

/** `/discount/:code` — the shareable discount link. Remembers the code for checkout, then sends the visitor on (`?redirect=/path`). */
export default function DiscountLinkPage() {
  const { code } = useParams<{ code: string }>();
  const [params] = useSearchParams();
  // Saved while rendering (not in an effect) so it is stored before the redirect below can unmount this page.
  useState(() => { if (code) saveDiscountCode(code); return null; });
  return <Navigate to={safeRedirectPath(params.get('redirect'))} replace />;
}
