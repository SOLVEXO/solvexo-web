import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { FileJson, FileCode2, Loader2, Check, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import type { StoreThemeData } from '@/api/services/storeTheme';
import { apiUpdateStoreThemeColors, apiUpdateStoreHeader, apiUpdateStoreFooter, apiUpdateIdentityBanner, apiUpdateCustomCss } from '@/api/services/storeTheme';
import { apiUpdateStorePageSections, type StorePageData } from '@/api/services/storePages';

type VirtualFile = 'theme.json' | 'home.sections.json' | 'custom.css';
const FILES: { id: VirtualFile; label: string; language: string; Icon: typeof FileJson }[] = [
  { id: 'theme.json', label: 'theme.json', language: 'json', Icon: FileJson },
  { id: 'home.sections.json', label: 'home.sections.json', language: 'json', Icon: FileJson },
  { id: 'custom.css', label: 'custom.css', language: 'css', Icon: FileCode2 },
];

/**
 * A Monaco view over the SAME validated endpoints the visual tabs already
 * use — not a parallel system, not a real filesystem (there is no
 * filesystem to browse: this is a config-driven React app, not a template
 * engine, so presenting file create/delete/rename would be exactly the
 * "fake functionality" the theme ecosystem plan explicitly forbids). Three
 * virtual files:
 *   - `theme.json`   — colors/header/footer/identityBanner, saved via the
 *                      same three PATCH calls `StoreBuilder.handleSaveTheme`
 *                      already makes.
 *   - `home.sections.json` — the home page's section composition, saved via
 *                      the same `apiUpdateStorePageSections` the visual
 *                      Pages tab already uses (so it goes through the exact
 *                      same `validateSectionSettings` server-side).
 *   - `custom.css`   — new, scoped, sanitized server-side (`sanitizeCustomCss`
 *                      in `css-sanitizer.ts`) — no JS execution, ever.
 * Client-side JSON.parse is the only validation performed here before
 * sending; the server remains the authority (same DTOs/validators the
 * visual tabs hit), so a malformed edit is rejected with a real error
 * message rather than silently accepted.
 */
export function CodeEditorTab({ storeId, themeDraft, homePage, customCss, onSaved }: {
  storeId: string;
  themeDraft: { theme: StoreThemeData['theme']; header: StoreThemeData['header']; footer: StoreThemeData['footer']; identityBanner: StoreThemeData['identityBanner'] };
  homePage: StorePageData | null;
  customCss: string | null;
  /** Called after any successful save so the parent (Store Builder) reloads its own draft/pages state — the code editor never keeps its own source of truth. */
  onSaved: () => void;
}) {
  const [activeFile, setActiveFile] = useState<VirtualFile>('theme.json');
  const [text, setText] = useState<Record<VirtualFile, string>>({
    'theme.json': '', 'home.sections.json': '', 'custom.css': '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // Re-synced whenever the underlying draft/page data changes (theme applied,
  // saved elsewhere, or on first mount) — never edited by any consumer
  // other than this tab's own Monaco instance in between.
  useEffect(() => {
    setText({
      'theme.json': JSON.stringify({ theme: themeDraft.theme, header: themeDraft.header, footer: themeDraft.footer, identityBanner: themeDraft.identityBanner }, null, 2),
      'home.sections.json': JSON.stringify(homePage?.sections ?? [], null, 2),
      'custom.css': customCss ?? '',
    });
  }, [themeDraft, homePage, customCss]);

  const flashSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const handleSave = useCallback(async () => {
    setError(null);
    setSaving(true);
    try {
      if (activeFile === 'theme.json') {
        let parsed: any;
        try { parsed = JSON.parse(text['theme.json']); } catch { throw new Error('Invalid JSON — check for a missing comma or bracket.'); }
        await Promise.all([
          apiUpdateStoreThemeColors(storeId, parsed.theme ?? {}),
          apiUpdateStoreHeader(storeId, parsed.header ?? {}),
          apiUpdateStoreFooter(storeId, parsed.footer?.blocks ?? [], parsed.footer?.footerStyle),
          apiUpdateIdentityBanner(storeId, parsed.identityBanner ?? {}),
        ]);
      } else if (activeFile === 'home.sections.json') {
        if (!homePage) throw new Error('No home page found for this store.');
        let parsed: any;
        try { parsed = JSON.parse(text['home.sections.json']); } catch { throw new Error('Invalid JSON — check for a missing comma or bracket.'); }
        if (!Array.isArray(parsed)) throw new Error('home.sections.json must be an array of sections.');
        await apiUpdateStorePageSections(storeId, homePage._id, parsed);
      } else {
        await apiUpdateCustomCss(storeId, text['custom.css'] || null);
      }
      flashSaved();
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save — the server rejected this content.');
    } finally {
      setSaving(false);
    }
  }, [activeFile, text, storeId, homePage, onSaved]);

  const current = FILES.find(f => f.id === activeFile)!;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-slate -mt-1">
        Edits here save through the exact same validated backend as the visual editor — nothing here can bypass that validation, and nothing you type ever executes as JavaScript.
      </p>

      <div className="flex items-center gap-1 border-b border-bone">
        {FILES.map(f => (
          <button
            key={f.id}
            type="button"
            onClick={() => { setActiveFile(f.id); setError(null); }}
            className={clsx(
              'flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold border-none border-b-2 -mb-px cursor-pointer transition-colors whitespace-nowrap bg-transparent',
              activeFile === f.id ? 'text-brand-orange border-b-brand-orange' : 'text-slate border-b-transparent hover:text-charcoal',
            )}
          >
            <f.Icon size={13} /> {f.label}
          </button>
        ))}
      </div>

      <div className="border border-bone rounded-xl overflow-hidden">
        <Editor
          height="440px"
          language={current.language}
          value={text[activeFile]}
          onChange={v => setText(prev => ({ ...prev, [activeFile]: v ?? '' }))}
          theme="light"
          options={{ minimap: { enabled: false }, fontSize: 13, scrollBeyondLastLine: false, tabSize: 2 }}
        />
      </div>

      {error && (
        <p className="flex items-center gap-1.5 text-[12.5px] font-semibold text-error bg-error-bg rounded-lg px-3 py-2">
          <AlertTriangle size={13} className="shrink-0" /> {error}
        </p>
      )}

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer transition-opacity disabled:opacity-60"
          style={{ background: '#D97757' }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : null} Save {current.label}
        </button>
        {saved && (
          <span className="flex items-center gap-1.5 text-[12.5px] font-semibold px-3 py-[6px] rounded-full bg-success-bg text-success">
            <Check size={13} /> Saved — Publish to make it live.
          </span>
        )}
      </div>
    </div>
  );
}
