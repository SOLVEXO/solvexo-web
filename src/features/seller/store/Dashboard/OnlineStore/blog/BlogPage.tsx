import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { BlogTab } from '../builder/BlogTab';

/** Thin wrapper around the pre-existing `BlogTab` — now its own top-level
 *  "Online Store" surface instead of a tab buried inside Store Builder. */
export function BlogPage() {
  const { storeId, store, loading: storeLoading } = useStoreWorkspace();

  if (storeLoading || !store) {
    return (
      <div className="p-7 flex flex-col gap-4">
        <SkeletonBox width={240} height={22} rounded="6px" />
        <SkeletonBox height={44} rounded="10px" />
        <SkeletonBox height={400} rounded="16px" />
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F5] min-h-full">
      <StorePageHeader
        title="Blog"
        subtitle="Write and publish posts on your storefront."
      />
      <div className="px-4 lg:px-7 py-5">
        <BlogTab storeId={storeId} />
      </div>
    </div>
  );
}
