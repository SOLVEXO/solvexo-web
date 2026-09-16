import { useState, useEffect } from 'react';
import { BookmarkPlus, Play, Trash2, ChevronDown } from 'lucide-react';
import { Button, Input, Modal } from '@/components/comman/ui';
import {
  apiListSavedReports, apiCreateSavedReport, apiDeleteSavedReport,
  type SavedReport, type SellerExportParams,
} from '@/api/services/analytics/analytics';

/** Real "saved custom report" surface — a named, re-runnable filter
 *  configuration (Shopify's actual "Reports" permission, previously only
 *  the raw export button existed with no way to save a configuration for
 *  later). Deliberately its own compact panel rather than baked into the
 *  shared `AnalyticsFilterBar` (used by 5 different pages) to avoid
 *  regression risk to pages that don't need this. */
export function SavedReportsPanel({
  storeId, currentParams, onRun,
}: {
  storeId: string;
  currentParams: SellerExportParams;
  onRun: (config: SellerExportParams) => void;
}) {
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [open, setOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    apiListSavedReports(storeId).then(res => setReports(res.data)).catch(() => setReports([]));
  };

  useEffect(() => { if (storeId) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [storeId]);

  const handleSave = async () => {
    if (!name.trim()) { setError('Enter a name for this report.'); return; }
    setSaving(true);
    setError('');
    try {
      await apiCreateSavedReport(storeId, name.trim(), currentParams);
      setSaveOpen(false);
      setName('');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save report.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (reportId: string) => {
    await apiDeleteSavedReport(storeId, reportId).catch(() => {});
    load();
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" icon={<ChevronDown size={13} />} onClick={() => setOpen(o => !o)}>
          Saved Reports {reports.length > 0 ? `(${reports.length})` : ''}
        </Button>
        <Button variant="outline" size="sm" icon={<BookmarkPlus size={13} />} onClick={() => { setSaveOpen(true); setError(''); }}>
          Save current filters
        </Button>
      </div>

      {open && (
        <div className="absolute z-10 mt-2 w-72 bg-white border border-bone rounded-[10px] shadow-lg overflow-hidden">
          {reports.length === 0 ? (
            <p className="px-4 py-3 text-[12px] text-slate">No saved reports yet.</p>
          ) : (
            <div className="max-h-[260px] overflow-y-auto">
              {reports.map(r => (
                <div key={r._id} className="flex items-center justify-between gap-2 px-3 py-2.5 border-b border-bone last:border-b-0">
                  <span className="text-[12.5px] font-medium text-charcoal truncate flex-1">{r.name}</span>
                  <button
                    onClick={() => { onRun(r.config); setOpen(false); }}
                    className="p-1 text-brand-orange bg-transparent border-none cursor-pointer"
                    title="Run this report"
                  >
                    <Play size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(r._id)}
                    className="p-1 text-error bg-transparent border-none cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {saveOpen && (
        <Modal
          title="Save current filters as a report"
          onClose={() => setSaveOpen(false)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setSaveOpen(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
            </>
          }
        >
          {error && <p className="text-[12px] text-error mb-3">{error}</p>}
          <Input placeholder="e.g. Monthly Revenue Snapshot" value={name} onChange={e => setName(e.target.value)} />
        </Modal>
      )}
    </div>
  );
}
