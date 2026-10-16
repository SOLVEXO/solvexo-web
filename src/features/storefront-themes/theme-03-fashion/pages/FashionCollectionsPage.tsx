import { Link } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollections } from '@/api/services/collections';
import { useLocalize } from '@/hooks/useLocalize';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { ErrorBlock, PageBox, PageSkeleton } from './pageParts';
import { useLoad } from '../../core/pageHooks';

/** `/collections` — every collection as an image tile. */
export function FashionCollectionsPage() {
  const { store } = useStorefront();
  const localize = useLocalize();
  const { data, loading, error, retry } = useLoad(() => apiGetPublicCollections(store.storeId).then(r => r.data ?? []), [store.storeId]);
  useStorefrontSeo({ title: 'Collections' });

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorBlock message="We couldn't load the collections." onRetry={retry} />;
  const list = (data ?? []).map(c => localize.collection(c));
  return (
    <PageBox>
      <h1 className="m-0 mb-8 text-[clamp(28px,4vw,48px)] font-medium leading-[1.1] tracking-tight">Collections</h1>
      {list.length === 0 ? <p className="m-0 text-base" style={{ color: t.colors.inkMuted }}>No collections yet.</p> : (
        <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {list.map(c => (
            <li key={c._id}>
              <Link to={`/collections/${c.slug || c._id}`} className="group relative block overflow-hidden no-underline" style={{ aspectRatio: '4 / 5', background: t.colors.bgAlt, borderRadius: 24 }}>
                {c.image && <img src={c.image} alt="" loading="lazy" className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105" />}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,0) 55%)' }} />
                <div className="absolute inset-x-0 bottom-0 p-6 text-white"><h2 className="m-0 text-2xl font-medium">{c.name}</h2></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageBox>
  );
}
