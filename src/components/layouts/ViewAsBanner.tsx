import { Eye } from 'lucide-react';
import { isViewingAsAdmin, viewAsStoreName, exitViewAsStore } from '@/utils/viewAsStore';

/** Shown on every store page while an admin looks at the store in read-only mode. */
export function ViewAsBanner() {
  if (!isViewingAsAdmin()) return null;
  const exit = () => { exitViewAsStore(); window.location.assign('/admin/clients'); };
  return (
    <div role="status" className="bg-charcoal text-white text-[12.5px] px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
      <span className="inline-flex items-center gap-2"><Eye size={14} /> Viewing <b>{viewAsStoreName() || 'this store'}</b> as admin — read only, nothing can be changed.</span>
      <button type="button" onClick={exit} className="px-3 py-1 rounded-md bg-white text-charcoal font-semibold cursor-pointer">Exit</button>
    </div>
  );
}
