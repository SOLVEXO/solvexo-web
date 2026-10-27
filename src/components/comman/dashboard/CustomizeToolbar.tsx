import { useState } from 'react';
import { LayoutTemplate, Plus, RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Modal } from '@/components/comman/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import type { DashboardLayoutApi } from './useDashboardLayout';
import type { DashboardPreset, DashboardWidgetDef } from './dashboardTypes';
import { WidgetLibraryDrawer } from './WidgetLibraryDrawer';

const btn = 'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg border border-bone bg-white text-[12.5px] font-semibold text-carbon hover:bg-fog cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange';

/** The "Customize dashboard" button (normal mode). */
export function CustomizeButton({ layout }: { layout: DashboardLayoutApi }) {
  return (
    <button type="button" onClick={layout.startEdit} disabled={layout.loading} aria-label="Customize dashboard" className={btn}>
      <SlidersHorizontal size={14} /> Customize<span className="hidden md:inline"> dashboard</span>
    </button>
  );
}

/** The editing bar (customize mode only): presets, add widget, reset, unsaved indicator, Cancel and Save. */
export function CustomizeToolbar({ layout, defs, presets }: { layout: DashboardLayoutApi; defs: DashboardWidgetDef[]; presets: DashboardPreset[] }) {
  const toast = useToast();
  const [library, setLibrary] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [pendingPreset, setPendingPreset] = useState<DashboardPreset | null>(null);

  const choosePreset = (p: DashboardPreset) => (layout.dirty ? setPendingPreset(p) : layout.applyPreset(p));

  const onSave = async () => { if (await layout.save()) toast.success('Dashboard layout saved'); else toast.error('Could not save your layout. Try again.'); };
  const onReset = async () => { if (await layout.reset()) { setConfirmReset(false); toast.success('Dashboard reset to the default layout'); } else setConfirmReset(false); };

  return (
    <>
      <div className="sticky top-2 z-20 rounded-2xl border border-bone bg-white px-4 py-3 flex flex-col gap-2 shadow-sm" role="region" aria-label="Customize dashboard">
        <div className="flex flex-wrap items-center gap-2">
          <div className="mr-auto min-w-0">
            <p className="text-[13.5px] font-semibold text-carbon">Customize dashboard</p>
            <p className="text-[12px] text-slate">Drag the handle or use the arrows to reorder. Use the eye to hide, the cross to remove.</p>
          </div>
          {layout.dirty && <span className="text-[12px] font-semibold text-[#B45309] bg-[#FEF3C7] rounded-full px-2.5 py-1" role="status">Unsaved changes</span>}
          <label className="inline-flex items-center gap-1.5 text-[12px] text-slate">
            <LayoutTemplate size={14} />
            <span className="sr-only">Layout preset</span>
            <select
              aria-label="Layout preset"
              value={layout.preset ?? ''}
              onChange={(e) => { const p = presets.find(x => x.id === e.target.value); if (p) choosePreset(p); }}
              className="h-8 rounded-lg border border-bone bg-white text-[12.5px] font-semibold text-carbon px-2 cursor-pointer"
            >
              <option value="" disabled>Presets…</option>
              {presets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <button type="button" className={btn} onClick={() => setLibrary(true)}><Plus size={14} /> Add widget</button>
          <button type="button" className={btn} onClick={() => setConfirmReset(true)} disabled={layout.saving}><RotateCcw size={14} /> Reset</button>
          <button type="button" className={btn} onClick={layout.cancel} disabled={layout.saving}>Cancel</button>
          <button type="button" onClick={onSave} disabled={layout.saving || !layout.dirty}
            className="inline-flex items-center h-8 px-3.5 rounded-lg border-0 bg-carbon text-white text-[12.5px] font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange">
            {layout.saving ? 'Saving…' : 'Save layout'}
          </button>
        </div>
        {layout.saveError && <p className="text-[12px] text-error" role="alert">{layout.saveError}</p>}
      </div>

      {library && <WidgetLibraryDrawer defs={defs} layout={layout} onClose={() => setLibrary(false)} />}

      {confirmReset && (
        <Modal title="Reset dashboard?" onClose={() => setConfirmReset(false)} width={420}
          footer={<div className="flex justify-end gap-2"><button type="button" className={btn} onClick={() => setConfirmReset(false)}>Keep my layout</button><button type="button" className={btn} onClick={onReset} disabled={layout.saving}>Reset to default</button></div>}>
          <p className="text-[13px] text-graphite">Your saved layout will be deleted and the default dashboard comes back. This cannot be undone.</p>
        </Modal>
      )}

      {pendingPreset && (
        <Modal title={`Use the “${pendingPreset.label}” preset?`} onClose={() => setPendingPreset(null)} width={420}
          footer={<div className="flex justify-end gap-2"><button type="button" className={btn} onClick={() => setPendingPreset(null)}>Cancel</button><button type="button" className={btn} onClick={() => { layout.applyPreset(pendingPreset); setPendingPreset(null); }}>Replace my changes</button></div>}>
          <p className="text-[13px] text-graphite">{pendingPreset.description} This replaces the unsaved changes on screen. Nothing is saved until you press Save layout.</p>
        </Modal>
      )}
    </>
  );
}
