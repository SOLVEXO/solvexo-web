import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Eye, Loader2 } from 'lucide-react';
import { useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { useToast } from '@/contexts/ToastContext';
import { apiCreatePreviewLink } from '@/api/services/storeTheme';

/**
 * The slim top bar for the dedicated fullscreen theme editor (Customize /
 * Header & Footer / Edit Code — see `ThemeEditorLayout.tsx`). Replaces each
 * page's previous use of the dashboard's `StorePageHeader` — same title/
 * subtitle/actions shape, but with an explicit "← Themes" exit control and
 * none of `StorePageHeader`'s dashboard-specific chrome (store switcher,
 * notification bell, mobile drill-back-to-dashboard button).
 *
 * Deliberately a pure shell: every button/handler a page passes as
 * `children` is that page's own existing, untouched logic — this component
 * only supplies the exit link, title/subtitle, and the sticky slim-bar
 * layout, so no editor behavior is duplicated or reimplemented here.
 */
export function EditorTopBar({ exitTo, title, subtitle, children }: {
  exitTo: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  const { store } = useStoreWorkspace();

  // Same real per-store browser-tab title `StorePageHeader` set — restores
  // "Solvexo" on unmount, identical convention.
  useEffect(() => {
    document.title = `${store?.name || 'Solvexo'} - ${title}`;
    return () => { document.title = 'Solvexo'; };
  }, [store?.name, title]);

  return (
    <div className="bg-white border-b border-bone px-4 md:px-6 py-2.5 flex items-center gap-3 flex-wrap justify-between sticky top-0 z-10 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <Link
          to={exitTo}
          className="shrink-0 flex items-center gap-1.5 text-[12.5px] font-semibold text-charcoal no-underline px-2.5 py-[7px] rounded-lg border border-bone bg-white hover:bg-cream"
          title="Exit editor — back to Themes"
        >
          <ArrowLeft size={14} /> Themes
        </Link>
        <div className="min-w-0">
          <p className="text-[13.5px] font-bold text-charcoal truncate leading-tight">{title}</p>
          {subtitle && <p className="text-[11px] text-slate truncate leading-tight">{subtitle}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap justify-end min-w-0">
        {children}
      </div>
    </div>
  );
}

/**
 * Opens the store's real, already-built "Share Preview" link (see
 * `ThemeLibraryPage.tsx`'s `SharePreviewModal`, which mints the identical
 * token) directly in a new tab — reused here, not duplicated, as the
 * editor top bar's "Preview" action. Disclosed, real scope limit (same one
 * `SharePreviewModal` already discloses): this shows the draft's theme
 * colors/header/footer over sample content, not the seller's live product
 * catalog — there is no broader "preview this exact draft page" session
 * mechanism yet for Home/Product/Collection/etc. section content, and
 * building one is out of scope for this pass (shell/chrome only).
 */
export function PreviewButton({ storeId, installedThemeId }: { storeId: string; installedThemeId?: string }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await apiCreatePreviewLink(storeId, installedThemeId);
      window.open(`${window.location.origin}/theme-preview/${storeId}/${res.data.token}`, '_blank', 'noopener');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open preview.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      title="Preview your draft theme colors, header & footer over sample content in a new tab (not your live product catalog)"
      className="shrink-0 flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal disabled:opacity-60 cursor-pointer"
    >
      {loading ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />} Preview
    </button>
  );
}
