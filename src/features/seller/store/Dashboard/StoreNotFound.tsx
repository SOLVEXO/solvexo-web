import { FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import { Button } from '@/components/comman/ui/Button';

// Catch-all for an unmapped `/store/:storeId/*` sub-route (bookmark, stale
// link, typo) — mirrors the storefront's own real not-found state
// (`StorefrontCustomPage`) instead of leaving the content area blank with
// the sidebar/header still shown and no way back.
export default function StoreNotFound() {
  const navigate = useNavigate();
  const { storeId } = useStoreWorkspace();
  return (
    <>
      <StorePageHeader title="Page not found" />
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-16 px-4">
        <FileQuestion size={40} className="text-bone" />
        <p className="text-[14px] text-slate">This page doesn't exist.</p>
        <Button size="sm" onClick={() => navigate(`/store/${storeId}/dashboard`)}>Back to Dashboard</Button>
      </div>
    </>
  );
}
