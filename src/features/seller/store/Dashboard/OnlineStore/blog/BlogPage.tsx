import { useState } from 'react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { SkeletonBox } from '@/components/comman/ui';
import { BlogTab } from '../builder/BlogTab';
import { BulkImportButton } from '@/components/comman/bulk-import/BulkImportButton';

/** Thin wrapper around the pre-existing `BlogTab` — now its own top-level
 *  "Online Store" surface instead of a tab buried inside Store Builder. */
export function BlogPage() {
  const { storeId, store, loading: storeLoading } = useStoreWorkspace();
  const [reloadKey, setReloadKey] = useState(0);

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
        actions={(
          <BulkImportButton
            entityLabel="blog posts"
            basePath={`/api/store-blog/${storeId}/posts`}
            onImported={() => setReloadKey(k => k + 1)}
            notes={[
              'Body is plain text (blank line = new paragraph); HTML tags are stripped. Add images, headings and lists in the editor.',
              'The Blog column must name an existing blog; leave it blank for the default blog.',
            ]}
          />
        )}
      />
      <div className="px-4 lg:px-7 py-5">
        <BlogTab key={reloadKey} storeId={storeId} />
      </div>
    </div>
  );
}
