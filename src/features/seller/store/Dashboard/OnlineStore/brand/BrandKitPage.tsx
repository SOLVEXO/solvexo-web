import '@/features/storefront-themes/editorThemes';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, ImagePlus, Loader2, Lock, RotateCcw, Sparkles, Unlock, Wand2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { ColorField, Select, SkeletonBox } from '@/components/comman/ui';
import {
  apiGetBrandKit, apiGetStoreTheme, apiListInstalledThemes, apiSaveBrandKit, brandKitColors,
  type BrandKit, type StoreThemeData, type StorefrontColors,
} from '@/api/services/storeTheme';
import { DEFAULT_THEME_ID } from '@/features/storefront-themes/registry';
import { getThemeManifest } from '@/features/storefront-themes/themeManifest';
import type { Section } from '@/api/services/storefrontTypes';
import { FontPicker } from '../themes/FontPicker';
import { ThemeLivePreview } from '../themes/ThemeLivePreview';
import { extractPalette } from '../themes/BrandKitCard';
import { SECTION_PRESETS } from '../builder/sectionPresets';
import { SECTION_META_BY_TYPE } from '../builder/sectionRegistry';
import { BRAND_PRESETS, STYLE_KEYS, checkBrand, derivePalette, isHex, matchingPreset } from './brandSystem';

const INPUT = 'w-full px-3 py-2 rounded-lg border border-bone bg-white text-[13px] text-charcoal';
const CORE_KEYS = ['primaryColor', 'accentColor', 'bgColor', 'textColor', 'saleColor'] as const;
const EXTRA_COLOR_KEYS = ['linkColor', 'priceColor', 'starColor', 'headingColor', 'buttonTextColor', 'cardBgColor'] as const;

/** What the store starts from before the seller has saved a Brand Kit: the theme's own colours. */
function emptyKit(theme: Partial<StorefrontColors> | undefined): BrandKit {
  return {
    primaryColor: theme?.primaryColor ?? '#1c1917', accentColor: theme?.accentColor ?? theme?.primaryColor ?? '#1c1917',
    bgColor: null, textColor: null, saleColor: null, locked: true,
  };
}

/** The kit as it is sent: blank strings become null (= the theme keeps its own value). */
function normalise(kit: BrandKit): BrandKit {
  const out: Record<string, unknown> = { ...kit };
  for (const k of [...CORE_KEYS.slice(2), ...EXTRA_COLOR_KEYS, 'font', 'headingFont', ...STYLE_KEYS]) {
    if (out[k] === '' || out[k] === undefined) out[k] = null;
  }
  return out as unknown as BrandKit;
}

const sameKit = (a: BrandKit | null, b: BrandKit | null) => JSON.stringify(a ? normalise(a) : null) === JSON.stringify(b ? normalise(b) : null);

function Card({ title, hint, children, badge }: { title: string; hint?: string; children: ReactNode; badge?: ReactNode }) {
  return (
    <section className="bg-white border border-bone rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 text-[13.5px] font-bold text-charcoal">{title}</h2>
          {hint && <p className="m-0 mt-0.5 text-[12px] text-slate">{hint}</p>}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children, note }: { label: string; children: ReactNode; note?: string }) {
  return (
    <label className="flex flex-col gap-1 min-w-0">
      <span className="text-[11.5px] font-semibold text-charcoal">{label}</span>
      {children}
      {note && <span className="text-[11px] text-[#B45309]">{note}</span>}
    </label>
  );
}

export function BrandKitPage() {
  const { storeId, store } = useStoreWorkspace();
  const toast = useToast();
  const [installedId, setInstalledId] = useState<string | undefined>();
  const [theme, setTheme] = useState<StoreThemeData | null>(null);
  const [saved, setSaved] = useState<BrandKit | null>(null);
  const [kit, setKit] = useState<BrandKit | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const [lockSaving, setLockSaving] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [reload, setReload] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    (async () => {
      try {
        const list = await apiListInstalledThemes(storeId);
        const active = list.data.find(t => t.status === 'active') ?? list.data[0];
        if (!active) throw new Error('Install a theme first, then come back to set your brand.');
        const [themeRes, kitRes] = await Promise.all([apiGetStoreTheme(storeId, active._id), apiGetBrandKit(storeId)]);
        if (cancelled) return;
        setInstalledId(active._id);
        setTheme(themeRes.data);
        const draftTheme = ((themeRes.data as unknown as { draft?: { theme?: StorefrontColors } }).draft?.theme ?? themeRes.data.theme) as StorefrontColors;
        const initial = kitRes.data ?? emptyKit(draftTheme);
        setSaved(kitRes.data ?? null);
        setKit(initial);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load your Brand Kit.');
      }
    })();
    return () => { cancelled = true; };
  }, [storeId, reload]);

  const manifest = useMemo(() => (theme ? getThemeManifest(theme.themeDefinitionId, DEFAULT_THEME_ID) : null), [theme]);
  const supported = useMemo(() => new Set<string>((manifest?.themeSettingsFields ?? []).map(f => String(f.key))), [manifest]);
  const themeName = manifest?.name ?? 'this theme';
  /** Small badge for a setting the active theme does not read. */
  const unsupportedNote = (key: string) => (manifest && !supported.has(key) ? `${themeName} does not use this setting.` : undefined);

  const draftColors = useMemo(() => {
    if (!theme) return null;
    return ((theme as unknown as { draft?: { theme?: StorefrontColors } }).draft?.theme ?? theme.theme) as StorefrontColors;
  }, [theme]);

  const set = useCallback(<K extends keyof BrandKit>(key: K, value: BrandKit[K]) => {
    setKit(prev => (prev ? { ...prev, [key]: value, ...(STYLE_KEYS.includes(key as never) ? { presetId: null } : {}) } : prev));
  }, []);

  // The preview is the real theme over the real store: the draft theme with the kit laid on top, and a few typical sections.
  const previewTheme = useMemo<StoreThemeData | null>(() => {
    if (!theme || !kit || !draftColors) return null;
    const patch = brandKitColors(normalise(kit));
    const base = theme as unknown as { draft?: Record<string, unknown> };
    return { ...theme, draft: { ...(base.draft ?? {}), theme: { ...draftColors, ...patch } } } as unknown as StoreThemeData;
  }, [theme, kit, draftColors]);

  const sampleSections = useMemo<Section[]>(() => {
    const ids = ['banner-hero', 'products-new', 'benefits-3', 'reviews-3', 'newsletter-offer'];
    return ids.flatMap((id, i) => {
      const p = SECTION_PRESETS.find(x => x.id === id);
      if (!p || !('type' in p)) return [];
      const built = p.build();
      return [{ _id: `brand-sample-${i}`, type: p.type, settings: { ...SECTION_META_BY_TYPE[p.type].defaultSettings, ...built.settings }, blocks: built.blocks } as unknown as Section];
    });
  }, []);

  const checks = useMemo(
    () => (kit && draftColors ? checkBrand(kit, { bgColor: draftColors.bgColor, textColor: draftColors.textColor }) : []),
    [kit, draftColors],
  );

  const dirty = !!kit && !sameKit(kit, saved ?? (draftColors ? emptyKit(draftColors) : null));
  const preset = kit ? matchingPreset(normalise(kit)) : null;

  const pickPreset = (id: string) => {
    const p = BRAND_PRESETS.find(x => x.id === id);
    if (!p) return;
    setKit(prev => (prev ? { ...prev, ...p.style, presetId: p.id } : prev));
  };

  const autoPalette = () => {
    if (!kit || !isHex(kit.primaryColor)) { toast.error('Pick your main colour first (a colour like #D97757).'); return; }
    const p = derivePalette(kit.primaryColor);
    setKit(prev => (prev ? { ...prev, accentColor: p.accentColor, bgColor: p.bgColor, textColor: p.textColor, saleColor: p.saleColor } : prev));
    toast.success('Palette created from your main colour. Check the preview, then save.');
  };

  const pickFromLogo = async (file: File | undefined) => {
    if (!file) return;
    setExtracting(true);
    try {
      const colors = await extractPalette(file);
      if (colors.length === 0) toast.error('No clear brand colours found in that image. Try your logo on a plain background.');
      setSuggested(colors);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not read that image.');
    } finally {
      setExtracting(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const colourValid = !!kit && isHex(kit.primaryColor) && isHex(kit.accentColor)
    && ([kit.bgColor, kit.textColor, kit.saleColor, ...EXTRA_COLOR_KEYS.map(k => kit[k])] as (string | null | undefined)[]).every(v => !v || isHex(v));

  const save = async () => {
    if (!kit) return;
    if (!colourValid) { toast.error('Enter valid colours like #D97757.'); return; }
    const payload = normalise({ ...kit, presetId: preset?.id ?? kit.presetId ?? null });
    setSaving(true);
    try {
      await apiSaveBrandKit(storeId, payload, installedId);
      setSaved(payload);
      setKit(payload);
      toast.success('Brand Kit saved to your draft. Open Customize and press Publish to make it live.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your Brand Kit.');
    } finally {
      setSaving(false);
    }
  };

  const toggleLock = async () => {
    if (!kit) return;
    const next = !kit.locked;
    setKit({ ...kit, locked: next });
    if (!saved) return; // before the first save the lock is saved together with the rest
    setLockSaving(true);
    try {
      const { apiSetBrandKitLocked } = await import('@/api/services/storeTheme');
      await apiSetBrandKitLocked(storeId, next);
      setSaved({ ...saved, locked: next });
      toast.success(next ? 'Your brand will stay when you change theme.' : 'Your brand will follow the theme.');
    } catch (err) {
      setKit({ ...kit, locked: !next });
      toast.error(err instanceof Error ? err.message : 'Could not change this setting.');
    } finally {
      setLockSaving(false);
    }
  };

  const colour = (label: string, key: (typeof EXTRA_COLOR_KEYS)[number] | 'bgColor' | 'textColor' | 'saleColor', hint?: string) => (
    <ColorField label={`${label} (optional)`} value={isHex(kit?.[key]) ? (kit?.[key] as string) : ''} allowEmpty emptyLabel="Auto" hint={unsupportedNote(key) ?? hint}
      onValueChange={v => set(key, (v || null) as never)} />
  );

  const select = (label: string, key: keyof BrandKit, options: [string, string][]) => (
    <Field label={label} note={unsupportedNote(key)}>
      <Select value={(kit?.[key] as string | null | undefined) ?? ''} onChange={e => set(key, ((e.target as HTMLSelectElement).value || null) as never)}>
        <option value="">Theme default</option>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </Select>
    </Field>
  );
  const RADII: [string, string][] = [['none', 'Square'], ['small', 'Small'], ['medium', 'Medium'], ['large', 'Large'], ['full', 'Fully round']];

  if (error) {
    return (
      <>
        <StorePageHeader title="Brand Kit" subtitle="Your colours, fonts and shapes, applied to the whole store." />
        <div className="px-4 lg:px-7 pt-5 pb-10 w-full flex flex-col items-center gap-3 py-24 text-center">
          <p className="text-[13px] text-error">{error}</p>
          <button type="button" onClick={() => setReload(n => n + 1)} className="rounded-lg border border-bone bg-white px-4 py-2 text-[13px] font-semibold text-charcoal cursor-pointer">Retry</button>
        </div>
      </>
    );
  }
  if (!kit || !theme || !draftColors) {
    return (
      <>
        <StorePageHeader title="Brand Kit" subtitle="Your colours, fonts and shapes, applied to the whole store." />
        <div className="px-4 lg:px-7 pt-5 pb-10 w-full grid lg:grid-cols-[440px_minmax(0,1fr)] gap-5">
          <div className="flex flex-col gap-3">{[0, 1, 2].map(i => <SkeletonBox key={i} height={180} rounded="16px" />)}</div>
          <SkeletonBox height={520} rounded="16px" />
        </div>
      </>
    );
  }

  return (
    <>
      <StorePageHeader
        title="Brand Kit"
        subtitle="Set your brand once. Colours, fonts, buttons and corners follow it across the whole store."
        actions={(
          <div className="flex items-center gap-2">
            {dirty && <span className="text-[12px] text-[#B45309] font-semibold">Unsaved changes</span>}
            <button type="button" disabled={!dirty || saving} onClick={() => setKit(saved ?? emptyKit(draftColors))}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bone bg-white text-[12.5px] font-semibold text-charcoal cursor-pointer disabled:opacity-50">
              <RotateCcw size={13} /> Undo changes
            </button>
            <button type="button" disabled={!dirty || saving || !colourValid} onClick={() => void save()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[12.5px] font-bold text-white border-none cursor-pointer disabled:opacity-50" style={{ background: '#D97757' }}>
              {saving && <Loader2 size={13} className="animate-spin" />} Save to draft
            </button>
          </div>
        )}
      />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full grid grid-cols-1 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)] gap-5 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Card title="Start from a style" hint="One click sets fonts, corners and buttons together. You can still change anything after.">
            <div className="grid grid-cols-2 gap-2">
              {BRAND_PRESETS.map(p => (
                <button key={p.id} type="button" onClick={() => pickPreset(p.id)} aria-pressed={preset?.id === p.id}
                  className="text-left rounded-xl border p-3 bg-white cursor-pointer" style={{ borderColor: preset?.id === p.id ? '#D97757' : '#E4DFD3', background: preset?.id === p.id ? '#FDF3EE' : '#fff' }}>
                  <span className="block text-[13px] font-bold text-charcoal">{p.name}</span>
                  <span className="block text-[11.5px] text-slate mt-0.5">{p.blurb}</span>
                </button>
              ))}
            </div>
          </Card>

          <Card title="Colours" hint="Choose your main colour, or let us build the rest from it.">
            <ColorField label="Main brand colour" value={isHex(kit.primaryColor) ? kit.primaryColor : ''} hint="Buttons and highlights." onValueChange={v => { if (v) setKit(prev => (prev ? { ...prev, primaryColor: v, accentColor: prev.accentColor === prev.primaryColor ? v : prev.accentColor } : prev)); }} />
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={autoPalette}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bone bg-white text-[12.5px] font-semibold text-charcoal cursor-pointer">
                <Wand2 size={13} /> Build the palette from this colour
              </button>
              <button type="button" onClick={() => fileRef.current?.click()} disabled={extracting}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bone bg-white text-[12.5px] font-semibold text-charcoal cursor-pointer disabled:opacity-60">
                {extracting ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />} Pick from my logo
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => void pickFromLogo(e.target.files?.[0])} />
            </div>
            {suggested.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {suggested.map(hex => (
                  <span key={hex} className="inline-flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full border border-bone bg-white">
                    <span className="w-5 h-5 rounded-full border border-black/10" style={{ background: hex }} />
                    <button type="button" onClick={() => set('primaryColor', hex)} className="text-[11px] font-semibold text-charcoal bg-transparent border-none cursor-pointer">Main</button>
                    <button type="button" onClick={() => set('accentColor', hex)} className="text-[11px] font-semibold text-slate bg-transparent border-none cursor-pointer">2nd</button>
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {colour('Page background', 'bgColor')}
              {colour('Text', 'textColor')}
              {colour('Sale', 'saleColor')}
              <ColorField label="Second colour" value={isHex(kit.accentColor) ? kit.accentColor : ''} hint={unsupportedNote('accentColor') ?? 'Secondary accents.'} onValueChange={v => { if (v) set('accentColor', v); }} />
            </div>
            <button type="button" onClick={() => setAdvanced(a => !a)} aria-expanded={advanced} className="self-start text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer p-0">
              {advanced ? 'Hide' : 'Show'} more colour roles
            </button>
            {advanced && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {colour('Headings', 'headingColor')}
                {colour('Links', 'linkColor')}
                {colour('Prices', 'priceColor')}
                {colour('Star ratings', 'starColor')}
                {colour('Button text', 'buttonTextColor')}
                {colour('Card background', 'cardBgColor')}
              </div>
            )}
            <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
              {checks.map(c => (
                <li key={c.id} className="flex items-start gap-1.5 text-[12px]" style={{ color: c.level === 'ok' ? '#5B5851' : c.level === 'error' ? '#B91C1C' : '#B45309' }}>
                  {c.level === 'ok' ? <CheckCircle2 size={14} className="shrink-0 mt-px text-[#16A34A]" /> : <AlertTriangle size={14} className="shrink-0 mt-px" />}
                  {c.text}
                </li>
              ))}
            </ul>
          </Card>

          <Card title="Typography" hint="Your fonts and how headings are set. Fonts load from Google Fonts.">
            <Field label="Body font" note={unsupportedNote('font')}>
              <FontPicker value={kit.font ?? ''} defaultLabel="Theme default" inputClass={INPUT} onChange={v => set('font', v || null)} />
            </Field>
            <Field label="Heading font" note={unsupportedNote('headingFont')}>
              <FontPicker value={kit.headingFont ?? ''} defaultLabel="Same as body" inputClass={INPUT} onChange={v => set('headingFont', v || null)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              {select('Heading weight', 'headingWeight', [['regular', 'Regular'], ['medium', 'Medium'], ['semibold', 'Semibold'], ['bold', 'Bold']])}
              {select('Heading case', 'headingCase', [['none', 'As typed'], ['uppercase', 'UPPERCASE']])}
              {select('Heading spacing', 'headingTracking', [['tight', 'Tight'], ['normal', 'Normal'], ['wide', 'Wide']])}
              {select('Button text', 'buttonCase', [['normal', 'As typed'], ['uppercase', 'UPPERCASE']])}
            </div>
          </Card>

          <Card title="Buttons and corners" hint="How rounded and how interactive the store feels.">
            <div className="grid grid-cols-2 gap-3">
              {select('Button style', 'buttonStyle', [['solid', 'Solid'], ['outline', 'Outline'], ['soft', 'Soft']])}
              {select('Button corners', 'buttonRadius', RADII)}
              {select('Picture corners', 'imageRadius', RADII)}
              {select('Card corners', 'productCardRadius', RADII)}
              {select('Section corners', 'sectionRadius', RADII.filter(([v]) => v !== 'full'))}
              {select('Field corners', 'inputRadius', RADII)}
              {select('Button hover', 'buttonHover', [['fade', 'Fade'], ['lift', 'Lift'], ['grow', 'Grow']])}
              {select('Button shadow', 'buttonShadow', [['none', 'None'], ['soft', 'Soft']])}
              {select('Card hover', 'cardHover', [['none', 'None'], ['shadow', 'Shadow'], ['lift', 'Lift']])}
            </div>
          </Card>

          <Card title="Logo and favicon" hint="Your brand assets live in Settings. They are shown here so you can see them next to your colours.">
            <div className="flex items-center gap-4">
              <div className="h-14 min-w-14 max-w-[160px] rounded-lg border border-bone bg-cream flex items-center justify-center px-2">
                {store?.logo ? <img src={store.logo} alt="Store logo" className="max-h-12 max-w-full object-contain" /> : <span className="text-[11px] text-slate">No logo</span>}
              </div>
              <div className="h-10 w-10 rounded-lg border border-bone bg-cream flex items-center justify-center">
                {store?.faviconUrl ? <img src={store.faviconUrl} alt="Favicon" className="max-h-8 max-w-8 object-contain" /> : <span className="text-[10px] text-slate">None</span>}
              </div>
              <Link to={`/store/${storeId}/settings`} className="ml-auto text-[12.5px] font-semibold text-brand-orange no-underline">Change in Settings</Link>
            </div>
          </Card>

          <Card title="Keep my brand when I change theme">
            <button type="button" onClick={() => void toggleLock()} disabled={lockSaving} aria-pressed={kit.locked}
              className="flex items-start gap-2.5 text-left rounded-xl border p-3 cursor-pointer bg-white disabled:opacity-60" style={{ borderColor: kit.locked ? '#D97757' : '#E4DFD3' }}>
              {kit.locked ? <Lock size={16} className="shrink-0 mt-0.5 text-[#D97757]" /> : <Unlock size={16} className="shrink-0 mt-0.5 text-slate" />}
              <span>
                <span className="block text-[13px] font-bold text-charcoal">{kit.locked ? 'On: a new theme keeps your brand' : 'Off: a new theme brings its own look'}</span>
                <span className="block text-[12px] text-slate">{kit.locked ? 'A new theme changes layout and sections only. Your colours, fonts and shapes stay.' : 'Switching theme replaces your colours, fonts and shapes with the new theme’s.'}</span>
              </span>
            </button>
            <p className="m-0 text-[11.5px] text-slate">Saving only changes your <b>draft</b>. Nothing goes live until you press Publish in <Link to={`/store/${storeId}/online-store/themes`} className="text-brand-orange">Themes → Customize</Link>.</p>
          </Card>
        </div>

        <div className="min-w-0 border border-bone rounded-2xl bg-white overflow-hidden lg:sticky lg:top-[78px]" style={{ height: 'calc(100vh - 150px)', minHeight: 520 }}>
          <div className="px-4 py-2.5 border-b border-bone flex items-center gap-2 text-[12px] text-slate">
            <Sparkles size={13} /> Live preview on {themeName}. Your unsaved choices show here.
          </div>
          <div style={{ height: 'calc(100% - 40px)' }} className="overflow-hidden bg-[#F1EDE5] p-2">
            <div style={{ height: '100%' }}>
              {previewTheme && <ThemeLivePreview fill showChrome draftTheme={previewTheme} sections={sampleSections} />}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
