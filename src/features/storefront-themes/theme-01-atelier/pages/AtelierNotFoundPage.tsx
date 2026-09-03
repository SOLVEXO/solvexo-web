import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import { AtelierButton } from '../components/AtelierButton';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { atelierTheme as t } from '../theme.config';

/** Real themed 404 — the storefront router's catch-all (`path: '*'`) used to
 *  blind-redirect any genuinely unmatched URL straight to the homepage via
 *  `<Navigate to="/" replace />`, silently masking a broken/mistyped link as
 *  if it worked. A real storefront (Shopify included) shows an actual "page
 *  not found" state instead. `AtelierCustomPage` reuses this same component
 *  for its own "no store page matches this slug" case, so there's exactly
 *  one 404 look across the theme, not two slightly different ones. */
export function AtelierNotFoundPage() {
  const navigate = useNavigate();
  useStorefrontSeo({ title: 'Page not found' });

  return (
    <main
      className="mx-auto flex flex-col items-center justify-center gap-5 text-center"
      style={{ minHeight: '60vh', maxWidth: t.layout.maxWidth, padding: `80px ${t.layout.containerPadX}` }}
    >
      <FileQuestion size={40} style={{ color: t.colors.inkMuted }} />
      <div className="flex flex-col gap-2">
        <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 600, color: t.colors.ink }}>
          Page not found
        </h1>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted, maxWidth: '380px' }}>
          The page you're looking for doesn't exist or may have been moved.
        </p>
      </div>
      <AtelierButton onClick={() => navigate('/')}>Back to Home</AtelierButton>
    </main>
  );
}
