import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useJsonLd } from '../../core/hooks/useJsonLd';
import { breadcrumbJsonLd, collectionJsonLd, pageUrlBuilder, type ListProduct } from '../../core/seo/jsonLd';
import { ts } from '@/utils/tStatic';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionBySlug } from '@/api/services/collections';
import { useLocalize } from '@/hooks/useLocalize';
import { renderRichText } from '@/utils/richText';
import { FashionSectionRenderer } from '../sections';
import { CollectionScopeContext } from '../sections/collectionScope';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { FashionNotFoundPage } from './FashionNotFoundPage';
import { ErrorBlock, PageBox, PageSkeleton } from './pageParts';
import { useLoad, useTemplateSections } from '../../core/pageHooks';
import { FashionProductBrowser } from '../components/browse/FashionProductBrowser';
import { FashionProductCard } from '../components/FashionProductCard';

/** `/collections/:slugOrId` — banner, then the seller's collection template (which holds the product grid). */
export function FashionCollectionPage() {
  const { slugOrId = '' } = useParams();
  const { store } = useStorefront();
  const localize = useLocalize();
  const { data, loading, error, retry } = useLoad(
    () => apiGetPublicCollectionBySlug(store.storeId, slugOrId).then(r => r.data).catch((e: { status?: number }) => { if (e?.status === 404) return null; throw e; }),
    [store.storeId, slugOrId],
  );
  const sections = useTemplateSections(store.storeId, 'collection', data?.templateKey || 'default');
  const collection = data ? localize.collection(data) : null;
  useStorefrontSeo({ title: collection?.seo?.metaTitle || collection?.name, description: collection?.seo?.metaDescription || collection?.description, image: collection?.image });

  const [listed, setListed] = useState<{ key: string; items: ListProduct[] }>({ key: '', items: [] });
  const scope = useMemo(() => ({ collectionId: data?._id, onProducts: (items: ListProduct[]) => setListed({ key: slugOrId, items }) }), [data?._id, slugOrId]);
  const { origin, pathname } = window.location;
  const urlFor = pageUrlBuilder(origin, pathname);
  const pageUrl = `${origin}${pathname}`;
  useJsonLd('collection', collection ? collectionJsonLd({
    name: collection.name, description: collection.description, image: collection.image, url: pageUrl, origin, urlFor,
    products: listed.key === slugOrId ? listed.items : [],
  }) : null);
  useJsonLd('breadcrumb', collection ? breadcrumbJsonLd([{ name: store.name, url: urlFor('/') }, { name: collection.name, url: pageUrl }]) : null);

  if (loading) return <PageSkeleton />;
  if (error) return <ErrorBlock message={ts('pg.we_couldn_t_load_this_collection', 'We couldn\'t load this collection.')} onRetry={retry} />;
  if (!data || !collection) return <FashionNotFoundPage />;

  const hasGrid = sections.some(s => s.type === 'collection_product_grid');
  return (
    <CollectionScopeContext.Provider value={scope}>
      <PageBox padY={false}>
        <header className="relative mt-3 grid overflow-hidden" style={{ borderRadius: 28, background: t.colors.bgAlt, minHeight: collection.image ? 'clamp(220px, 34vh, 340px)' : undefined }}>
          {collection.image && <img src={collection.image} alt="" className="absolute inset-0 size-full object-cover" />}
          {collection.image && <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.55), rgba(0,0,0,.1) 70%)' }} />}
          <div className={`${collection.image ? 'fx-on-image ' : ''}relative z-10 self-end p-6 md:p-10`} style={{ color: collection.image ? '#fff' : t.colors.ink }}>
            <h1 className="m-0 text-[clamp(30px,4.6vw,56px)] font-medium leading-[1.05] tracking-tight">{collection.name}</h1>
            {collection.description && <div className="mt-3 max-w-[620px] text-base leading-relaxed opacity-90">{renderRichText(collection.description)}</div>}
          </div>
        </header>
      </PageBox>
      {sections.length > 0 && hasGrid ? <FashionSectionRenderer sections={sections} /> : (
        <>
          <PageBox>
            <FashionProductBrowser renderCard={(p, c) => <FashionProductCard product={p} currency={c} />} collectionId={data._id} onProducts={scope.onProducts} syncUrl defaultSort={data.defaultSort as never} />
          </PageBox>
          {sections.length > 0 && <FashionSectionRenderer sections={sections} />}
        </>
      )}
    </CollectionScopeContext.Provider>
  );
}
