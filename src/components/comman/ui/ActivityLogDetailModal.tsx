import { useEffect, useState } from 'react';
import { MapPin, Monitor, ExternalLink, Clock } from 'lucide-react';
import { Modal } from './Modal';
import { Badge } from './Badge';
import { Button } from './Button';

/** Loose shape covering both `ActivityLogEntry` (seller) and `AdminActivityLogEntry`
 *  (admin) — every field either type actually has, typed generically here so
 *  this one component serves both without importing either concrete type. */
export interface ActivityLogDetailEntry {
  _id: string;
  storeId: string;
  actorId: string | null;
  actorName: string | null;
  actorRole: string | null;
  category: string;
  action: string;
  title?: string;
  isSystem?: boolean;
  /** The entry's own store currency / timezone (server-enriched). */
  storeCurrency?: string | null;
  storeTimezone?: string | null;
  description: string | null;
  targetId: string | null;
  targetType: string | null;
  ip: string | null;
  location: { city: string | null; country: string | null } | null;
  device: string | null;
  isSecurityAlert: boolean;
  metadata: Record<string, any> | null;
  createdAt: string;
}

function actionTitle(action: string) {
  const s = action.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function locationLabel(loc: ActivityLogDetailEntry['location']) {
  if (!loc || (!loc.city && !loc.country)) return null;
  return [loc.city, loc.country].filter(Boolean).join(', ');
}

function fieldLabel(field: string) {
  return field.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase()).trim();
}

/** Best-effort display for a diffed field's value — a bare number is
 *  ambiguous (0.08 could be 8% or $0.08), so this leans on the field's own
 *  name (same convention every call site already uses: *rate as a 0-1
 *  fraction, *price/*amount in the seller's real currency units). */
function money(value: number, currency: string): string {
  try { return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value); } catch { return `${currency} ${value.toFixed(2)}`; }
}

function fieldValue(field: string, value: unknown, currency: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (typeof value === 'number') {
    if (/rate$/i.test(field)) return `${(value * 100).toFixed(2)}%`;
    if (/(price|amount|cost|fee|total|balance)$/i.test(field)) return money(value, currency);
    return String(value);
  }
  if (typeof value === 'object') { try { return JSON.stringify(value); } catch { return String(value); } }
  return String(value);
}

/** "Nov 23, 2026, 10:00 AM" in the store's own timezone (falls back to the browser's if the zone is missing/invalid). */
function formatWhen(iso: string, timeZone?: string | null): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const opts: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' };
  try { return d.toLocaleString('en-US', timeZone ? { ...opts, timeZone } : opts); } catch { return d.toLocaleString('en-US', opts); }
}

function isDiffMetadata(metadata: Record<string, any>): metadata is { changes: { field: string; before: unknown; after: unknown }[] } {
  return Array.isArray(metadata.changes);
}

export interface ActivityLogDetailModalProps {
  entry: ActivityLogDetailEntry;
  onClose: () => void;
  /** Seller can link straight to the real order/product page; admin usually can't — omit to skip the link. */
  targetHref?: string | null;
  /** Lazy-loads this entity's full history on demand — omitted (or a target-less entry) hides the section entirely. */
  fetchTimeline?: (targetId: string) => Promise<{ data: ActivityLogDetailEntry[] }>;
  /** ISO currency of the store this entry belongs to — money fields in the diff are shown in it (admin views are USD). Default USD. */
  currency?: string;
  /** IANA timezone of the store — all times are shown in it. Default: the viewer's own. */
  timeZone?: string | null;
}

export function ActivityLogDetailModal({ entry, onClose, targetHref, fetchTimeline, currency: currencyProp = 'USD', timeZone: timeZoneProp }: ActivityLogDetailModalProps) {
  // The entry's own store wins: a platform-wide (admin) view then still shows a PKR store's values in PKR and its times in that store's zone.
  const currency = entry.storeCurrency ?? currencyProp;
  const timeZone = entry.storeTimezone ?? timeZoneProp;
  const [timeline, setTimeline] = useState<ActivityLogDetailEntry[] | null>(null);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [timelineError, setTimelineError] = useState('');
  const [showTimeline, setShowTimeline] = useState(false);

  useEffect(() => { setTimeline(null); setShowTimeline(false); }, [entry._id]);

  async function loadTimeline() {
    if (!fetchTimeline || !entry.targetId) return;
    setShowTimeline(true);
    if (timeline) return;
    setLoadingTimeline(true);
    setTimelineError('');
    try {
      const res = await fetchTimeline(entry.targetId);
      setTimeline(res.data ?? []);
    } catch (err) {
      setTimelineError(err instanceof Error ? err.message : 'Failed to load timeline.');
    } finally {
      setLoadingTimeline(false);
    }
  }

  const location = locationLabel(entry.location);

  return (
    <Modal mobileSheet title="Activity Detail" width={560} onClose={onClose} footer={<Button variant="outline" onClick={onClose}>Close</Button>}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="text-[15px] font-bold text-charcoal">{entry.title ?? actionTitle(entry.action)}</p>
          <div className="flex items-center gap-1.5">
            {entry.isSecurityAlert && <Badge color="red" size="sm">Security Alert</Badge>}
            <Badge size="sm">{entry.category}</Badge>
          </div>
        </div>

        {entry.description && <p className="text-[13px] text-graphite leading-[1.5]">{entry.description}</p>}

        <div className="grid grid-cols-2 gap-3 bg-cream border border-bone rounded-[8px] px-3.5 py-3 text-[12.5px]">
          <div>
            <span className="text-slate flex items-center gap-1"><Clock size={11} /> When</span>
            <p className="font-medium text-carbon mt-0.5">{formatWhen(entry.createdAt, timeZone)}</p>
          </div>
          <div>
            <span className="text-slate">Actor</span>
            <p className="font-medium text-carbon mt-0.5">{entry.actorName ?? '—'} {entry.actorRole && <span className="text-slate">({entry.actorRole})</span>}</p>
          </div>
          <div>
            <span className="text-slate flex items-center gap-1"><MapPin size={11} /> Where from</span>
            <p className="font-medium text-carbon mt-0.5">
              {entry.ip ?? '—'}{location && <span className="text-slate"> · {location}</span>}
            </p>
          </div>
          <div>
            <span className="text-slate flex items-center gap-1"><Monitor size={11} /> Device</span>
            <p className="font-medium text-carbon mt-0.5">{entry.device ?? '—'}</p>
          </div>
          <div>
            <span className="text-slate">Store</span>
            <p className="font-medium text-carbon mt-0.5">{entry.storeId === 'platform' ? 'Platform' : entry.storeId}</p>
          </div>
          {entry.targetId && (
            <div>
              <span className="text-slate">Target</span>
              <p className="font-medium text-carbon mt-0.5 flex items-center gap-1.5">
                {entry.targetType ?? 'item'}: <span className="font-mono text-[11.5px]">{entry.targetId}</span>
                {targetHref && (
                  <a href={targetHref} target="_blank" rel="noreferrer" className="text-brand-orange hover:underline inline-flex items-center gap-0.5">
                    View <ExternalLink size={10} />
                  </a>
                )}
              </p>
            </div>
          )}
        </div>

        {entry.metadata && isDiffMetadata(entry.metadata) && entry.metadata.changes.length > 0 && (
          <div className="rounded-[8px] border border-bone overflow-hidden">
            <p className="px-3 py-2 text-[12px] font-semibold text-charcoal bg-cream border-b border-bone">What changed</p>
            <div className="flex flex-col divide-y divide-bone">
              {entry.metadata.changes.map((c) => (
                <div key={c.field} className="flex items-center justify-between gap-2 px-3 py-2 text-[12.5px]">
                  <span className="text-slate">{fieldLabel(c.field)}</span>
                  <span className="font-medium text-carbon">
                    <span className="text-slate line-through">{fieldValue(c.field, c.before, currency)}</span>
                    {' → '}
                    <span className="text-brand-orange">{fieldValue(c.field, c.after, currency)}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {entry.metadata && !isDiffMetadata(entry.metadata) && Object.keys(entry.metadata).length > 0 && (
          <details className="rounded-[8px] border border-bone">
            <summary className="cursor-pointer px-3 py-2 text-[12px] font-semibold text-charcoal">Raw metadata</summary>
            <pre className="text-[11px] text-slate bg-cream px-3 py-2.5 overflow-x-auto m-0 rounded-b-[8px]">{JSON.stringify(entry.metadata, null, 2)}</pre>
          </details>
        )}

        {fetchTimeline && entry.targetId && (
          <div className="border-t border-bone pt-3">
            {!showTimeline ? (
              <button onClick={loadTimeline} className="text-[12.5px] font-semibold text-brand-orange bg-transparent border-none cursor-pointer p-0 hover:underline">
                View full history for this {entry.targetType ?? 'item'} →
              </button>
            ) : loadingTimeline ? (
              <p className="text-[12px] text-slate">Loading timeline…</p>
            ) : timelineError ? (
              <p className="text-[12px] text-error">{timelineError}</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
                {(timeline ?? []).map(t => (
                  <div key={t._id} className="flex items-start gap-2 text-[12px]">
                    <span className="text-slate whitespace-nowrap shrink-0">{formatWhen(t.createdAt, timeZone)}</span>
                    <span className="text-charcoal">{actionTitle(t.action)}{t.actorName ? ` — ${t.actorName}` : ''}</span>
                  </div>
                ))}
                {(timeline ?? []).length === 0 && <p className="text-[12px] text-slate">No other events for this item.</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
