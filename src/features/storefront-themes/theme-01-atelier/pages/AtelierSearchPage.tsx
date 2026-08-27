import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AtelierProductGrid } from '../components/AtelierProductGrid';
import { atelierTheme as t } from '../theme.config';

/** `/search?q=` — the navbar search box's results, scoped through the same
 *  `AtelierProductGrid` Category/Collection use. */
export function AtelierSearchPage() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') ?? '';
  usePageTitle(q ? `"${q}"` : 'Search');

  if (!q.trim()) {
    return (
      <div style={{ padding: '96px 20px', textAlign: 'center' }}>
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted }}>Type something to search this store.</p>
      </div>
    );
  }

  return (
    <main className="mx-auto" style={{ maxWidth: t.layout.maxWidth, padding: `40px ${t.layout.containerPadX}` }}>
      <AtelierProductGrid heading={`Results for "${q}"`} search={q} />
    </main>
  );
}
