import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, AlignLeft, AlignCenter } from 'lucide-react';
import { Field } from '@/components/comman/ui';
import {
  type StorefrontColors, type ThemeHeaderStyle, type ThemeFooterStyle,
} from '@/api/services/storeTheme';
import { RADIUS_PX_MAP } from '@/features/storefront/StorefrontContext';
import { THEMES, type ThemeDefinition } from './themes';
import {
  RadiusPicker, StylePreviewPicker, IconOptionPicker, ScaleSegmentPicker,
  DiagramHeroOverlay, DiagramHeroSplit, DiagramTestimonialCards, DiagramTestimonialMinimal,
  DiagramAccordion, DiagramListExpanded, DiagramImageSquare, DiagramImagePortrait,
  DiagramHoverNone, DiagramHoverZoom, DiagramButtonAuto, DiagramButtonFull,
} from './ThemeControls';

const HEX_RE = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
const FONTS = ['Poppins', 'Inter', 'Roboto', 'Lora', 'Playfair Display', 'Montserrat', 'Nunito', 'DM Sans', 'Fraunces', 'Space Grotesk'];

// Pairs the native color swatch with a real hex text field — the swatch
// alone means a seller can only eyeball a color, never enter an exact brand
// hex they already have from elsewhere.
function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (hex: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => { setText(value); }, [value]);

  const handleText = (next: string) => {
    setText(next);
    if (HEX_RE.test(next)) onChange(next);
  };

  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          className="w-10 h-10 shrink-0 border border-bone rounded-lg cursor-pointer"
          value={HEX_RE.test(value) ? value : '#000000'}
          onChange={e => { setText(e.target.value); onChange(e.target.value); }}
        />
        <input
          type="text"
          className="w-full h-10 px-3 text-[13px] border border-bone rounded-lg uppercase"
          value={text}
          onChange={e => handleText(e.target.value)}
          maxLength={7}
          spellCheck={false}
        />
      </div>
    </Field>
  );
}

/** True only if every field this theme sets matches the store's current
 *  resolved values exactly — used both to highlight the active gallery card
 *  and to compute the "N settings customized" diff below. Generic over
 *  whatever `StorefrontColors` currently contains, so the full field set is
 *  compared automatically without listing fields by hand. */
function fieldsMatchTheme(theme: ThemeDefinition, colors: StorefrontColors, headerStyle: ThemeHeaderStyle, footerStyle: ThemeFooterStyle): { matches: boolean; diffCount: number } {
  let diffCount = 0;
  for (const [key, val] of Object.entries(theme.colors)) {
    if (colors[key as keyof StorefrontColors] !== val) diffCount++;
  }
  if (headerStyle !== theme.headerStyle) diffCount++;
  if (footerStyle !== theme.footerStyle) diffCount++;
  return { matches: diffCount === 0, diffCount };
}

/** Collapsible accordion section — one open at a time by default, so
 *  Customize mode reads as an organized editor instead of one long flat
 *  scroll of controls. */
function ScopeSection({ id, title, open, onToggle, children }: {
  id: string; title: string; open: boolean; onToggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div className="border border-bone rounded-xl overflow-hidden bg-white">
      <button
        type="button"
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer text-left"
      >
        <span className="text-[13px] font-bold text-charcoal">{title}</span>
        {open ? <ChevronUp size={15} className="text-slate" /> : <ChevronDown size={15} className="text-slate" />}
      </button>
      {open && <div className="px-4 pb-4 flex flex-col gap-4 border-t border-bone pt-4">{children}</div>}
    </div>
  );
}

function buttonPreview(style: StorefrontColors['buttonStyle'], primaryColor: string, radiusPx: string) {
  const s =
    style === 'outline' ? { background: 'transparent', border: `1.2px solid ${primaryColor}`, color: primaryColor } :
    style === 'soft'     ? { background: `${primaryColor}1A`, border: 'none', color: primaryColor } :
    /* solid */            { background: primaryColor, border: 'none', color: '#fff' };
  return <span className="px-3 py-[5px] text-[10.5px] font-bold" style={{ ...s, borderRadius: radiusPx }}>Shop Now</span>;
}

function cardPreview(style: StorefrontColors['productCardStyle'], radiusPx: string) {
  const chrome =
    style === 'flat'     ? {} :
    style === 'elevated' ? { boxShadow: '0 2px 8px rgba(20,15,10,0.14)' } :
    /* outlined */          { border: '1px solid #D9D6CC' };
  return (
    <span className="flex flex-col gap-1 w-11 p-1.5 bg-white" style={{ borderRadius: radiusPx, ...chrome }}>
      <span className="block w-full h-4 rounded-[2px] bg-brand-pale-orange" />
      <span className="block w-full h-[3px] rounded-full bg-bone" />
      <span className="block w-2/3 h-[3px] rounded-full bg-bone" />
    </span>
  );
}

export interface ThemeTabProps {
  value: StorefrontColors;
  onChange: (next: StorefrontColors) => void;
  /** Which theme package (from the Theme Library) this active installed
   *  theme's fields were seeded from — shown as a small "based on X, N
   *  settings customized" status line only. Switching WHICH theme is active
   *  now happens exclusively on the Theme Library page (`online-store/themes`)
   *  — this tab only fine-tunes the currently active one's tokens, per the
   *  "Customize and Theme Library are separate surfaces" architecture. */
  baseThemeId: string | null;
  headerStyle: ThemeHeaderStyle;
  footerStyle: ThemeFooterStyle;
}

export function ThemeTab({
  value, onChange, baseThemeId,
  headerStyle, footerStyle,
}: ThemeTabProps) {
  const [openSection, setOpenSection] = useState<string>('colors');
  const set = (patch: Partial<StorefrontColors>) => onChange({ ...value, ...patch });
  const toggleSection = (id: string) => setOpenSection(prev => prev === id ? '' : id);

  const baseTheme = useMemo(() => THEMES.find(t => t.id === baseThemeId) ?? null, [baseThemeId]);
  const diff = useMemo(
    () => baseTheme ? fieldsMatchTheme(baseTheme, value, headerStyle, footerStyle) : null,
    [baseTheme, value, headerStyle, footerStyle],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 bg-cream/60 border border-bone rounded-lg px-3 py-2.5">
        {!baseTheme ? (
          <p className="text-[12.5px] text-slate">Custom design — not based on any Theme Library package.</p>
        ) : diff!.matches ? (
          <p className="text-[12.5px] text-slate">Based on <span className="font-semibold text-charcoal">{baseTheme.name}</span>.</p>
        ) : (
          <p className="text-[12.5px] text-slate">
            Based on <span className="font-semibold text-charcoal">{baseTheme.name}</span> · {diff!.diffCount} setting{diff!.diffCount === 1 ? '' : 's'} customized
          </p>
        )}
        <Link to="../themes" className="text-[12px] font-semibold text-brand-orange no-underline whitespace-nowrap shrink-0">Switch theme →</Link>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-[12px] text-slate -mt-1">
          Every control below is independent — changing one, like button radius, never affects unrelated elements like product cards or images.
        </p>

          <ScopeSection id="brand" title="Brand" open={openSection === 'brand'} onToggle={toggleSection}>
            <p className="text-[12.5px] text-slate leading-relaxed">
              Your logo and store identity are edited on the <span className="font-semibold text-charcoal">Header</span> and <span className="font-semibold text-charcoal">Store Info</span> tabs — everything here only affects visual styling.
            </p>
          </ScopeSection>

          <ScopeSection id="colors" title="Colors" open={openSection === 'colors'} onToggle={toggleSection}>
            <div className="grid grid-cols-2 gap-4">
              <ColorField label="Primary"    value={value.primaryColor} onChange={hex => set({ primaryColor: hex })} />
              <ColorField label="Accent"     value={value.accentColor}  onChange={hex => set({ accentColor: hex })} />
              <ColorField label="Background" value={value.bgColor}      onChange={hex => set({ bgColor: hex })} />
              <ColorField label="Text"       value={value.textColor}    onChange={hex => set({ textColor: hex })} />
            </div>
          </ScopeSection>

          <ScopeSection id="typography" title="Typography" open={openSection === 'typography'} onToggle={toggleSection}>
            <Field label="Font" className="max-w-[280px]">
              <select className="w-full px-3 py-2 text-[13px] border border-bone rounded-lg bg-white" value={value.font} onChange={e => set({ font: e.target.value })}>
                {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </Field>
            <ScaleSegmentPicker label="Heading & body size" value={value.typeScale} onChange={v => set({ typeScale: v })}
              options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]} />
          </ScopeSection>

          <ScopeSection id="layout" title="Layout" open={openSection === 'layout'} onToggle={toggleSection}>
            <ScaleSegmentPicker label="Content width" value={value.containerWidth} onChange={v => set({ containerWidth: v })}
              options={[{ value: 'narrow', label: 'Narrow' }, { value: 'standard', label: 'Standard' }, { value: 'wide', label: 'Wide' }]} />
            <ScaleSegmentPicker label="Section spacing" value={value.sectionSpacing} onChange={v => set({ sectionSpacing: v })}
              options={[{ value: 'compact', label: 'Compact' }, { value: 'comfortable', label: 'Comfortable' }, { value: 'spacious', label: 'Spacious' }]} />
          </ScopeSection>

          <ScopeSection id="header" title="Header" open={openSection === 'header'} onToggle={toggleSection}>
            <p className="text-[12.5px] text-slate leading-relaxed">
              Header layout is currently <span className="font-semibold text-charcoal">{headerStyle === 'centered' ? 'Centered' : 'Standard'}</span> — edit layout, link position, and nav links on the <span className="font-semibold text-charcoal">Header</span> tab. Applying a gallery theme sets this automatically.
            </p>
          </ScopeSection>

          <ScopeSection id="hero" title="Hero" open={openSection === 'hero'} onToggle={toggleSection}>
            <IconOptionPicker label="Composition" value={value.heroStyle} onChange={v => set({ heroStyle: v })}
              options={[
                { value: 'overlay', label: 'Overlay', icon: <DiagramHeroOverlay /> },
                { value: 'split', label: 'Split', icon: <DiagramHeroSplit /> },
              ]} />
            <IconOptionPicker label="Text alignment" value={value.heroAlignment} onChange={v => set({ heroAlignment: v })}
              options={[
                { value: 'left', label: 'Left', icon: <AlignLeft size={16} /> },
                { value: 'center', label: 'Center', icon: <AlignCenter size={16} /> },
              ]} />
          </ScopeSection>

          <ScopeSection id="products" title="Products" open={openSection === 'products'} onToggle={toggleSection}>
            <StylePreviewPicker label="Card style" value={value.productCardStyle} onChange={v => set({ productCardStyle: v })}
              options={[{ value: 'flat', label: 'Flat' }, { value: 'outlined', label: 'Outlined' }, { value: 'elevated', label: 'Elevated' }]}
              renderPreview={opt => cardPreview(opt, RADIUS_PX_MAP[value.productCardRadius])}
            />
            <RadiusPicker label="Product card roundness" value={value.productCardRadius} onChange={v => set({ productCardRadius: v })} />
            <IconOptionPicker label="Image shape" value={value.productImageRatio} onChange={v => set({ productImageRatio: v })}
              options={[
                { value: 'square', label: 'Square', icon: <DiagramImageSquare /> },
                { value: 'portrait', label: 'Portrait', icon: <DiagramImagePortrait /> },
              ]} />
            <IconOptionPicker label="Image hover" value={value.productImageHover} onChange={v => set({ productImageHover: v })}
              options={[
                { value: 'none', label: 'None', icon: <DiagramHoverNone /> },
                { value: 'zoom', label: 'Zoom', icon: <DiagramHoverZoom /> },
              ]} />
            <ScaleSegmentPicker label="Grid density" value={value.productGridDensity} onChange={v => set({ productGridDensity: v })}
              options={[{ value: 'cozy', label: 'Cozy' }, { value: 'relaxed', label: 'Relaxed' }]} />
          </ScopeSection>

          <ScopeSection id="images" title="Images" open={openSection === 'images'} onToggle={toggleSection}>
            <RadiusPicker label="Content image roundness" value={value.imageRadius} onChange={v => set({ imageRadius: v })} />
          </ScopeSection>

          <ScopeSection id="buttons" title="Buttons" open={openSection === 'buttons'} onToggle={toggleSection}>
            <StylePreviewPicker label="Button style" value={value.buttonStyle} onChange={v => set({ buttonStyle: v })}
              options={[{ value: 'solid', label: 'Solid' }, { value: 'outline', label: 'Outline' }, { value: 'soft', label: 'Soft' }]}
              renderPreview={opt => buttonPreview(opt, value.primaryColor, RADIUS_PX_MAP[value.buttonRadius])}
            />
            <ScaleSegmentPicker label="Button size" value={value.buttonSize} onChange={v => set({ buttonSize: v })}
              options={[{ value: 'sm', label: 'Small' }, { value: 'md', label: 'Medium' }, { value: 'lg', label: 'Large' }]} />
            <RadiusPicker label="Button corner roundness" value={value.buttonRadius} onChange={v => set({ buttonRadius: v })} />
            <IconOptionPicker label="Button width" value={value.buttonWidth} onChange={v => set({ buttonWidth: v })}
              options={[
                { value: 'auto', label: 'Auto', icon: <DiagramButtonAuto /> },
                { value: 'full', label: 'Full width', icon: <DiagramButtonFull /> },
              ]} />
          </ScopeSection>

          <ScopeSection id="testimonials" title="Testimonials" open={openSection === 'testimonials'} onToggle={toggleSection}>
            <IconOptionPicker label="Layout" value={value.testimonialStyle} onChange={v => set({ testimonialStyle: v })}
              options={[
                { value: 'cards', label: 'Cards', icon: <DiagramTestimonialCards /> },
                { value: 'minimal', label: 'Minimal', icon: <DiagramTestimonialMinimal /> },
              ]} />
            {value.testimonialStyle === 'cards' && (
              <>
                <StylePreviewPicker label="Card style" value={value.testimonialCardStyle} onChange={v => set({ testimonialCardStyle: v })}
                  options={[{ value: 'flat', label: 'Flat' }, { value: 'outlined', label: 'Outlined' }, { value: 'elevated', label: 'Elevated' }]}
                  renderPreview={opt => cardPreview(opt, RADIUS_PX_MAP[value.testimonialCardRadius])}
                />
                <RadiusPicker label="Card roundness" value={value.testimonialCardRadius} onChange={v => set({ testimonialCardRadius: v })} />
              </>
            )}
          </ScopeSection>

          <ScopeSection id="faq" title="FAQ" open={openSection === 'faq'} onToggle={toggleSection}>
            <IconOptionPicker label="Layout" value={value.faqStyle} onChange={v => set({ faqStyle: v })}
              options={[
                { value: 'accordion', label: 'Accordion', icon: <DiagramAccordion /> },
                { value: 'list', label: 'Always expanded', icon: <DiagramListExpanded /> },
              ]} />
          </ScopeSection>

          <ScopeSection id="footer" title="Footer" open={openSection === 'footer'} onToggle={toggleSection}>
            <p className="text-[12.5px] text-slate leading-relaxed">
              Footer layout is currently <span className="font-semibold text-charcoal">{footerStyle === 'minimal' ? 'Minimal' : 'Columns'}</span> — edit layout, columns, social links, and copyright on the <span className="font-semibold text-charcoal">Footer</span> tab. Applying a gallery theme sets this automatically.
            </p>
          </ScopeSection>
          <ScopeSection id="advanced" title="Advanced" open={openSection === 'advanced'} onToggle={toggleSection}>
            <p className="text-[12.5px] text-slate leading-relaxed">
              Custom CSS and other developer-level theme authoring now live in their own dedicated workspace — see <span className="font-semibold text-charcoal">Edit Code</span> in the Online Store sidebar.
            </p>
          </ScopeSection>
      </div>
    </div>
  );
}
