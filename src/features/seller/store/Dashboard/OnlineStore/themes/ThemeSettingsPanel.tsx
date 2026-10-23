import { Loader2, RotateCcw, Undo2, Redo2, History, Search } from 'lucide-react';
import { useEffect } from 'react';
import { ColorField as OptionalColorField } from './HeaderFooterSettingsPanels';
import { useToast } from '@/contexts/ToastContext';
import {
  apiGetStoreTheme, apiUpdateStoreThemeColors,
  apiPublishStoreTheme, apiRevertStoreThemeDraft,
  apiListStoreThemeVersions, apiRestoreStoreThemeVersion,
  apiCreateColorScheme, apiApplyColorScheme, apiDeleteColorScheme,
  type StorefrontColors, type StoreThemeData,
} from '@/api/services/storeTheme';
import { useEditorState } from '../builder/editor/useEditorState';
import { useAutosave } from '../builder/editor/useAutosave';
import { useThemeEditorUnsavedChanges } from '@/components/layouts/ThemeEditorUnsavedContext';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { VersionHistoryModal } from '../builder/VersionHistoryModal';
import { useState } from 'react';
import { getThemeManifest, readThemeSetting, themeSettingPatch, type ThemeManifest, type ThemeSettingsFieldDef } from '@/features/storefront-themes/themeManifest';
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';

// Fixed platform brand color — same literal `ThemeLibraryPage.tsx`'s Install
// button, `ThemeCustomizePage.tsx`'s `SaveButton`, and
// `ThemeHeaderFooterPage.tsx`'s admin buttons use. See
// `ThemeCustomizePage.tsx`'s own `ADMIN_ACCENT` comment for why admin
// chrome intentionally stays a fixed platform color rather than the active
// theme's accent (this was the same per-theme-hardcoding bug, fixed here
// too for consistency).
const ADMIN_ACCENT = '#D97757';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const label = 'text-[11.5px] font-bold uppercase tracking-wide text-slate';

interface ThemeDraft { colors: StorefrontColors }

function Field({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={label}>{heading}</label>
      {children}
    </div>
  );
}

function ColorField({ heading, value, onChange }: { heading: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field heading={heading}>
      <div className="flex items-center gap-2">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg border border-bone cursor-pointer shrink-0 p-0.5 bg-white" />
        <input className={inp} value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" />
      </div>
    </Field>
  );
}

function SaveButton({ onClick, saving, label: text }: { onClick: () => void; saving: boolean; label: string }) {
  return (
    <button onClick={onClick} disabled={saving}
      className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60"
      style={{ background: ADMIN_ACCENT }}>
      {saving ? <Loader2 size={13} className="animate-spin" /> : null} {text}
    </button>
  );
}

/** Static Tailwind class strings only — a template literal like
 *  `sm:grid-cols-${n}` would not be picked up by Tailwind's build-time
 *  class scanner (it needs the literal substring present in source), so the
 *  column count is resolved through this fixed lookup instead. Every string
 *  here already appears verbatim elsewhere in this file (Colors/Buttons
 *  used 3-col, Layout & Spacing used 2-col), so this introduces no class
 *  the existing Tailwind build doesn't already compile. */
const GROUP_GRID: Record<number, string> = {
  1: 'flex flex-col gap-3',
  2: 'grid grid-cols-1 sm:grid-cols-2 gap-3',
  3: 'grid grid-cols-1 sm:grid-cols-3 gap-3',
};

/** Fixed rendering order for the 4 groups `ThemeSettingsFieldDef['group']`
 *  can be — a theme's manifest can list its fields in any order; they
 *  always render grouped into these sections, in this order, and a group
 *  with zero fields for the active theme is simply skipped. */
const GROUP_ORDER: ThemeSettingsFieldDef['group'][] = ['Colors', 'Typography', 'Buttons', 'Layout & Spacing', 'Images', 'Product cards', 'Product page', 'Effects', 'Cart'];

/** Renders one manifest-declared field against the theme's live working
 *  copy — a `color` control becomes a `ColorField`, a `select` control
 *  becomes a labeled dropdown built from the manifest's own `options`. This
 *  is what makes Theme Settings generic: a new theme's manifest adds
 *  fields here with zero new JSX anywhere in this file. */
function ThemeSettingsField({ field, colors, onChange }: {
  field: ThemeSettingsFieldDef;
  colors: StorefrontColors;
  onChange: (patch: Partial<StorefrontColors>) => void;
}) {
  const value = String(readThemeSetting(colors, field) ?? '');
  if (field.control.kind === 'color' && field.control.optional) {
    return <div className="flex flex-col gap-1.5"><OptionalColorField label={field.label} value={readThemeSetting(colors, field) as string | null | undefined} fallback={field.control.optional.fallback} onChange={v => onChange(themeSettingPatch(colors, field, v))} />{field.helpText && <p className="text-[11.5px] text-slate">{field.helpText}</p>}</div>;
  }
  if (field.control.kind === 'color') {
    return <div className="flex flex-col gap-1.5"><ColorField heading={field.label} value={value} onChange={v => onChange(themeSettingPatch(colors, field, v))} />{field.helpText && <p className="text-[11.5px] text-slate">{field.helpText}</p>}</div>;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Field heading={field.label}>
        <select className={inp} value={value} onChange={e => onChange(themeSettingPatch(colors, field, e.target.value))}>
          {field.control.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      {field.helpText && <p className="text-[11.5px] text-slate">{field.helpText}</p>}
    </div>
  );
}

/** Named, reusable saved palettes — a seller can save the current 3 colors
 *  (bg/text/accent) under a name, then one-click "Apply" any saved palette
 *  back onto the live color pickers. Deliberately store-wide (not a
 *  per-section assignment like Shopify's real `color_scheme_group`) — see
 *  the backend `ColorScheme` schema's own comment for that boundary.
 *
 *  Two distinct callbacks on purpose: saving/deleting a palette never
 *  touches `bgColor`/`textColor`/`primaryColor` at all (only the
 *  `colorSchemes` list changes), so `onSchemesChanged` just refreshes
 *  `doc` for the list — it must NOT resync the editor's working copy, or it
 *  would silently discard any unsaved edit the seller has in progress on an
 *  unrelated field (font, button style, …). `onApplied` is the one case that
 *  really does change the 3 color fields server-side, so the parent merges
 *  just those 3 into the current working copy — preserving everything else
 *  still unsaved, rather than overwriting the whole colors object from the
 *  server's last-saved state. */
function SavedPalettes({ storeId, installedThemeId, schemes, current, onSchemesChanged, onApplied }: {
  storeId: string;
  installedThemeId: string | undefined;
  schemes: { id: string; name: string; bgColor: string; textColor: string; primaryColor: string }[];
  current: { bgColor: string; textColor: string; primaryColor: string; mutedColor?: string | null; borderColor?: string | null; saleColor?: string | null };
  onSchemesChanged: (doc: StoreThemeData) => void;
  onApplied: (doc: StoreThemeData) => void;
}) {
  const toast = useToast();
  const [newName, setNewName] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSaveCurrent = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const res = await apiCreateColorScheme(storeId, { name: newName.trim(), ...current }, installedThemeId);
      onSchemesChanged(res.data);
      setNewName('');
      toast.success('Palette saved.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save this palette.');
    } finally {
      setSaving(false);
    }
  };

  const handleApply = async (schemeId: string) => {
    setBusyId(schemeId);
    try {
      const res = await apiApplyColorScheme(storeId, schemeId, installedThemeId);
      onApplied(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not apply this palette.');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (schemeId: string) => {
    setBusyId(schemeId);
    try {
      const res = await apiDeleteColorScheme(storeId, schemeId, installedThemeId);
      onSchemesChanged(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not delete this palette.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 bg-white border border-bone rounded-2xl p-4">
      <div>
        <p className="text-[13px] font-bold text-charcoal">Saved Palettes</p>
        <p className="text-[11.5px] text-slate mt-0.5">Save the colors above under a name, and switch between them any time.</p>
      </div>

      {schemes.length > 0 && (
        <div className="flex flex-col gap-2">
          {schemes.map(s => (
            <div key={s.id} className="flex items-center gap-3 border border-bone rounded-lg px-3 py-2">
              <div className="flex shrink-0" style={{ width: 40, height: 24, borderRadius: 6, overflow: 'hidden', border: '1px solid #E4DFD3' }}>
                <div style={{ flex: 1, background: s.bgColor }} />
                <div style={{ flex: 1, background: s.primaryColor }} />
                <div style={{ flex: 1, background: s.textColor }} />
              </div>
              <span className="text-[13px] text-charcoal flex-1 truncate">{s.name}</span>
              <button onClick={() => handleApply(s.id)} disabled={busyId === s.id}
                className="text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
                Apply
              </button>
              <button onClick={() => handleDelete(s.id)} disabled={busyId === s.id}
                className="text-[12px] font-semibold text-error bg-transparent border-none cursor-pointer p-1 disabled:opacity-60">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          className={inp} placeholder="Palette name, e.g. Holiday Sale"
          value={newName} onChange={e => setNewName(e.target.value)}
        />
        <SaveButton onClick={handleSaveCurrent} saving={saving} label="Save Current" />
      </div>
    </div>
  );
}

/** Maison's own Schema-Driven Theme Settings — the merchant-facing editor
 *  for the subset of the legacy `StorefrontColors` schema Maison's real
 *  render tree can meaningfully act on: background/text/accent color, body
 *  font, button style/radius/width, and section-spacing/container-width.
 *  Deliberately NOT every one of the ~25 legacy fields (typeScale,
 *  heroStyle, productCardStyle, testimonialStyle, faqStyle, headerStyle,
 *  footerStyle, productImageRatio/Hover/Density, etc.) — those drove the
 *  OLD 12-theme shared-engine system Maison explicitly does not use (see
 *  `theme.config.ts`'s own doc comment); exposing controls with zero real
 *  effect on this theme would be dishonest. `bgAlt`/`inkMuted`/`border`/
 *  `accentInk` are derived from the 3 real color fields, not separately
 *  editable — see `applyMerchantThemeOverrides` in `theme.config.ts`.
 *
 *  Same backend contract as the pre-existing (now-superseded) Store
 *  Builder's Theme tab — `apiUpdateStoreThemeColors`
 *  /`apiPublishStoreTheme` etc. already existed and needed zero backend
 *  changes; this is a new frontend consumer of an already-complete API. Its
 *  own self-contained draft/undo-redo/save/publish/version-history toolbar
 *  (not the shared per-template one in `ThemeCustomizePage`) since this
 *  edits a completely different resource (`StoreTheme`, not a `Section[]`
 *  template) — kept separate so the working section-editor code above it
 *  never had to change to make room for this.
 *
 *  Phase 4: the field list below (Colors/Typography/Buttons/Layout &
 *  Spacing) is no longer hand-written JSX — it's rendered generically from
 *  `getThemeManifest(doc?.themeDefinitionId, DEFAULT_THEME_ID).themeSettingsFields`
 *  (see `themeManifest.ts` / `theme-03-fashion/theme.manifest.ts`), grouped
 *  by `ThemeSettingsField`. Maison's manifest lists exactly the fields this
 *  file used to hardcode, in the same order, with the same options and help
 *  text, so this is a zero-visible-change refactor for Maison today — but a
 *  second theme's manifest now renders its own field set here with no new
 *  code in this component, which is the actual point. */
/** One-click complete looks from the theme's manifest, plus "Reset to default". Applying only patches the working copy
 *  (undo/redo works); nothing is saved or published until the merchant does it. */
const STYLE_RADIUS_PX: Record<string, number> = { none: 0, small: 6, medium: 12, large: 16, full: 999 };
function ThemeStyles({ manifest, current, onApply }: {
  manifest: ThemeManifest;
  current: StorefrontColors;
  onApply: (patch: Partial<StorefrontColors>, label: string) => void;
}) {
  const styles = manifest.styles ?? [];
  if (styles.length === 0) return null;
  const matches = (settings: Partial<StorefrontColors>) =>
    (Object.keys(settings) as (keyof StorefrontColors)[]).every(k => (current[k] ?? null) === (settings[k] ?? null));
  return (
    <div className="flex flex-col gap-3 bg-white border border-bone rounded-2xl p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold text-charcoal">Theme styles</p>
          <p className="text-[11.5px] text-slate mt-0.5">Pick a complete look in one click, then fine-tune any setting below. Nothing goes live until you Publish.</p>
        </div>
        {manifest.defaultSettings && (
          <button type="button" onClick={() => onApply(manifest.defaultSettings!, 'Defaults')}
            className="shrink-0 text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-bone bg-white text-charcoal cursor-pointer">Reset to default</button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {styles.map(st => {
          const x = st.settings;
          const active = matches(x);
          const heading = (x.headingFont || x.font || 'Inter') as string;
          return (
            <button key={st.id} type="button" onClick={() => onApply(x, st.name)} aria-pressed={active}
              className="flex flex-col gap-2 p-2 rounded-xl text-left cursor-pointer bg-[#faf8f4] border"
              style={{ borderColor: active ? '#161412' : '#e9e5dc', borderWidth: active ? 2 : 1 }}>
              <span className="block p-3" style={{ background: x.bgColor, color: x.textColor, borderRadius: Math.min(STYLE_RADIUS_PX[x.sectionRadius ?? 'large'] ?? 16, 14), border: '1px solid rgba(0,0,0,.08)' }}>
                <span className="block text-[18px] leading-none" style={{ fontFamily: `'${heading}', serif`, fontWeight: x.headingWeight === 'bold' ? 700 : x.headingWeight === 'semibold' ? 600 : x.headingWeight === 'regular' ? 400 : 500, textTransform: x.headingCase === 'uppercase' ? 'uppercase' : undefined, letterSpacing: x.headingTracking === 'wide' ? '.04em' : undefined }}>Aa</span>
                <span className="mt-2 flex items-center gap-1.5">
                  <span className="inline-block h-4 w-12" style={{ background: x.buttonStyle === 'outline' ? 'transparent' : x.primaryColor, border: `1px solid ${x.primaryColor}`, borderRadius: STYLE_RADIUS_PX[x.buttonRadius ?? 'full'] ?? 999 }} />
                  <span className="inline-block h-4 w-4 rounded-full" style={{ background: x.saleColor || '#DC2626' }} />
                </span>
              </span>
              <span className="flex items-center justify-between px-0.5">
                <span className="text-[13px] font-bold text-charcoal">{st.name}</span>
                {active && <span className="text-[10.5px] font-semibold text-slate">Current</span>}
              </span>
              <span className="px-0.5 text-[11.5px] text-slate leading-snug">{st.description}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Export the theme's settings to a small JSON file and import them back (another store, or a backup). Import only accepts
 *  settings this theme actually has, with valid values; it patches the draft, so undo/redo works and nothing is live until Publish. */
function SettingsTransfer({ manifest, current, onImport, onError }: {
  manifest: ThemeManifest;
  current: StorefrontColors;
  onImport: (patch: Partial<StorefrontColors>, count: number) => void;
  onError: (message: string) => void;
}) {
  const fields = manifest.themeSettingsFields;
  const doExport = () => {
    const settings: Record<string, unknown> = {};
    for (const f of fields) settings[f.key] = readThemeSetting(current, f) ?? null;
    const blob = new Blob([JSON.stringify({ themeId: manifest.id, settings }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `theme-settings-${manifest.id}.json`; a.click();
    URL.revokeObjectURL(url);
  };
  const doImport = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text()) as { themeId?: string; settings?: Record<string, unknown> };
      if (!parsed || typeof parsed !== 'object' || !parsed.settings || typeof parsed.settings !== 'object') throw new Error('This file is not a theme settings export.');
      if (parsed.themeId && parsed.themeId !== manifest.id) throw new Error('This file was exported from a different theme.');
      let patch: Partial<StorefrontColors> = {};
      let count = 0;
      for (const f of fields) {
        if (!(f.key in parsed.settings)) continue;
        const v = parsed.settings[f.key];
        const ok = f.control.kind === 'select'
          ? typeof v === 'string' && f.control.options.some(o => o.value === v)
          : v === null || (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v));
        if (!ok) continue;
        patch = { ...patch, ...themeSettingPatch({ ...current, ...patch }, f, v as string | null) };
        count += 1;
      }
      if (count === 0) throw new Error('No matching settings were found in this file.');
      onImport(patch, count);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not read this file.');
    }
  };
  const btn = 'text-[12px] font-semibold px-3 py-1.5 rounded-lg border border-bone bg-white text-charcoal cursor-pointer';
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button type="button" onClick={doExport} className={btn}>Export settings</button>
      <label className={btn}>
        Import settings
        <input type="file" accept="application/json,.json" className="sr-only" aria-label="Import theme settings file"
          onChange={e => { void doImport(e.target.files?.[0]); e.target.value = ''; }} />
      </label>
    </div>
  );
}

export function ThemeSettingsPanel({ storeId, installedThemeId, onDraftChange, onDirtyChange }: {
  storeId: string;
  /** The specific installed theme row this panel edits — resolved by the
   *  parent from the URL's `:themeId` (see `useResolvedThemeInstance`).
   *  Every call below threads it through so Theme Settings always acts on
   *  the theme selected in the URL, never silently on whichever is active. */
  installedThemeId: string | undefined;
  /** Fires on every keystroke/change so the parent can feed the live working
   *  copy into the shared `ThemeLivePreview`, exactly like every other
   *  scope's instant-preview behavior. */
  onDraftChange: (draft: StoreThemeData | null) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [doc, setDoc] = useState<StoreThemeData | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [query, setQuery] = useState('');
  const [tipsHidden, setTipsHidden] = useState(() => { try { return localStorage.getItem('sx-theme-tips') === '1'; } catch { return false; } });
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<{ _id: string; publishedAt: string }[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const editor = useEditorState<ThemeDraft>();
  useThemeEditorUnsavedChanges(editor.dirty);
  useEffect(() => {
    onDirtyChange(editor.dirty);
    return () => onDirtyChange(false);
  }, [editor.dirty, onDirtyChange]);
  useUndoRedoShortcuts(editor.undo, editor.redo, true);

  useEffect(() => {
    let cancelled = false;
    const requestKey = `${storeId}:${installedThemeId ?? ''}:${loadAttempt}`;
    apiGetStoreTheme(storeId, installedThemeId)
      .then(res => {
        if (cancelled) return;
        setDoc(res.data);
        setLoadedKey(requestKey);
        editor.load(
          { colors: res.data.theme },
          { colors: res.data.draft.theme },
        );
      })
      .catch(err => {
        if (!cancelled) setLoadError(err instanceof Error ? err.message : 'Could not load theme settings.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, installedThemeId, loadAttempt]);

  // Live-feed the in-progress working copy up to the parent so the shared
  // preview reflects every keystroke, same as the section editors do.
  useEffect(() => {
    if (!doc || !editor.workingCopy) return;
    onDraftChange({
      ...doc,
      theme: doc.theme,
      draft: { ...doc.draft, theme: editor.workingCopy.colors },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, editor.workingCopy]);

  const set = (patch: Partial<StorefrontColors>) => {
    if (!editor.workingCopy) return;
    editor.edit({ ...editor.workingCopy, colors: { ...editor.workingCopy.colors, ...patch } });
  };

  const busy = editor.phase === 'saving' || editor.phase === 'publishing' || discarding;

  const handleSave = async (_event?: unknown, silent = false) => {
    if (!editor.workingCopy) return;
    editor.markSaving();
    try {
      const colorsRes = await apiUpdateStoreThemeColors(storeId, editor.workingCopy.colors, installedThemeId);
      setDoc(colorsRes.data);
      editor.markSaved({ colors: colorsRes.data.draft.theme });
      if (!silent) flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      editor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  useAutosave({
    active: editor.dirty && editor.phase !== 'saving' && editor.phase !== 'publishing' && editor.phase !== 'error' && !discarding,
    version: editor.workingCopy,
    save: () => { void handleSave(undefined, true); },
  });

  const handlePublish = async () => {
    editor.markPublishing();
    try {
      // Publish must never republish a stale backend draft — if there's a
      // local edit that hasn't been saved yet, persist it first so Publish
      // always promotes exactly what the merchant currently sees.
      if (editor.dirty && editor.workingCopy) {
        await apiUpdateStoreThemeColors(storeId, editor.workingCopy.colors, installedThemeId);
      }
      const res = await apiPublishStoreTheme(storeId, installedThemeId);
      setDoc(res.data);
      editor.markPublished({ colors: res.data.theme });
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      editor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      const res = await apiRevertStoreThemeDraft(storeId, installedThemeId);
      setDoc(res.data);
      editor.discardDraft({ colors: res.data.draft.theme });
      flash(true, 'Draft discarded — reverted to your published version.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to discard draft.');
    } finally {
      setDiscarding(false);
    }
  };

  const openVersions = () => {
    setVersionsOpen(true);
    setVersionsLoading(true);
    apiListStoreThemeVersions(storeId, installedThemeId).then(res => setVersions(res.data)).catch(() => setVersions([])).finally(() => setVersionsLoading(false));
  };

  const restoreVersion = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      const res = await apiRestoreStoreThemeVersion(storeId, versionId, installedThemeId);
      setDoc(res.data);
      editor.discardDraft({ colors: res.data.draft.theme });
      setVersionsOpen(false);
      flash(true, 'Version restored to your draft — review it, then Publish.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  if (loadError) {
    return (
      <div className="p-7 flex flex-col items-start gap-3">
        <p className="text-[13px] text-error">{loadError}</p>
        <button
          type="button"
          onClick={() => { setLoading(true); setLoadAttempt(attempt => attempt + 1); }}
          className="px-4 py-2 rounded-lg border border-bone bg-white text-[13px] font-semibold text-charcoal cursor-pointer"
        >
          Try again
        </button>
      </div>
    );
  }
  const currentLoadKey = `${storeId}:${installedThemeId ?? ''}:${loadAttempt}`;
  if (loading || !editor.workingCopy || loadedKey !== currentLoadKey) {
    return <div className="p-7 flex flex-col gap-3"><div className="h-[400px] bg-cream animate-pulse rounded-2xl" /></div>;
  }

  const c = editor.workingCopy.colors;
  // `DEFAULT_THEME_ID` is imported from `registry.ts` (not redeclared here)
  // specifically so ES module evaluation order guarantees `registry.ts` —
  // and therefore its `import './theme-03-fashion/theme.manifest'` side
  // effect that populates `THEME_MANIFESTS` — has already run before this
  // line executes. Importing the id from anywhere else would drop that
  // guarantee and risk `manifest` resolving to `undefined`.
  const manifest = getThemeManifest(doc?.themeDefinitionId, DEFAULT_THEME_ID);

  return (
    <div className="flex flex-col gap-3">
      <div className="sticky top-[65px] z-10 flex items-center gap-2 flex-wrap justify-between bg-white border border-bone rounded-2xl px-3 py-2.5 shadow-[0_4px_16px_rgba(0,0,0,0.08)]">
        <p className="text-[12px] font-bold uppercase tracking-wide text-slate px-1">Theme Settings</p>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={editor.undo} disabled={!editor.canUndo} title="Undo" className="p-2 rounded-lg border border-bone bg-white text-charcoal disabled:opacity-40 cursor-pointer"><Undo2 size={15} /></button>
          <button onClick={editor.redo} disabled={!editor.canRedo} title="Redo" className="p-2 rounded-lg border border-bone bg-white text-charcoal disabled:opacity-40 cursor-pointer"><Redo2 size={15} /></button>
          <button onClick={openVersions} title="Version History" className="p-2 rounded-lg border border-bone bg-white text-charcoal cursor-pointer"><History size={15} /></button>
          {editor.hasUnpublishedChanges && (
            <button onClick={handleDiscard} disabled={busy} className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[12.5px] font-semibold border border-bone bg-white text-charcoal cursor-pointer disabled:opacity-60">
              <RotateCcw size={13} /> Discard Draft
            </button>
          )}
          <SaveButton onClick={handleSave} saving={editor.phase === 'saving'} label="Save Draft" />
          <SaveButton onClick={handlePublish} saving={editor.phase === 'publishing'} label="Publish" />
        </div>
      </div>

      {!tipsHidden && (
        <div className="flex items-start justify-between gap-3 bg-white border border-bone rounded-2xl p-4">
          <div>
            <p className="text-[13px] font-bold text-charcoal">Quick start</p>
            <ol className="text-[12px] text-slate mt-1 pl-4 list-decimal flex flex-col gap-0.5">
              <li>Pick a <b>Theme style</b> below, or set your own colours and fonts.</li>
              <li>Use <b>Home page</b> in the left menu to add, reorder and edit sections.</li>
              <li>Open <b>Header</b> and <b>Footer</b> to add your logo, menu and links.</li>
              <li>Your changes save automatically as a draft. Press <b>Publish</b> when you are happy.</li>
            </ol>
          </div>
          <button type="button" onClick={() => { setTipsHidden(true); try { localStorage.setItem('sx-theme-tips', '1'); } catch { /* storage blocked: hidden for this visit only */ } }}
            className="shrink-0 text-[12px] font-semibold text-slate bg-transparent border-none cursor-pointer">Got it</button>
        </div>
      )}

      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate" aria-hidden />
        <input type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label="Search theme settings" placeholder="Search settings, e.g. font, button, color" className={`${inp} pl-9`} />
      </div>

      {!query.trim() && <SettingsTransfer manifest={manifest} current={c} onImport={(patch, count) => { set(patch); flash(true, `Imported ${count} settings. Save or Publish to keep them.`); }} onError={msg => flash(false, msg)} />}

      {!query.trim() && <ThemeStyles manifest={manifest} current={c} onApply={(patch, label) => { set(patch); flash(true, label === 'Defaults' ? 'Reset to default settings. Save or Publish to keep it.' : `${label} style applied. Save or Publish to keep it.`); }} />}

      {GROUP_ORDER.map(group => {
        const q = query.trim().toLowerCase();
        const fields = manifest.themeSettingsFields.filter(f => f.group === group && (!q || `${f.label} ${f.helpText ?? ''} ${group}`.toLowerCase().includes(q)));
        if (fields.length === 0) return null;
        return (
          <div key={group} className="flex flex-col gap-4 bg-white border border-bone rounded-2xl p-4">
            <p className="text-[13px] font-bold text-charcoal">{group}</p>
            <div className={GROUP_GRID[Math.min(fields.length, 3)]}>
              {fields.map(field => <ThemeSettingsField key={field.key} field={field} colors={c} onChange={set} />)}
            </div>
          </div>
        );
      })}

      {!query.trim() && (
      <SavedPalettes
        storeId={storeId}
        installedThemeId={installedThemeId}
        schemes={doc?.draft.theme.colorSchemes ?? []}
        current={{ bgColor: c.bgColor, textColor: c.textColor, primaryColor: c.primaryColor, mutedColor: c.mutedColor, borderColor: c.borderColor, saleColor: c.saleColor }}
        onSchemesChanged={setDoc}
        onApplied={updated => {
          setDoc(updated);
          if (!editor.workingCopy) return;
          editor.edit({
            ...editor.workingCopy,
            colors: {
              ...editor.workingCopy.colors,
              bgColor: updated.draft.theme.bgColor,
              textColor: updated.draft.theme.textColor,
              primaryColor: updated.draft.theme.primaryColor,
              mutedColor: updated.draft.theme.mutedColor ?? null,
              borderColor: updated.draft.theme.borderColor ?? null,
              saleColor: updated.draft.theme.saleColor ?? null,
            },
          });
        }}
      />
      )}

      <VersionHistoryModal
        title="Theme — Version History"
        open={versionsOpen}
        loading={versionsLoading}
        versions={versions}
        restoringId={restoringVersionId}
        onClose={() => setVersionsOpen(false)}
        onRestore={restoreVersion}
      />
    </div>
  );
}
