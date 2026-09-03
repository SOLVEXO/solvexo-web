import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { NovaButton } from '../components/NovaButton';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { novaTheme as t } from '../theme.config';

/** Real themed 404 — same rationale as `AtelierNotFoundPage`'s doc comment
 *  (the storefront catch-all used to silently redirect a broken link to the
 *  homepage instead of showing a real not-found state). Nova doesn't have
 *  its own `customPage`/`account`/etc. implementations yet (see
 *  `registry.ts`'s disclosed 7/17 route count) — this page is still real and
 *  independent, not a fallback, since a genuinely unmatched URL is a
 *  first-class case any theme should own. */
export function NovaNotFoundPage() {
  const navigate = useNavigate();
  useStorefrontSeo({ title: 'Page not found' });

  return (
    <main
      className="mx-auto flex flex-col items-center justify-center gap-5 text-center"
      style={{ minHeight: '60vh', maxWidth: t.layout.maxWidth, padding: `80px ${t.layout.containerPadX}` }}
    >
      <FileQuestion size={40} style={{ color: t.colors.inkMuted }} />
      <div className="flex flex-col gap-2">
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: t.colors.ink }}>
          Page not found
        </h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, maxWidth: '380px' }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
      </div>
      <NovaButton onClick={() => navigate('/')}>Back to Home</NovaButton>
    </main>
  );
}
