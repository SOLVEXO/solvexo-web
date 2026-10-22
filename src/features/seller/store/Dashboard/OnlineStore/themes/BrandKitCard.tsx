import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Loader2, Lock, Unlock, AlertTriangle, CheckCircle2, ChevronDown } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { apiGetBrandKit, apiSaveBrandKit, apiSetBrandKitLocked, brandKitColors, type BrandKit, type StorefrontColors } from '@/api/services/storeTheme';
import { paletteFromPixels } from './brandPalette';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const lbl = 'text-[11.5px] font-bold uppercase tracking-wide text-slate';
const HEX6 = /^#[0-9a-f]{6}$/i;

function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
/** Most common distinct, reasonably colourful tones in an image (client-side, nothing is uploaded). */
async function extractPalette(file: File): Promise<string[]> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read that image.'));
      el.src = url;
    });
    const size = 64;
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Image processing is not available in this browser.');
    ctx.drawImage(img, 0, 0, size, size);
    return paletteFromPixels(ctx.getImageData(0, 0, size, size).data);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Swatch({ label, value, onChange, hint, optional, onClear }: { label: string; value: string; onChange: (v: string) => void; hint?: string; optional?: boolean; onClear?: () => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className={lbl}>{label}{optional && <span className="normal-case font-medium"> (optional)</span>}</label>
      <div className="flex items-center gap-2">
        <input type="color" aria-label={label} title={optional && !value ? 'Auto â€” the theme picks this' : undefined} value={HEX6.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg border border-bone cursor-pointer shrink-0 p-0.5 bg-white" style={{ opacity: optional && !value ? 0.25 : 1 }} />
        <input className={inp} value={value} onChange={e => onChange(e.target.value)} placeholder="#000000" />
        {optional && value && onClear && <button type="button" onClick={onClear} className="text-[12px] text-slate font-semibold bg-transparent border-none cursor-pointer shrink-0">Auto</button>}
      </div>
      {hint && <p className="text-[11.5px] text-slate">{hint}</p>}
    </div>
  );
}

/** Store-level Brand Kit: the seller's own colours, applied over whatever theme is active, and (when locked)
 *  kept when they install, activate or apply a different theme. Saved on the Store, not inside a theme. */
export function BrandKitCard({ storeId, installedThemeId, current, showAccent, onApply }: {
  storeId: string;
  installedThemeId: string | undefined;
  current: StorefrontColors;
  /** Whether the active theme has a second-accent colour at all. When it doesn't (Maison), the field is hidden and the kit's accent simply follows the main colour. */
  showAccent: boolean;
  /** Pushes the colours into the Theme Settings working copy so the preview updates instantly. */
  onApply: (patch: Partial<StorefrontColors>) => void;
}) {
  const toast = useToast();
  const [loaded, setLoaded] = useState(false);
  const [primary, setPrimary] = useState(current.primaryColor);
  const [accent, setAccent] = useState(current.accentColor);
  const [bg, setBg] = useState('');
  const [text, setText] = useState('');
  const [sale, setSale] = useState('');
  const [locked, setLocked] = useState(true);
  const [open, setOpen] = useState(false);
  const [lockSaving, setLockSaving] = useState(false);
  const [savedKit, setSavedKit] = useState<BrandKit | null>(null);
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [suggested, setSuggested] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    apiGetBrandKit(storeId)
      .then(res => {
        if (cancelled) return;
        const kit = res.data;
        if (kit) {
          setSavedKit(kit);
          setPrimary(kit.primaryColor); setAccent(kit.accentColor);
          setBg(kit.bgColor ?? ''); setText(kit.textColor ?? ''); setSale(kit.saleColor ?? '');
          setLocked(kit.locked);
        }
      })
      .catch(() => { /* no kit yet / offline: start from the theme's current colours */ })
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [storeId]);

  // Lock is saved on its own as soon as a kit exists (no need to re-Apply just to flip it); before the first Apply it is simply saved together with the colours.
  const toggleLock = async () => {
    const next = !locked;
    setLocked(next);
    if (!savedKit) return;
    setLockSaving(true);
    try {
      await apiSetBrandKitLocked(storeId, next);
      setSavedKit({ ...savedKit, locked: next });
      toast.success(next ? 'Brand colours will stay when you change theme.' : 'Brand colours will follow the theme.');
    } catch (err) {
      setLocked(!next);
      toast.error(err instanceof Error ? err.message : 'Could not change this setting.');
    } finally {
      setLockSaving(false);
    }
  };

  const valid = HEX6.test(primary) && (!showAccent || HEX6.test(accent)) && (!bg || HEX6.test(bg)) && (!text || HEX6.test(text)) && (!sale || HEX6.test(sale));
  const pageBg = HEX6.test(bg) ? bg : current.bgColor;
  const buttonOnPage = HEX6.test(primary) && HEX6.test(pageBg) ? contrast(primary, pageBg) : 21;
  const whiteOnPrimary = HEX6.test(primary) ? contrast('#ffffff', primary) : 21;
  const buttonText = HEX6.test(primary) ? (whiteOnPrimary >= 3 ? 'white' : 'dark') : 'white';

  const pickFromImage = async (file: File | undefined) => {
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

  const apply = async () => {
    if (!valid) { toast.error('Enter valid colours like #D97757.'); return; }
    // A theme with no second accent: keep the kit's accent in step with the main colour, so a later theme that does use one still looks on-brand.
    const accentToSave = showAccent ? accent : primary;
    const kit: BrandKit = { primaryColor: primary, accentColor: accentToSave, bgColor: bg || null, textColor: text || null, saleColor: sale || null, locked };
    setSaving(true);
    try {
      await apiSaveBrandKit(storeId, kit, installedThemeId);
      setSavedKit(kit);
      onApply(brandKitColors(kit));
      toast.success(locked ? 'Brand colours applied and locked. Publish to make them live.' : 'Brand colours applied. Publish to make them live.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save your brand colours.');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return <div className="h-[180px] bg-cream animate-pulse rounded-2xl" />;

  return (
    <div className="bg-white border border-bone rounded-2xl">
      <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 p-4 bg-transparent border-none cursor-pointer text-left">
        <span>
          <span className="block text-[13px] font-bold text-charcoal">Brand colours</span>
          <span className="block text-[12px] text-slate mt-0.5">Your own colours, kept across themes. Optional.</span>
        </span>
        <span className="flex items-center gap-2 shrink-0">
          {savedKit && <span className="flex -space-x-1">{[savedKit.primaryColor, savedKit.accentColor].map(h => <span key={h} className="w-4 h-4 rounded-full border border-white" style={{ background: h }} />)}</span>}
          <ChevronDown size={16} className="text-slate transition-transform" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
        </span>
      </button>
      {open && (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <p className="text-[12px] text-slate">Nothing changes in your store until you press <b>Apply to my store</b>. It affects only this store, never other stores.</p>

      <div className="grid grid-cols-1 gap-3">
        <Swatch label="Main brand colour" value={primary} onChange={setPrimary} hint="Buttons and highlights." />
        {showAccent && <Swatch label="Second colour" value={accent} onChange={setAccent} hint="Used for secondary accents." />}
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Swatch label="Page background" optional value={bg} onChange={setBg} onClear={() => setBg('')} />
        <Swatch label="Text" optional value={text} onChange={setText} onClear={() => setText('')} />
        <Swatch label="Sale" optional value={sale} onChange={setSale} onClear={() => setSale('')} />
      </div>
      <p className="text-[11.5px] text-slate -mt-2">Leave the optional ones on Auto to keep the theme's own tones. Borders, card shades and button text are worked out for you.</p>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={extracting}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-bone bg-white text-[12.5px] font-semibold text-charcoal cursor-pointer disabled:opacity-60">
          {extracting ? <Loader2 size={13} className="animate-spin" /> : <ImagePlus size={13} />} Pick colours from my logo
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => void pickFromImage(e.target.files?.[0])} />
        {suggested.map(hex => (
          <span key={hex} className="inline-flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full border border-bone bg-white">
            <span className="w-5 h-5 rounded-full border border-black/10" style={{ background: hex }} />
            <button type="button" onClick={() => setPrimary(hex)} className="text-[11px] font-semibold text-charcoal bg-transparent border-none cursor-pointer">Main</button>
            <button type="button" onClick={() => setAccent(hex)} className="text-[11px] font-semibold text-slate bg-transparent border-none cursor-pointer">2nd</button>
          </span>
        ))}
      </div>

      <div className="flex items-center gap-3 rounded-xl border border-bone p-3" style={{ background: pageBg }}>
        <span className="px-4 py-2 rounded-lg text-[12.5px] font-bold" style={{ background: primary, color: buttonText === 'white' ? '#fff' : '#111' }}>Button</span>
        <span className="text-[12.5px] font-semibold underline" style={{ color: accent }}>Link</span>
        <span className="text-[11.5px] ml-auto" style={{ color: HEX6.test(text) ? text : current.textColor }}>Preview of your colours</span>
      </div>
      {buttonOnPage < 3
        ? <p className="flex items-start gap-1.5 text-[12px] text-[#B45309]"><AlertTriangle size={14} className="shrink-0 mt-px" /> Your main colour is too close to the page background, so buttons may be hard to see. Try a darker or brighter shade.</p>
        : <p className="flex items-start gap-1.5 text-[12px] text-slate"><CheckCircle2 size={14} className="shrink-0 mt-px text-[#16A34A]" /> Buttons stand out well. Button text will be {buttonText === 'white' ? 'white' : 'dark'} automatically.</p>}

      <button type="button" onClick={() => void toggleLock()} disabled={lockSaving} aria-pressed={locked}
        className="flex items-start gap-2.5 text-left rounded-xl border p-3 cursor-pointer bg-white disabled:opacity-60" style={{ borderColor: locked ? '#D97757' : '#E4DFD3' }}>
        {locked ? <Lock size={16} className="shrink-0 mt-0.5 text-[#D97757]" /> : <Unlock size={16} className="shrink-0 mt-0.5 text-slate" />}
        <span>
          <span className="block text-[13px] font-bold text-charcoal">{locked ? 'Keep my brand colours when I change theme' : 'Brand colours follow the theme'}</span>
          <span className="block text-[12px] text-slate">{locked ? 'A new theme changes the layout and style only. Your colours stay.' : 'A new theme brings its own colours.'}</span>
        </span>
      </button>

      <div className="flex justify-end">
        <button type="button" onClick={() => void apply()} disabled={saving || !valid}
          className="flex items-center gap-1.5 px-5 py-[9px] rounded-[10px] text-[13px] font-bold text-white border-none cursor-pointer disabled:opacity-60" style={{ background: '#D97757' }}>
          {saving && <Loader2 size={13} className="animate-spin" />} Apply to my store
        </button>
      </div>
    </div>
      )}
    </div>
  );
}
