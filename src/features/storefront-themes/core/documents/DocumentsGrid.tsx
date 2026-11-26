import { useEffect, useState } from 'react';
import { Download, Eye, FileText } from 'lucide-react';
import { apiListPublicStoreDocuments, storeDocumentCategoryLabel, storeDocumentMeta, type StoreDocumentFile } from '@/api/services/storeDocuments';
import { useStorefront } from '@/features/storefront/StorefrontContext';

type Colors = { bg: string; ink: string; border: string; accent?: string; muted?: string };

/** Section wrapper: reads the current store from context, then renders the grid. */
export function DocumentsGridSection({ settings, colors }: { settings: Record<string, unknown>; colors: Colors }) {
  const { store } = useStorefront();
  const s = settings ?? {};
  return (
    <DocumentsGrid
      storeId={store.storeId}
      category={s.category ? String(s.category) : undefined}
      columns={Number(s.columns) || undefined}
      showDescription={s.showDescription === true}
      colors={colors}
    />
  );
}

/** The store's Documents library as cards. Shared by every theme — each theme only passes its colours. */
export function DocumentsGrid({ storeId, category, columns, showDescription, colors }: {
  storeId: string;
  category?: string;
  columns?: number;
  showDescription?: boolean;
  colors: Colors;
}) {
  const [items, setItems] = useState<StoreDocumentFile[] | null>(null);
  useEffect(() => {
    let alive = true;
    apiListPublicStoreDocuments(storeId, category || undefined)
      .then(rows => { if (alive) setItems(rows); })
      .catch(() => { if (alive) setItems([]); });
    return () => { alive = false; };
  }, [storeId, category]);

  const cols = Math.min(4, Math.max(2, columns || 3));
  const accent = colors.accent || colors.ink;

  if (items === null) return <div style={{ padding: '24px 0', color: colors.muted || colors.ink, opacity: 0.6 }}>Loading…</div>;
  if (items.length === 0) return null;

  return (
    <div style={{ display: 'grid', gap: 16, gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, ${cols === 2 ? 320 : 240}px), 1fr))` }}>
      {items.map(doc => (
        <div key={doc._id} style={{ border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden', background: colors.bg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ aspectRatio: '4 / 3', background: colors.muted || colors.bg, display: 'grid', placeItems: 'center' }}>
            {doc.coverUrl
              ? <img src={doc.coverUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <FileText size={26} style={{ color: colors.muted || colors.ink, opacity: 0.5 }} />}
          </div>
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: colors.ink }}>{doc.title}</p>
            <p style={{ margin: 0, fontSize: 11.5, color: colors.muted || colors.ink, opacity: 0.7 }}>
              {storeDocumentCategoryLabel(doc.category)}{storeDocumentMeta(doc) ? ` · ${storeDocumentMeta(doc)}` : ''}
            </p>
            {showDescription && doc.description ? (
              <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.muted || colors.ink, opacity: 0.8 }}>{doc.description}</p>
            ) : null}
            <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
              <a href={`/documents/${doc._id}/view`} target="_blank" rel="noreferrer"
                style={{ flex: 1, textAlign: 'center', padding: '8px 10px', borderRadius: 8, border: `1px solid ${colors.border}`, fontSize: 12.5, color: colors.ink, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Eye size={13} /> View
              </a>
              <a href={`/documents/${doc._id}/download`} download
                style={{ flex: 1, textAlign: 'center', padding: '8px 10px', borderRadius: 8, border: 'none', background: accent, color: colors.bg, fontSize: 12.5, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <Download size={13} /> Download
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}