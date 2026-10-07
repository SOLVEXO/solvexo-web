import { StorePageHeader } from '@/components/layouts/StoreLayout';

/** Shown when a staff session has none of the permissions for any tab of a hub page. */
export function NoTabAccess({ title }: { title: string }) {
  return (
    <>
      <StorePageHeader title={title} />
      <div className="px-4 md:px-7 py-10 text-center">
        <p className="text-[14px] font-semibold text-carbon">You don't have access to this section.</p>
        <p className="text-[12.5px] text-slate mt-1">Ask the store owner to grant you the required permission.</p>
      </div>
    </>
  );
}
