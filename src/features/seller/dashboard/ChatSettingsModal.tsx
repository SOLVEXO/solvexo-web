import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Plus, Store as StoreIcon, Trash2 } from 'lucide-react';
import { Input, SkeletonBox } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { useToast } from '@/contexts/ToastContext';
import { apiUploadMediaAsset } from '@/api/services/mediaLibrary';
import { apiGetStoreChatSettings, apiSaveStoreChatSettings, type ChatHoursDay, type QuickReply } from '@/api/services/storeChatSettings';

const DEFAULT_LINE = 'We reply as soon as we can';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MAX_QUICK = 20;

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-bone pt-4">
      <div>
        <h3 className="text-[13px] font-semibold text-charcoal">{title}</h3>
        {hint && <p className="mt-0.5 text-[11.5px] text-slate">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Seller-side "Chat settings": what buyers see in the chat (photo, name, line, welcome), the automatic reply with its
 *  opening hours, and the seller's own quick replies. An empty text field means the default. */
export function ChatSettingsModal({ storeId, storeName, storeLogo, onClose, onSaved }: {
  storeId: string; storeName: string; storeLogo?: string | null; onClose: () => void; onSaved?: (quickReplies: QuickReply[]) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [name, setName] = useState('');
  const [statusLine, setStatusLine] = useState('');
  const [greeting, setGreeting] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyText, setAutoReplyText] = useState('');
  const [onlyOutside, setOnlyOutside] = useState(false);
  const [hours, setHours] = useState<ChatHoursDay[]>([]);
  const [quick, setQuick] = useState<QuickReply[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    apiGetStoreChatSettings(storeId)
      .then(res => {
        if (!live) return;
        const d = res.data;
        setAvatarUrl(d.avatarUrl ?? ''); setName(d.name ?? ''); setStatusLine(d.statusLine ?? ''); setGreeting(d.greeting ?? '');
        setAutoReplyEnabled(d.autoReplyEnabled); setAutoReplyText(d.autoReplyText ?? ''); setOnlyOutside(d.autoReplyOnlyOutsideHours);
        setHours(d.hours); setQuick(d.quickReplies);
      })
      .catch((err: unknown) => { if (live) setLoadError(err instanceof Error ? err.message : 'Could not load the chat settings.'); })
      .finally(() => { if (live) setLoading(false); });
    return () => { live = false; };
  }, [storeId, attempt]);
  const retry = () => { setLoading(true); setLoadError(''); setAttempt(a => a + 1); };

  const pick = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Please choose an image file.'); return; }
    setUploading(true); setError('');
    try {
      const res = await apiUploadMediaAsset(storeId, file);
      setAvatarUrl(res.data.url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'The photo could not be uploaded.');
    } finally { setUploading(false); }
  };

  const setDay = (day: number, patch: Partial<ChatHoursDay>) => setHours(prev => prev.map(h => (h.day === day ? { ...h, ...patch } : h)));
  const setQuickAt = (i: number, patch: Partial<QuickReply>) => setQuick(prev => prev.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  const save = async () => {
    if (autoReplyEnabled && !autoReplyText.trim()) { setError('Write the automatic reply message first.'); return; }
    const cleanQuick = quick.map(q => ({ title: q.title.trim(), text: q.text.trim() })).filter(q => q.title || q.text);
    if (cleanQuick.some(q => !q.title || !q.text)) { setError('Each quick reply needs both a short name and a message.'); return; }
    setSaving(true); setError('');
    try {
      const res = await apiSaveStoreChatSettings(storeId, {
        avatarUrl, name, statusLine, greeting,
        autoReplyEnabled, autoReplyText, autoReplyOnlyOutsideHours: onlyOutside, hours, quickReplies: cleanQuick,
      });
      toast.success('Chat settings saved');
      onSaved?.(res.data.quickReplies);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save the chat settings.');
      setSaving(false);
    }
  };

  const shownPhoto = avatarUrl || storeLogo || '';
  return (
    <Modal
      title="Chat settings" onClose={onClose} width={600} mobileSheet
      footer={<div className="flex justify-end gap-2"><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving} disabled={loading || !!loadError || uploading}>Save</Button></div>}
    >
      {loading ? (
        <div className="flex flex-col gap-3"><SkeletonBox height={64} rounded="10px" /><SkeletonBox height={44} rounded="10px" /><SkeletonBox height={44} rounded="10px" /></div>
      ) : loadError ? (
        <div role="alert" className="flex items-center justify-between gap-3">
          <p className="text-[12.5px] text-error">{loadError}</p>
          <Button size="sm" variant="secondary" onClick={retry}>Retry</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-slate">This is what customers see at the top of their chat with you. Leave a field empty to use the default.</p>

          <div className="flex items-center gap-3">
            <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-bone bg-cream">
              {shownPhoto ? <img src={shownPhoto} alt="" className="size-full object-contain p-1" /> : <StoreIcon size={22} className="text-slate" aria-hidden />}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { void pick(e.target.files?.[0]); e.target.value = ''; }} />
              <Button size="sm" variant="secondary" icon={<ImagePlus size={13} />} loading={uploading} onClick={() => fileRef.current?.click()}>Upload photo</Button>
              {avatarUrl && <Button size="sm" variant="secondary" onClick={() => setAvatarUrl('')}>Use store logo</Button>}
            </div>
          </div>

          <Input label="Chat name" value={name} maxLength={60} placeholder={storeName} onChange={e => setName(e.target.value)} />
          <Input label="Line under the name" value={statusLine} maxLength={80} placeholder={DEFAULT_LINE} onChange={e => setStatusLine(e.target.value)} />
          <Input label="Welcome message (shown in an empty chat)" value={greeting} maxLength={300} placeholder="Ask about a product, an order or anything else." onChange={e => setGreeting(e.target.value)} />

          <Section title="Automatic reply" hint="Sent once to a customer who writes to you, then not again for 12 hours.">
            <label className="flex items-center gap-2 text-[13px] text-charcoal">
              <input type="checkbox" checked={autoReplyEnabled} onChange={e => setAutoReplyEnabled(e.target.checked)} /> Send an automatic reply
            </label>
            {autoReplyEnabled && (
              <>
                <Input label="Reply message" value={autoReplyText} maxLength={500} placeholder="Thanks for your message! We will get back to you soon." onChange={e => setAutoReplyText(e.target.value)} />
                <label className="flex items-center gap-2 text-[13px] text-charcoal">
                  <input type="checkbox" checked={onlyOutside} onChange={e => setOnlyOutside(e.target.checked)} /> Only when we are closed (use the hours below)
                </label>
              </>
            )}
          </Section>

          {autoReplyEnabled && onlyOutside && (
            <Section title="Opening hours" hint="In your store time zone. A day that is switched off counts as closed all day.">
              <div className="flex flex-col gap-2">
                {WEEK_ORDER.map(d => {
                  const h = hours.find(x => x.day === d) ?? { day: d, open: false, from: '09:00', to: '18:00' };
                  return (
                    <div key={d} className="flex flex-wrap items-center gap-2 text-[13px]">
                      <label className="flex w-32 items-center gap-2 text-charcoal">
                        <input type="checkbox" checked={h.open} onChange={e => setDay(d, { open: e.target.checked })} /> {DAY_NAMES[d]}
                      </label>
                      {h.open ? (
                        <>
                          <input type="time" aria-label={`${DAY_NAMES[d]} opens`} value={h.from} onChange={e => setDay(d, { from: e.target.value })} className="h-9 rounded-lg border border-bone px-2" />
                          <span className="text-slate">to</span>
                          <input type="time" aria-label={`${DAY_NAMES[d]} closes`} value={h.to} onChange={e => setDay(d, { to: e.target.value })} className="h-9 rounded-lg border border-bone px-2" />
                        </>
                      ) : <span className="text-slate">Closed</span>}
                    </div>
                  );
                })}
              </div>
            </Section>
          )}

          <Section title="Quick replies" hint={`Ready-made answers. In a chat, type / and pick one. Up to ${MAX_QUICK}.`}>
            <div className="flex flex-col gap-3">
              {quick.map((q, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-lg border border-bone p-3">
                  <div className="flex items-end gap-2">
                    <div className="flex-1"><Input label="Short name" value={q.title} maxLength={40} placeholder="Shipping time" onChange={e => setQuickAt(i, { title: e.target.value })} /></div>
                    <button type="button" aria-label={`Remove quick reply ${q.title || i + 1}`} onClick={() => setQuick(prev => prev.filter((_, j) => j !== i))} className="mb-1 grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border-0 bg-transparent text-slate hover:text-error"><Trash2 size={15} /></button>
                  </div>
                  <Input label="Message" value={q.text} maxLength={1000} placeholder="Orders arrive in 3 to 5 working days." onChange={e => setQuickAt(i, { text: e.target.value })} />
                </div>
              ))}
              {quick.length < MAX_QUICK && (
                <Button size="sm" variant="secondary" icon={<Plus size={13} />} onClick={() => setQuick(prev => [...prev, { title: '', text: '' }])}>Add quick reply</Button>
              )}
            </div>
          </Section>

          {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
