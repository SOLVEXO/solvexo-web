import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ImagePlus, Plus, Store as StoreIcon, Trash2 } from 'lucide-react';
import { Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { useToast } from '@/contexts/ToastContext';
import { apiUploadMediaAsset } from '@/api/services/mediaLibrary';
import { apiSaveStoreChatSettings, type ChatHoursDay, type QuickReply, type StoreChatSettingsFull } from '@/api/services/storeChatSettings';

const DEFAULT_LINE = 'We reply as soon as we can';
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const MAX_QUICK = 20;
const DEFAULT_AUTO_REPLY = 'Thanks for your message! We will get back to you soon.';

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

/** Seller-side "Chat settings" page (opens in the chat pane, WhatsApp style): what buyers see in the chat (photo, name, line, welcome), the automatic reply with its
 *  opening hours, and the seller's own quick replies. An empty text field means the default. */
export function ChatSettingsPanel({ storeId, storeName, storeLogo, initial, onClose, onSaved }: {
  storeId: string; storeName: string; storeLogo?: string | null; initial: StoreChatSettingsFull | null; onClose: () => void; onSaved?: (settings: StoreChatSettingsFull) => void;
}) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
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

  // Settings come from the page (already loaded), so the form opens instantly with no spinner.
  useEffect(() => {
    if (!initial) return;
    setAvatarUrl(initial.avatarUrl ?? ''); setName(initial.name ?? ''); setStatusLine(initial.statusLine ?? ''); setGreeting(initial.greeting ?? '');
    setAutoReplyEnabled(initial.autoReplyEnabled); setAutoReplyText(initial.autoReplyText ?? ''); setOnlyOutside(initial.autoReplyOnlyOutsideHours);
    setHours(initial.hours); setQuick(initial.quickReplies);
  }, [initial]);

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
      onSaved?.(res.data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save the chat settings.');
      setSaving(false);
    }
  };

  const shownPhoto = avatarUrl || storeLogo || '';
  return (
    <div className="flex h-full min-w-0 flex-1 flex-col bg-white">
      <header className="flex shrink-0 items-center gap-3 border-b border-bone px-4 py-3">
        <button type="button" onClick={onClose} aria-label="Back to chats" className="grid size-9 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-charcoal hover:bg-cream"><ArrowLeft size={20} /></button>
        <h2 className="m-0 text-[17px] font-semibold text-charcoal">Chat settings</h2>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 md:px-8">
        <div className="mx-auto w-full max-w-[640px]">
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
              <input type="checkbox" checked={autoReplyEnabled} onChange={e => { setAutoReplyEnabled(e.target.checked); if (e.target.checked && !autoReplyText.trim()) setAutoReplyText(DEFAULT_AUTO_REPLY); }} /> Send an automatic reply
            </label>
            {autoReplyEnabled && (
              <>
                <Input label="Reply message" value={autoReplyText} maxLength={500} placeholder="Thanks for your message! We will get back to you soon." onChange={e => setAutoReplyText(e.target.value)} />
                <label className="flex items-center gap-2 text-[13px] text-charcoal">
                  <input type="checkbox" checked={onlyOutside} onChange={e => setOnlyOutside(e.target.checked)} /> Only when we are closed (use the hours below)
                </label>
              </>
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
        </div>
      </div>
      <footer className="flex shrink-0 justify-end gap-2 border-t border-bone px-4 py-3">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button onClick={save} loading={saving} disabled={!initial || uploading}>Save</Button>
      </footer>
    </div>
  );
}
