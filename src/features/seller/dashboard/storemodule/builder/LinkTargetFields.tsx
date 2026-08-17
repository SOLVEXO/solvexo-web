import { Field } from '@/components/comman/ui';

export interface LinkTarget {
  linkType: 'home' | 'page' | 'blog' | 'external';
  pageSlug?: string;
  url?: string;
}

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg text-charcoal bg-white outline-none';

/** Shared editor for any `{linkType, pageSlug?, url?}` target — nav links, footer links, hero/image CTAs. */
export function LinkTargetFields({ value, onChange, pageOptions }: {
  value: LinkTarget;
  onChange: (next: LinkTarget) => void;
  pageOptions: { slug: string; title: string }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Field label="Links to">
        <select className={inp} value={value.linkType} onChange={e => onChange({ ...value, linkType: e.target.value as LinkTarget['linkType'] })}>
          <option value="home">Home page</option>
          <option value="blog">Blog</option>
          <option value="page">A page…</option>
          <option value="external">External URL</option>
        </select>
      </Field>
      {value.linkType === 'page' && (
        <Field label="Page">
          <select className={inp} value={value.pageSlug ?? ''} onChange={e => onChange({ ...value, pageSlug: e.target.value })}>
            <option value="">Select a page</option>
            {pageOptions.map(p => <option key={p.slug} value={p.slug}>{p.title}</option>)}
          </select>
        </Field>
      )}
      {value.linkType === 'external' && (
        <Field label="URL">
          <input className={inp} placeholder="https://…" value={value.url ?? ''} onChange={e => onChange({ ...value, url: e.target.value })} />
        </Field>
      )}
    </div>
  );
}
