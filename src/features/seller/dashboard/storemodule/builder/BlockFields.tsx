import { Field, ImageUpload, Toggle } from '@/components/comman/ui';
import { LinkTargetFields, type LinkTarget } from './LinkTargetFields';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';
const ta  = `${inp} resize-y min-h-[80px]`;

export interface PageOption { slug: string; title: string }

/** One block's settings-editing form, dispatched by `type`. Mirrors `SectionRenderer`'s per-type dispatch on the read side. */
export function BlockFields({ type, settings, onChange, pageOptions }: {
  type: string;
  settings: Record<string, any>;
  onChange: (next: Record<string, any>) => void;
  pageOptions: PageOption[];
}) {
  const set = (patch: Record<string, any>) => onChange({ ...settings, ...patch });

  switch (type) {
    case 'nav_link':
      return (
        <div className="flex flex-col gap-2">
          <Field label="Label"><input className={inp} value={settings.label ?? ''} onChange={e => set({ label: e.target.value })} /></Field>
          <LinkTargetFields value={settings as LinkTarget} onChange={next => onChange({ ...settings, ...next })} pageOptions={pageOptions} />
        </div>
      );

    case 'footer_column': {
      const links: any[] = settings.links ?? [];
      return (
        <div className="flex flex-col gap-3">
          <Field label="Column heading"><input className={inp} value={settings.heading ?? ''} onChange={e => set({ heading: e.target.value })} /></Field>
          <div className="flex flex-col gap-2">
            {links.map((link, i) => (
              <div key={i} className="border border-bone rounded-lg p-2 relative">
                <button type="button" onClick={() => set({ links: links.filter((_, j) => j !== i) })}
                  className="absolute top-1 right-1 text-[11px] text-error bg-transparent border-none cursor-pointer">Remove</button>
                <Field label="Label"><input className={inp} value={link.label ?? ''} onChange={e => set({ links: links.map((l, j) => j === i ? { ...l, label: e.target.value } : l) })} /></Field>
                <LinkTargetFields value={link} onChange={next => set({ links: links.map((l, j) => j === i ? { ...l, ...next } : l) })} pageOptions={pageOptions} />
              </div>
            ))}
            {links.length < 10 && (
              <button type="button" onClick={() => set({ links: [...links, { label: '', linkType: 'home' }] })}
                className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add link</button>
            )}
          </div>
        </div>
      );
    }

    case 'social_link':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Field label="Platform">
            <select className={inp} value={settings.platform ?? 'facebook'} onChange={e => set({ platform: e.target.value })}>
              {['facebook', 'instagram', 'x', 'tiktok', 'youtube', 'linkedin', 'whatsapp'].map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </Field>
          <Field label="Profile URL"><input className={inp} placeholder="https://…" value={settings.url ?? ''} onChange={e => set({ url: e.target.value })} /></Field>
        </div>
      );

    case 'copyright_text':
      return <Field label="Copyright text" hint="Leave blank to show a default © line with your store name."><input className={inp} value={settings.text ?? ''} onChange={e => set({ text: e.target.value })} /></Field>;

    case 'hero_slide':
      return (
        <div className="flex flex-col gap-2">
          <Field label="Image" required>
            <ImageUpload value={settings.imageUrl ? [settings.imageUrl] : []} onChange={urls => set({ imageUrl: urls[0] ?? '' })} maxFiles={1} />
          </Field>
          <Field label="Heading"><input className={inp} value={settings.heading ?? ''} onChange={e => set({ heading: e.target.value })} /></Field>
          <Field label="Subheading"><input className={inp} value={settings.subheading ?? ''} onChange={e => set({ subheading: e.target.value })} /></Field>
          <Field label="Button text"><input className={inp} value={settings.ctaText ?? ''} onChange={e => set({ ctaText: e.target.value })} /></Field>
          {settings.ctaText && <LinkTargetFields value={settings.ctaLink ?? { linkType: 'home' }} onChange={ctaLink => set({ ctaLink })} pageOptions={pageOptions} />}
        </div>
      );

    case 'heading':
      return <Field label="Heading text"><input className={inp} value={settings.text ?? ''} onChange={e => set({ text: e.target.value })} /></Field>;
    case 'paragraph':
      return <Field label="Paragraph text"><textarea className={ta} value={settings.text ?? ''} onChange={e => set({ text: e.target.value })} /></Field>;
    case 'image':
      return <Field label="Image"><ImageUpload value={settings.imageUrl ? [settings.imageUrl] : []} onChange={urls => set({ imageUrl: urls[0] ?? '' })} maxFiles={1} /></Field>;
    case 'quote':
      return (
        <div className="flex flex-col gap-2">
          <Field label="Quote"><textarea className={ta} value={settings.text ?? ''} onChange={e => set({ text: e.target.value })} /></Field>
          <Field label="Author (optional)"><input className={inp} value={settings.author ?? ''} onChange={e => set({ author: e.target.value })} /></Field>
        </div>
      );
    case 'list': {
      const items: string[] = settings.items ?? [''];
      return (
        <div className="flex flex-col gap-2">
          {items.map((item, i) => (
            <div key={i} className="flex gap-2">
              <input className={inp} value={item} onChange={e => set({ items: items.map((it, j) => j === i ? e.target.value : it) })} />
              <button type="button" onClick={() => set({ items: items.filter((_, j) => j !== i) })} className="text-error bg-transparent border-none cursor-pointer px-2">×</button>
            </div>
          ))}
          {items.length < 20 && <button type="button" onClick={() => set({ items: [...items, ''] })} className="text-[12px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer text-left">+ Add item</button>}
        </div>
      );
    }
    case 'divider':
      return <p className="text-[12px] text-slate italic">A plain divider line — no settings.</p>;

    case 'image_text_pair':
      return (
        <div className="flex flex-col gap-2">
          <Field label="Image" required><ImageUpload value={settings.imageUrl ? [settings.imageUrl] : []} onChange={urls => set({ imageUrl: urls[0] ?? '' })} maxFiles={1} /></Field>
          <Field label="Heading"><input className={inp} value={settings.heading ?? ''} onChange={e => set({ heading: e.target.value })} /></Field>
          <Field label="Body"><textarea className={ta} value={settings.body ?? ''} onChange={e => set({ body: e.target.value })} /></Field>
          <Field label="Button text"><input className={inp} value={settings.ctaText ?? ''} onChange={e => set({ ctaText: e.target.value })} /></Field>
          {settings.ctaText && <LinkTargetFields value={settings.ctaLink ?? { linkType: 'home' }} onChange={ctaLink => set({ ctaLink })} pageOptions={pageOptions} />}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-charcoal">Image on the right</span>
            <Toggle checked={settings.imagePosition === 'right'} onChange={v => set({ imagePosition: v ? 'right' : 'left' })} />
          </div>
        </div>
      );

    case 'testimonial':
      return (
        <div className="flex flex-col gap-2">
          <Field label="Quote"><textarea className={ta} value={settings.quote ?? ''} onChange={e => set({ quote: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Author name" required><input className={inp} value={settings.authorName ?? ''} onChange={e => set({ authorName: e.target.value })} /></Field>
            <Field label="Author role"><input className={inp} value={settings.authorRole ?? ''} onChange={e => set({ authorRole: e.target.value })} /></Field>
          </div>
          <Field label="Rating (1-5)">
            <input type="number" min={1} max={5} className={inp} value={settings.rating ?? 5} onChange={e => set({ rating: Number(e.target.value) })} />
          </Field>
        </div>
      );

    case 'faq_item':
      return (
        <div className="flex flex-col gap-2">
          <Field label="Question"><input className={inp} value={settings.question ?? ''} onChange={e => set({ question: e.target.value })} /></Field>
          <Field label="Answer"><textarea className={ta} value={settings.answer ?? ''} onChange={e => set({ answer: e.target.value })} /></Field>
        </div>
      );

    default:
      return null;
  }
}
