import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  apiGetDashboardLayout, apiResetDashboardLayout, apiSaveDashboardLayout,
  type DashboardLayout, type DashboardScope, type LayoutWidget,
} from '@/api/services/dashboardLayout';
import type { DashboardPreset, DashboardWidgetDef, WidgetSize } from './dashboardTypes';

interface Options {
  /** Must be a stable reference (module constant or `useMemo`): a new object re-loads the layout. */
  scope: DashboardScope;
  defs: DashboardWidgetDef[];
  /** What a person who never customized sees. */
  defaultWidgets: LayoutWidget[];
  /** Can this session see this widget at all (role permissions)? Widgets it cannot see are never rendered or offered. */
  canSee?: (def: DashboardWidgetDef) => boolean;
}

export function widgetFromDef(def: DashboardWidgetDef, size?: WidgetSize, settings?: Record<string, string | number>): LayoutWidget {
  return { id: def.id, visible: true, size: size ?? def.defaultSize, settings: { ...(def.defaultSettings ?? {}), ...(settings ?? {}) } };
}

export function presetToWidgets(preset: DashboardPreset, defs: DashboardWidgetDef[]): LayoutWidget[] {
  const out: LayoutWidget[] = [];
  for (const entry of preset.widgets) {
    const id = typeof entry === 'string' ? entry : entry.id;
    const def = defs.find(d => d.id === id);
    if (!def) continue;
    out.push(widgetFromDef(def, typeof entry === 'string' ? undefined : entry.size, typeof entry === 'string' ? undefined : entry.settings));
  }
  return out;
}

const same = (a: LayoutWidget[], b: LayoutWidget[]) => JSON.stringify(a) === JSON.stringify(b);

/**
 * Loads the person's saved layout and drives the customize mode: the saved layout is only replaced on Save, Cancel throws the
 * working copy away. Nothing here decides what a person may see: data endpoints stay permission-guarded.
 */
export function useDashboardLayout({ scope, defs, defaultWidgets, canSee }: Options) {
  const [saved, setSaved] = useState<LayoutWidget[] | null>(null); // null = nothing saved, default applies
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<LayoutWidget[]>([]);
  const [preset, setPreset] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const visibleToUser = useCallback((id: string) => {
    const def = defs.find(d => d.id === id);
    return !!def && (!canSee || canSee(def));
  }, [defs, canSee]);

  useEffect(() => {
    let cancelled = false;
    // Starting a (re)load is a state change driven by the scope/retry, same pattern as the other page loaders.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    setLoadError('');
    apiGetDashboardLayout(scope)
      .then(res => {
        if (cancelled) return;
        const layout = res.data.layout;
        setSaved(layout ? layout.widgets : null);
        setPreset(layout?.preset ?? null);
      })
      .catch(err => { if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load your dashboard layout.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [scope, reloadKey]);

  // Critical (locked) widgets are always on screen, even when a saved layout or preset leaves them out.
  const withLocked = useCallback((list: LayoutWidget[]): LayoutWidget[] => {
    const lockedIds = new Set(defs.filter(d => d.locked).map(d => d.id));
    const missing = defs.filter(d => d.locked && visibleToUser(d.id) && !list.some(w => w.id === d.id)).map(d => widgetFromDef(d));
    return [...missing, ...list.map(w => (lockedIds.has(w.id) ? { ...w, visible: true } : w))];
  }, [defs, visibleToUser]);
  const baseline = useMemo(() => withLocked((saved ?? defaultWidgets).filter(w => visibleToUser(w.id))), [saved, defaultWidgets, visibleToUser, withLocked]);
  const widgets = editing ? draft : baseline;
  const dirty = editing && !same(draft, baseline);

  const startEdit = () => { setDraft(baseline.map(w => ({ ...w, settings: { ...w.settings } }))); setSaveError(''); setEditing(true); };
  const cancel = () => { setEditing(false); setSaveError(''); };

  const update = (fn: (w: LayoutWidget[]) => LayoutWidget[]) => setDraft(prev => fn(prev));
  const move = (id: string, toIndex: number) => update(prev => {
    const from = prev.findIndex(w => w.id === id);
    if (from < 0) return prev;
    const next = prev.slice();
    const [item] = next.splice(from, 1);
    next.splice(Math.max(0, Math.min(toIndex, next.length)), 0, item);
    return next;
  });
  const patch = (id: string, change: Partial<LayoutWidget>) => update(prev => prev.map(w => (w.id === id ? { ...w, ...change } : w)));
  const setSetting = (id: string, key: string, value: string | number) =>
    update(prev => prev.map(w => (w.id === id ? { ...w, settings: { ...w.settings, [key]: value } } : w)));
  const remove = (id: string) => update(prev => prev.filter(w => w.id !== id));
  const add = (id: string) => {
    const def = defs.find(d => d.id === id);
    if (!def) return;
    update(prev => (prev.some(w => w.id === id) ? prev.map(w => (w.id === id ? { ...w, visible: true } : w)) : [...prev, widgetFromDef(def)]));
  };
  const applyPreset = (p: DashboardPreset) => {
    setDraft(withLocked(presetToWidgets(p, defs).filter(w => visibleToUser(w.id))));
    setPreset(p.id);
  };

  const save = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError('');
    try {
      const layout: DashboardLayout = { preset, columns: 3, widgets: draft };
      const res = await apiSaveDashboardLayout(scope, layout);
      setSaved(res.data.layout?.widgets ?? draft);
      setEditing(false);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save your layout.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const reset = async (): Promise<boolean> => {
    setSaving(true);
    setSaveError('');
    try {
      await apiResetDashboardLayout(scope);
      setSaved(null);
      setPreset(null);
      setEditing(false);
      return true;
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not reset your layout.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  return {
    widgets, editing, dirty, loading, loadError, saving, saveError, preset,
    reload: () => setReloadKey(k => k + 1),
    startEdit, cancel, save, reset, move, patch, setSetting, remove, add, applyPreset,
  };
}

export type DashboardLayoutApi = ReturnType<typeof useDashboardLayout>;
