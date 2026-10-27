import { useRef, useState, type DragEvent, type ReactNode } from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, GripVertical, Settings2, X } from 'lucide-react';
import { clsx } from 'clsx';
import type { DashboardLayoutApi } from './useDashboardLayout';
import { SIZE_CLASS, SIZE_LABEL, type DashboardWidgetDef, type LayoutWidget } from './dashboardTypes';

interface Props {
  defs: DashboardWidgetDef[];
  layout: DashboardLayoutApi;
  /** Renders the widget's normal content. Returning null (a self-hiding card) collapses the cell outside customize mode. */
  renderWidget: (def: DashboardWidgetDef, widget: LayoutWidget) => ReactNode;
}

const iconBtn = 'size-7 inline-flex items-center justify-center rounded-md border-0 bg-transparent text-slate hover:bg-fog hover:text-carbon cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-orange';

/** The grid. Outside customize mode it only lays the widgets out; in customize mode every widget gets a frame with its controls. */
export function DashboardCanvas({ defs, layout, renderWidget }: Props) {
  const { widgets, editing } = layout;
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [settingsFor, setSettingsFor] = useState<string | null>(null);
  const dragFrom = useRef<string | null>(null);

  const onDrop = (e: DragEvent, targetId: string) => {
    e.preventDefault();
    const id = dragFrom.current;
    dragFrom.current = null;
    setDragId(null); setOverId(null);
    if (!id || id === targetId) return;
    const to = widgets.findIndex(w => w.id === targetId);
    if (to >= 0) layout.move(id, to);
  };

  return (
    <div className="grid grid-cols-12 gap-4 items-stretch">
      {widgets.map((w, index) => {
        const def = defs.find(d => d.id === w.id);
        if (!def) return null;
        if (!editing && !w.visible) return null;
        const locked = !!def.locked;

        if (!editing) {
          return (
            <div key={w.id} className={clsx(SIZE_CLASS[w.size], 'min-w-0 empty:hidden')}>
              {renderWidget(def, w)}
            </div>
          );
        }

        return (
          <div
            key={w.id}
            className={clsx(SIZE_CLASS[w.size], 'min-w-0 flex flex-col rounded-2xl border border-dashed bg-white/60',
              overId === w.id && dragId !== w.id ? 'border-brand-orange bg-brand-pale-orange/30' : 'border-slate/40',
              dragId === w.id && 'opacity-50')}
            onDragOver={(e) => { if (dragFrom.current) { e.preventDefault(); setOverId(w.id); } }}
            onDragLeave={() => setOverId(cur => (cur === w.id ? null : cur))}
            onDrop={(e) => onDrop(e, w.id)}
          >
            <div className="flex flex-wrap items-center gap-1 px-2 py-1.5 border-b border-dashed border-slate/30 shrink-0">
              <span
                draggable
                role="button"
                tabIndex={-1}
                aria-label={`Drag ${def.title} to reorder`}
                title="Drag to reorder"
                onDragStart={(e) => { dragFrom.current = w.id; setDragId(w.id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', w.id); }}
                onDragEnd={() => { dragFrom.current = null; setDragId(null); setOverId(null); }}
                className={clsx(iconBtn, 'cursor-grab active:cursor-grabbing')}
              >
                <GripVertical size={15} />
              </span>
              <p className="flex-1 min-w-[110px] truncate text-[12px] font-semibold text-carbon" title={def.title}>{def.title}</p>
              <button type="button" className={iconBtn} aria-label={`Move ${def.title} earlier`} disabled={index === 0} onClick={() => layout.move(w.id, index - 1)}><ArrowUp size={14} /></button>
              <button type="button" className={iconBtn} aria-label={`Move ${def.title} later`} disabled={index === widgets.length - 1} onClick={() => layout.move(w.id, index + 1)}><ArrowDown size={14} /></button>
              {def.sizes.length > 1 && (
                <select
                  aria-label={`Size of ${def.title}`}
                  value={w.size}
                  onChange={(e) => layout.patch(w.id, { size: e.target.value as LayoutWidget['size'] })}
                  className="h-7 max-w-[118px] rounded-md border border-bone bg-white text-[11px] text-graphite px-1 cursor-pointer"
                >
                  {def.sizes.map(s => <option key={s} value={s}>{SIZE_LABEL[s]}</option>)}
                </select>
              )}
              {def.settings && def.settings.length > 0 && (
                <button type="button" className={clsx(iconBtn, settingsFor === w.id && 'bg-fog text-carbon')} aria-label={`Settings for ${def.title}`} aria-expanded={settingsFor === w.id}
                  onClick={() => setSettingsFor(cur => (cur === w.id ? null : w.id))}><Settings2 size={14} /></button>
              )}
              {!locked && (
                <>
                  <button type="button" className={iconBtn} aria-label={w.visible ? `Hide ${def.title}` : `Show ${def.title}`} aria-pressed={!w.visible}
                    onClick={() => layout.patch(w.id, { visible: !w.visible })}>{w.visible ? <Eye size={14} /> : <EyeOff size={14} />}</button>
                  <button type="button" className={iconBtn} aria-label={`Remove ${def.title} from the dashboard`} onClick={() => layout.remove(w.id)}><X size={14} /></button>
                </>
              )}
            </div>

            {settingsFor === w.id && def.settings && (
              <div className="flex flex-wrap gap-3 px-3 py-2.5 border-b border-dashed border-slate/30 bg-cream/60">
                {def.settings.map(f => (
                  <label key={f.key} className="flex flex-col gap-1 text-[11px] font-semibold text-slate">
                    {f.label}
                    <select
                      value={String(w.settings[f.key] ?? def.defaultSettings?.[f.key] ?? '')}
                      onChange={(e) => {
                        const opt = f.options.find(o => String(o.value) === e.target.value);
                        if (opt) layout.setSetting(w.id, f.key, opt.value);
                      }}
                      className="h-8 rounded-md border border-bone bg-white text-[12px] font-normal text-carbon px-2 cursor-pointer"
                    >
                      {f.options.map(o => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
                    </select>
                  </label>
                ))}
              </div>
            )}

            <div className="flex-1 min-h-[88px] p-2 min-w-0">
              {w.visible
                ? (renderWidget(def, w) ?? <p className="text-[12px] text-slate px-2 py-6 text-center">Nothing to show right now. This widget appears when it has data.</p>)
                : <p className="text-[12px] text-slate px-2 py-6 text-center">Hidden. It will not show on your dashboard until you turn it back on.</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
