import { useEffect, useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { Download, KeyRound, Mail, Radio, Terminal } from 'lucide-react';
import { Button, CopyIconButton, Footer, SkeletonBox } from '@/components/comman/ui';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { apiGetOpenApiSpec, openApiUrl, type OpenApiOperation, type OpenApiParameter, type OpenApiSchema, type OpenApiSpec } from '@/api/services/developers';
import { SALES_EMAIL } from '@/utils/contact';

/**
 * www.solvexo.store/developers — the Solvexo Admin API reference. The endpoint list is read from the API's own
 * OpenAPI file, so it always matches what the server does. English only, like the legal pages: technical text needs a
 * reviewed translation. Title and description come from src/seo/publicPages.
 */
export function DevelopersPage() {
  const [spec, setSpec] = useState<OpenApiSpec | null>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    apiGetOpenApiSpec().then(s => { if (alive) setSpec(s); }).catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [attempt]);
  const retry = () => { setError(false); setSpec(null); setAttempt(a => a + 1); };

  const baseUrl = spec?.servers?.[0]?.url ?? 'https://api.solvexo.store/api/merchant/v1';
  const curl = `curl ${baseUrl}/orders?limit=10 \\\n  -H "Authorization: Bearer sxk_your_token"`;

  return (
    <div className="bg-cream min-h-full">
      <section className="px-4 md:px-8 lg:px-12 pt-14 md:pt-20 pb-8 max-w-[1100px] mx-auto">
        <SectionHeading
          as="h1"
          kicker="Developers"
          title="Build on Solvexo"
          subtitle="Connect any app, marketing tool or back office to a Solvexo store. Read orders, products, stock and customers, ship orders, and hear about changes the moment they happen."
          size="lg"
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={openApiUrl()} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-orange text-white px-5 py-3 text-[14px] font-semibold hover:opacity-90">
            <Download size={16} aria-hidden /> OpenAPI file
          </a>
          <a href={`mailto:${SALES_EMAIL}?subject=Solvexo%20API`} className="inline-flex items-center gap-2 rounded-xl border border-bone bg-white text-carbon px-5 py-3 text-[14px] font-semibold hover:border-brand-orange/40">
            <Mail size={16} aria-hidden /> Ask the team
          </a>
        </div>
      </section>

      {/* ── Get started ── */}
      <section className="px-4 md:px-8 lg:px-12 pb-12 max-w-[1100px] mx-auto">
        <h2 className="text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-carbon">Get started</h2>
        <ol className="mt-5 grid md:grid-cols-3 gap-5">
          <Step n={1} icon={<KeyRound size={16} aria-hidden />} title="Get a token">
            The store owner creates one in <strong>Settings → Webhooks &amp; API → API tokens</strong> and chooses what it may read or change. It is shown once.
          </Step>
          <Step n={2} icon={<Terminal size={16} aria-hidden />} title="Make a call">
            Send it as a Bearer token in the <strong>Authorization</strong> header, as below. A token only ever sees its own store.
          </Step>
          <Step n={3} icon={<Radio size={16} aria-hidden />} title="Listen for changes">
            Add a webhook in the same settings page to get orders, stock and customer changes as they happen, instead of asking every few minutes.
          </Step>
        </ol>
        <CodeBlock code={curl} />
      </section>

      {/* ── How it works ── */}
      <section className="px-4 md:px-8 lg:px-12 pb-12 max-w-[1100px] mx-auto">
        <h2 className="text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-carbon">How it works</h2>
        <div className="mt-5 grid md:grid-cols-2 gap-5">
          {GUIDES.map(g => (
            <article key={g.title} className="bg-white border border-bone rounded-2xl p-6">
              <h3 className="text-[16px] font-semibold text-carbon">{g.title}</h3>
              <div className="mt-2 text-[14px] leading-[1.7] text-slate">{g.body}</div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Reference, from the API's own OpenAPI file ── */}
      <section className="px-4 md:px-8 lg:px-12 pb-12 max-w-[1100px] mx-auto">
        <h2 className="text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-carbon">API reference</h2>
        {spec && <p className="mt-1 text-[13px] text-slate">Version {spec.info.version} · <span dir="ltr" className="font-mono">{baseUrl}</span></p>}
        <div className="mt-5">
          {error ? (
            <div className="flex flex-col items-center gap-3 py-14 bg-white border border-bone rounded-2xl">
              <p className="text-[13px] text-error text-center">We could not load the API reference.</p>
              <Button variant="outline" size="sm" onClick={retry}>Try again</Button>
            </div>
          ) : !spec ? (
            <ReferenceSkeleton />
          ) : (
            <Reference spec={spec} />
          )}
        </div>
      </section>

      {spec?.webhooks && (
        <section className="px-4 md:px-8 lg:px-12 pb-16 max-w-[1100px] mx-auto">
          <h2 className="text-[24px] font-semibold leading-[1.25] tracking-[-0.02em] text-carbon">Webhook events</h2>
          <p className="mt-1 text-[14px] leading-[1.7] text-slate">Each event is a POST with a JSON body <span className="font-mono text-[13px]">{'{ id, event, created_at, store_id, data }'}</span>. What <span className="font-mono text-[13px]">data</span> holds:</p>
          <div className="mt-5 bg-white border border-bone rounded-2xl overflow-x-auto">
            <table className="w-full text-[13.5px]">
              <thead>
                <tr className="text-start border-b border-bone">
                  <th scope="col" className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep-orange">Event</th>
                  <th scope="col" className="px-5 py-3 text-start text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep-orange">Data</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(spec.webhooks).map(([event, w]) => (
                  <tr key={event} className="border-b border-bone last:border-0">
                    <td className="px-5 py-3 font-mono text-carbon whitespace-nowrap">{event}</td>
                    <td className="px-5 py-3 font-mono text-[12.5px] text-slate">{webhookData(w.post)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="px-4 md:px-8 lg:px-12 pb-20 max-w-[1100px] mx-auto">
        <p className="text-[14px] text-slate">
          Building an integration or listing your app for Solvexo sellers? Email us at <a href={`mailto:${SALES_EMAIL}`} className="font-semibold text-brand-orange">{SALES_EMAIL}</a>.
        </p>
      </section>
      <Footer />
    </div>
  );
}

const code = (s: string) => <code dir="ltr" className="font-mono text-[12.5px] text-carbon bg-mist rounded px-1 py-0.5">{s}</code>;

const GUIDES: { title: string; body: React.ReactNode }[] = [
  { title: 'Permissions', body: <>Each token has scopes such as {code('read_orders')} or {code('write_inventory')}. A write scope includes the matching read scope. Calling an endpoint without its scope answers 403.</> },
  { title: 'Paging and syncing', body: <>Lists return {code('{ items, has_more, next_cursor }')}, newest first. Pass {code('next_cursor')} as {code('cursor')} for the next page, and {code('updated_since')} to fetch only what changed since your last run.</> },
  { title: 'Rate limits', body: <>120 requests a minute per token. Every answer has {code('X-RateLimit-Remaining')} and {code('X-RateLimit-Reset')}; a 429 also has {code('Retry-After')} in seconds.</> },
  { title: 'Safe retries', body: <>Every change needs an {code('Idempotency-Key')} header, such as a UUID. Sending the same key again returns the first answer and never applies the change twice.</> },
  { title: 'Webhook signatures', body: <>Check {code('X-Solvexo-Signature: t=…,v1=…')}: v1 is the HMAC-SHA256 of {code('"<t>.<raw body>"')} with your webhook secret. Refuse ones older than 5 minutes and ignore a repeated {code('X-Solvexo-Delivery')}.</> },
  { title: 'Apps for every seller (OAuth)', body: <>Register an app in the dashboard under <strong>Build apps</strong>. Send store owners to {code('https://www.solvexo.store/oauth/authorize')} with {code('client_id')}, {code('redirect_uri')}, {code('scope')} and {code('state')}. They pick a store and allow it; swap the {code('code')} you get back at {code('POST /api/app-platform/oauth/token')} (grant_type authorization_code). Test it on a free development store.</> },
  { title: 'Money and dates', body: <>Amounts are in major units of the record's currency (an order's {code('currency')}). Dates are ISO 8601 in UTC.</> },
];

function Step({ n, icon, title, children }: { n: number; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="bg-white border border-bone rounded-2xl p-6 flex flex-col gap-2 min-w-0">
      <p className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep-orange">{icon} Step {n}</p>
      <h3 className="text-[16px] font-semibold text-carbon">{title}</h3>
      <div className="text-[14px] leading-[1.7] text-slate">{children}</div>
    </li>
  );
}

function CodeBlock({ code: text }: { code: string }) {
  return (
    <div className="mt-5 flex items-start gap-2 rounded-2xl bg-carbon p-4 md:p-5">
      <pre dir="ltr" className="flex-1 min-w-0 overflow-x-auto text-cream text-[12.5px] leading-[1.7] font-mono">{text}</pre>
      <CopyIconButton value={text} title="Copy the example" size={14} className="shrink-0 text-cream" />
    </div>
  );
}

function ReferenceSkeleton() {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-label="Loading the API reference">
      {[0, 1, 2].map(i => (
        <div key={i} className="bg-white border border-bone rounded-2xl p-6 flex flex-col gap-3">
          <SkeletonBox height={14} width="30%" />
          <SkeletonBox height={12} width={`${60 + i * 10}%`} />
        </div>
      ))}
    </div>
  );
}

const METHOD_STYLE: Record<string, string> = {
  get: 'bg-mist text-graphite',
  post: 'bg-brand-pale-orange text-brand-deep-orange',
  patch: 'bg-brand-pale-orange text-brand-deep-orange',
  put: 'bg-brand-pale-orange text-brand-deep-orange',
  delete: 'bg-brand-pale-orange text-brand-deep-orange',
};

/** Endpoints grouped by tag, in the order the file lists the tags. */
function Reference({ spec }: { spec: OpenApiSpec }) {
  const groups = useMemo(() => {
    const byTag = new Map<string, { method: string; path: string; op: OpenApiOperation }[]>();
    for (const t of spec.tags ?? []) byTag.set(t.name, []);
    for (const [path, ops] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(ops)) {
        const tag = op.tags?.[0] ?? 'Other';
        if (!byTag.has(tag)) byTag.set(tag, []);
        byTag.get(tag)!.push({ method, path, op });
      }
    }
    return [...byTag.entries()].filter(([, ops]) => ops.length > 0);
  }, [spec]);
  return (
    <div className="flex flex-col gap-9">
      {groups.map(([tag, ops]) => (
        <div key={tag}>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-deep-orange">{tag}</h3>
          <div className="mt-3 flex flex-col gap-4">
            {ops.map(o => <Operation key={o.op.operationId} spec={spec} {...o} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function Operation({ spec, method, path, op }: { spec: OpenApiSpec; method: string; path: string; op: OpenApiOperation }) {
  const params = (op.parameters ?? []).filter(p => p.in !== 'header' || p.name === 'Idempotency-Key');
  const body = resolve(spec, op.requestBody?.content?.['application/json']?.schema);
  const ok = resolve(spec, op.responses?.['200']?.content?.['application/json']?.schema);
  return (
    <article id={op.operationId} className="bg-white border border-bone rounded-2xl p-5 md:p-6 scroll-mt-24">
      <div className="flex flex-wrap items-center gap-2" dir="ltr">
        <span className={clsx('rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.08em]', METHOD_STYLE[method] ?? 'bg-mist text-graphite')}>{method}</span>
        <span className="font-mono text-[13.5px] text-carbon break-all">{path}</span>
      </div>
      <h4 className="mt-3 text-[16px] font-semibold text-carbon">{op.summary}</h4>
      {op.description && <p className="mt-1 text-[14px] leading-[1.7] text-slate">{rich(op.description)}</p>}
      {op['x-required-scope'] && <p className="mt-2 text-[13px] text-slate">Permission: {code(op['x-required-scope'])}</p>}
      {params.length > 0 && <Details title="Parameters"><ParamTable params={params} /></Details>}
      {body?.properties && <Details title="Request body"><FieldTable spec={spec} schema={body} /></Details>}
      {ok && <Details title="Response"><ResponseFields spec={spec} schema={ok} /></Details>}
    </article>
  );
}

function Details({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <details className="mt-3 group border-t border-bone pt-3">
      <summary className="cursor-pointer text-[13px] font-semibold text-carbon hover:text-brand-orange">{title}</summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function ParamTable({ params }: { params: OpenApiParameter[] }) {
  return (
    <dl className="m-0">
      {params.map(p => (
        <FieldRow key={`${p.in}:${p.name}`} name={p.name} required={p.required} type={`${p.in} · ${typeLabel(p.schema)}`}>
          {rich(p.description)}{enumLabel(p.schema)}
        </FieldRow>
      ))}
    </dl>
  );
}

/** One field: name and type, then what it means. Side by side on a wide screen, stacked on a phone. */
function FieldRow({ name, required, type, children }: { name: string; required?: boolean; type: string; children: React.ReactNode }) {
  return (
    <div className="grid md:grid-cols-[minmax(0,200px)_minmax(0,150px)_minmax(0,1fr)] gap-x-4 gap-y-0.5 py-2 border-b border-bone last:border-0 text-[13px]">
      <dt className="flex flex-wrap items-baseline gap-x-2 md:contents">
        <span dir="ltr" className="font-mono text-carbon break-all">{name}{required && <span className="ms-1 text-brand-deep-orange">*</span>}</span>
        <span className="text-slate">{type}</span>
      </dt>
      <dd className="m-0 text-slate leading-[1.6] min-w-0">{children}</dd>
    </div>
  );
}

/** A list response shows the fields of one item; anything else shows its own fields. */
function ResponseFields({ spec, schema }: { spec: OpenApiSpec; schema: OpenApiSchema }) {
  const item = schema.properties?.items?.items ? resolve(spec, schema.properties.items.items) : null;
  if (item?.properties) {
    return (
      <>
        <p className="mb-2 text-[13px] text-slate">{code('{ items, has_more, next_cursor }')}, where each item has:</p>
        <FieldTable spec={spec} schema={item} />
      </>
    );
  }
  return <FieldTable spec={spec} schema={schema} />;
}

function FieldTable({ spec, schema }: { spec: OpenApiSpec; schema: OpenApiSchema }) {
  const required = new Set(schema.required ?? []);
  return (
    <dl className="m-0">
      {Object.entries(schema.properties ?? {}).map(([name, raw]) => {
        const f = resolve(spec, raw) ?? raw;
        const nested = f.type === 'array' || (Array.isArray(f.type) && f.type.includes('array')) ? resolve(spec, f.items) : f.properties ? f : null;
        return (
          <FieldRow key={name} name={name} required={required.has(name)} type={typeLabel(raw, spec)}>
            {rich(f.description)}{enumLabel(f)}
            {nested?.properties && <span dir="ltr" className="block mt-1 font-mono text-[12px] break-words">{Object.keys(nested.properties).join(', ')}</span>}
          </FieldRow>
        );
      })}
    </dl>
  );
}

/** Descriptions in the OpenAPI file mark names with `backticks` (and **bold**): show those as code and bold. */
function rich(text: string | undefined): React.ReactNode {
  if (!text) return null;
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 2 ? <span key={i}>{code(part.slice(1, -1))}</span>
      : part.startsWith('**') && part.endsWith('**') && part.length > 4 ? <strong key={i} className="font-semibold text-carbon">{part.slice(2, -2)}</strong>
        : part);
}

function resolve(spec: OpenApiSpec, s: OpenApiSchema | undefined): OpenApiSchema | null {
  if (!s) return null;
  if (s.$ref) return spec.components?.schemas?.[s.$ref.split('/').pop() ?? ''] ?? null;
  const ref = s.oneOf?.find(x => x.$ref);
  return ref ? resolve(spec, ref) : s;
}

function typeLabel(s: OpenApiSchema | undefined, spec?: OpenApiSpec): string {
  if (!s) return '';
  if (s.$ref) return s.$ref.split('/').pop() ?? 'object';
  if (s.oneOf) return s.oneOf.map(x => typeLabel(x, spec)).join(' or ');
  const types = (Array.isArray(s.type) ? s.type : [s.type ?? 'object']).filter(Boolean) as string[];
  return types.map(t => (t === 'array' ? `${typeLabel(s.items, spec) || 'any'}[]` : t)).join(' or ');
}

function enumLabel(s: OpenApiSchema | null | undefined) {
  const values = (s?.enum ?? []).filter(v => v !== null);
  return values.length ? <span dir="ltr" className="block mt-1 font-mono text-[12px] break-words">{values.join(' | ')}</span> : null;
}

function webhookData(op: OpenApiOperation | undefined): string {
  return op?.requestBody?.content?.['application/json']?.schema?.description ?? '';
}
