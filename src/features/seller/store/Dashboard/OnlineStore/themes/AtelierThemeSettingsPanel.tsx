import { Loader2, RotateCcw, Undo2, Redo2, History } from 'lucide-react';
import { useEffect } from 'react';
import { useToast } from '@/contexts/ToastContext';
import {
  apiGetStoreTheme, apiUpdateStoreThemeColors, apiUpdateStoreCustomCss,
  apiPublishStoreTheme, apiRevertStoreThemeDraft,
  apiListStoreThemeVersions, apiRestoreStoreThemeVersion,
  type StorefrontColors, type StoreThemeData,
} from '@/api/services/storeTheme';
import { useEditorState } from '../builder/editor/useEditorState';
import { useUndoRedoShortcuts } from '../builder/editor/useUndoRedoShortcuts';
import { VersionHistoryModal } from '../builder/VersionHistoryModal';
import { useState } from 'react';
import { getThemeManifest, type ThemeSettingsFieldDef } from '@/features/storefront-themes/themeManifest';
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';

// Fixed platform brand color — same literal `ThemeLibraryPage.tsx`'s Install
// button, `AtelierCustomizePage.tsx`'s `SaveButton`, and
// `AtelierHeaderFooterPage.tsx`'s admin buttons use. See
// `AtelierCustomizePage.tsx`'s own `ADMIN_ACCENT` comment for why admin
// chrome intentionally stays a fixed platform color rather than the active
// theme's accent (this was the same per-theme-hardcoding bug, fixed here
// too for consistency).
const ADMIN_ACCENT = '#D97757';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const label = 'text-[11.5px] font-bold uppercase tracking-wide text-slate';

interface ThemeDraft { colors: StorefrontColors; customCss: string }

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
const GROUP_ORDER: ThemeSettingsFieldDef['group'][] = ['Colors', 'Typography', 'Buttons', 'Layout & Spacing'];

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
  const value = String(colors[field.key] ?? '');
  if (field.control.kind === 'color') {
    return <ColorField heading={field.label} value={value} onChange={v => onChange({ [field.key]: v } as Partial<StorefrontColors>)} />;
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Field heading={field.label}>
        <select className={inp} value={value} onChange={e => onChange({ [field.key]: e.target.value } as Partial<StorefrontColors>)}>
          {field.control.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      {field.helpText && <p className="text-[11.5px] text-slate">{field.helpText}</p>}
    </div>
  );
}

/** Atelier's own Schema-Driven Theme Settings — the merchant-facing editor
 *  for the subset of the legacy `StorefrontColors` schema Atelier's real
 *  render tree can meaningfully act on: background/text/accent color, body
 *  font, button style/radius/width, and section-spacing/container-width.
 *  Deliberately NOT every one of the ~25 legacy fields (typeScale,
 *  heroStyle, productCardStyle, testimonialStyle, faqStyle, headerStyle,
 *  footerStyle, productImageRatio/Hover/Density, etc.) — those drove the
 *  OLD 12-theme shared-engine system Atelier explicitly does not use (see
 *  `theme.config.ts`'s own doc comment); exposing controls with zero real
 *  effect on this theme would be dishonest. `bgAlt`/`inkMuted`/`border`/
 *  `accentInk` are derived from the 3 real color fields, not separately
 *  editable — see `applyMerchantThemeOverrides` in `theme.config.ts`.
 *
 *  Same backend contract as the pre-existing (now-superseded) Store
 *  Builder's Theme tab — `apiUpdateStoreThemeColors`/`apiUpdateStoreCustomCss`
 *  /`apiPublishStoreTheme` etc. already existed and needed zero backend
 *  changes; this is a new frontend consumer of an already-complete API. Its
 *  own self-contained draft/undo-redo/save/publish/version-history toolbar
 *  (not the shared per-template one in `AtelierCustomizePage`) since this
 *  edits a completely different resource (`StoreTheme`, not a `Section[]`
 *  template) — kept separate so the working section-editor code above it
 *  never had to change to make room for this.
 *
 *  Phase 4: the field list below (Colors/Typography/Buttons/Layout &
 *  Spacing) is no longer hand-written JSX — it's rendered generically from
 *  `getThemeManifest(doc?.themeDefinitionId, DEFAULT_THEME_ID).themeSettingsFields`
 *  (see `themeManifest.ts` / `theme-01-atelier/theme.manifest.ts`), grouped
 *  by `ThemeSettingsField`. Atelier's manifest lists exactly the fields this
 *  file used to hardcode, in the same order, with the same options and help
 *  text, so this is a zero-visible-change refactor for Atelier today — but a
 *  second theme's manifest now renders its own field set here with no new
 *  code in this component, which is the actual point. */
export function AtelierThemeSettingsPanel({ storeId, onDraftChange }: {
  storeId: string;
  /** Fires on every keystroke/change so the parent can feed the live working
   *  copy into the shared `AtelierLivePreview`, exactly like every other
   *  scope's instant-preview behavior. */
  onDraftChange: (draft: StoreThemeData | null) => void;
}) {
  const toast = useToast();
  const flash = (ok: boolean, text: string) => { if (ok) toast.success(text); else toast.error(text); };

  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<StoreThemeData | null>(null);
  const [discarding, setDiscarding] = useState(false);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<{ _id: string; publishedAt: string }[]>([]);
  const [restoringVersionId, setRestoringVersionId] = useState<string | null>(null);

  const editor = useEditorState<ThemeDraft>();
  useUndoRedoShortcuts(editor.undo, editor.redo, true);

  useEffect(() => {
    setLoading(true);
    apiGetStoreTheme(storeId).then(res => {
      setDoc(res.data);
      editor.load(
        { colors: res.data.theme, customCss: res.data.customCss ?? '' },
        { colors: res.data.draft.theme, customCss: res.data.draft.customCss ?? '' },
      );
    }).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  // Live-feed the in-progress working copy up to the parent so the shared
  // preview reflects every keystroke, same as the section editors do.
  useEffect(() => {
    if (!doc || !editor.workingCopy) return;
    onDraftChange({
      ...doc,
      theme: doc.theme,
      customCss: doc.customCss,
      draft: { ...doc.draft, theme: editor.workingCopy.colors, customCss: editor.workingCopy.customCss },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doc, editor.workingCopy]);

  const set = (patch: Partial<StorefrontColors>) => {
    if (!editor.workingCopy) return;
    editor.edit({ ...editor.workingCopy, colors: { ...editor.workingCopy.colors, ...patch } });
  };
  const setCss = (customCss: string) => {
    if (!editor.workingCopy) return;
    editor.edit({ ...editor.workingCopy, customCss });
  };

  const busy = editor.phase === 'saving' || editor.phase === 'publishing' || discarding;

  const handleSave = async () => {
    if (!editor.workingCopy) return;
    editor.markSaving();
    try {
      const [colorsRes] = await Promise.all([
        apiUpdateStoreThemeColors(storeId, editor.workingCopy.colors),
        apiUpdateStoreCustomCss(storeId, editor.workingCopy.customCss || null),
      ]);
      setDoc(colorsRes.data);
      editor.markSaved({ colors: colorsRes.data.draft.theme, customCss: colorsRes.data.draft.customCss ?? '' });
      flash(true, 'Draft saved — Publish to make it live.');
    } catch (err) {
      editor.markSaveError(err instanceof Error ? err.message : 'Failed to save.');
      flash(false, err instanceof Error ? err.message : 'Failed to save.');
    }
  };

  const handlePublish = async () => {
    editor.markPublishing();
    try {
      // Publish must never republish a stale backend draft — if there's a
      // local edit that hasn't been saved yet, persist it first so Publish
      // always promotes exactly what the merchant currently sees.
      if (editor.dirty && editor.workingCopy) {
        await Promise.all([
          apiUpdateStoreThemeColors(storeId, editor.workingCopy.colors),
          apiUpdateStoreCustomCss(storeId, editor.workingCopy.customCss || null),
        ]);
      }
      const res = await apiPublishStoreTheme(storeId);
      setDoc(res.data);
      editor.markPublished({ colors: res.data.theme, customCss: res.data.customCss ?? '' });
      flash(true, 'Published — your storefront is now live with these changes.');
    } catch (err) {
      editor.markPublishError(err instanceof Error ? err.message : 'Failed to publish.');
      flash(false, err instanceof Error ? err.message : 'Failed to publish.');
    }
  };

  const handleDiscard = async () => {
    setDiscarding(true);
    try {
      const res = await apiRevertStoreThemeDraft(storeId);
      setDoc(res.data);
      editor.discardDraft({ colors: res.data.draft.theme, customCss: res.data.draft.customCss ?? '' });
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
    apiListStoreThemeVersions(storeId).then(res => setVersions(res.data)).catch(() => setVersions([])).finally(() => setVersionsLoading(false));
  };

  const restoreVersion = async (versionId: string) => {
    setRestoringVersionId(versionId);
    try {
      const res = await apiRestoreStoreThemeVersion(storeId, versionId);
      setDoc(res.data);
      editor.discardDraft({ colors: res.data.draft.theme, customCss: res.data.draft.customCss ?? '' });
      setVersionsOpen(false);
      flash(true, 'Version restored to your draft — review it, then Publish.');
    } catch (err) {
      flash(false, err instanceof Error ? err.message : 'Failed to restore version.');
    } finally {
      setRestoringVersionId(null);
    }
  };

  if (loading || !editor.workingCopy) {
    return <div className="p-7 flex flex-col gap-3"><div className="h-[400px] bg-cream animate-pulse rounded-2xl" /></div>;
  }

  const c = editor.workingCopy.colors;
  // `DEFAULT_THEME_ID` is imported from `registry.ts` (not redeclared here)
  // specifically so ES module evaluation order guarantees `registry.ts` —
  // and therefore its `import './theme-01-atelier/theme.manifest'` side
  // effect that populates `THEME_MANIFESTS` — has already run before this
  // line executes. Importing the id from anywhere else would drop that
  // guarantee and risk `manifest` resolving to `undefined`.
  const manifest = getThemeManifest(doc?.themeDefinitionId, DEFAULT_THEME_ID);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap justify-between bg-white border border-bone rounded-2xl px-3 py-2.5">
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

      {GROUP_ORDER.map(group => {
        const fields = manifest.themeSettingsFields.filter(f => f.group === group);
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

      <div className="flex flex-col gap-3 bg-white border border-bone rounded-2xl p-4">
        <div>
          <p className="text-[13px] font-bold text-charcoal">Custom CSS</p>
          <p className="text-[11.5px] text-slate mt-0.5">Advanced — injected into your storefront exactly as written. CSS only, no scripts.</p>
        </div>
        <textarea
          className="w-full px-3 py-2.5 text-[12.5px] font-mono border border-bone rounded-lg text-charcoal bg-cream/40 outline-none resize-y"
          rows={8}
          spellCheck={false}
          value={editor.workingCopy.customCss}
          onChange={e => setCss(e.target.value)}
          placeholder=".atelier-hero { letter-spacing: 0.02em; }"
        />
      </div>

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
