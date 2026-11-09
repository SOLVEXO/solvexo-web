import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { handleOf } from '@/utils/activeStoreText';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollections } from '@/api/services/collections';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useLoad } from '../../core/pageHooks';
import { LedupBox, LedupError, LedupSkeleton } from '../ui/ledupUi';

/** `/collections`: every collection of the store. */
export function LedupCollectionsPage() {
  const { store } = useStorefront();
  useStorefrontSeo({ title: ts('nav.collections', 'Collections') });
  const { data, loading, error, retry } = useLoad(() => apiGetPublicCollections(store.storeId).then(r => r.data ?? []), [store.storeId]);

  return (
    <div className="py-16">
      <LedupBox>
        <h1 className="mb-10 text-3xl font-bold tracking-tight text-stone-900 md:text-5xl">{ts('nav.collections', 'Collections')}</h1>
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map(i => <LedupSkeleton key={i} h={220} />)}</div>
        ) : error ? (
          <LedupError message={ts('pg.we_couldn_t_load_this_collection', "We couldn't load this collection.")} onRetry={retry} />
        ) : !data || data.length === 0 ? (
          <div className="rounded-2xl border border-stone-200 bg-stone-50 p-12 text-center text-stone-500">{ts('pg.nothing_here_yet', 'Nothing here yet.')}</div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {data.map(c => (
              <Link key={c._id} to={`/collections/${handleOf(c)}`} className="ld-product-card group flex flex-col justify-between p-8 no-underline">
                <div>
                  {c.image && <div className="mb-5 aspect-[4/3] overflow-hidden rounded-xl bg-stone-50"><img src={c.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /></div>}
                  <h2 className="m-0 mb-2 text-xl font-bold text-stone-900">{c.name}</h2>
                  {c.description && <p className="m-0 line-clamp-2 text-sm text-stone-500">{c.description}</p>}
                </div>
                <span className="mt-6 inline-flex items-center gap-2 border-t border-stone-100 pt-4 text-xs font-semibold text-[var(--ld-accent)]">{ts('ld.viewAllProducts', 'View all products')} <ArrowUpRight size={14} aria-hidden /></span>
              </Link>
            ))}
          </div>
        )}
      </LedupBox>
    </div>
  );
}
