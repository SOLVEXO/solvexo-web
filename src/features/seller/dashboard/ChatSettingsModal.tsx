import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Store as StoreIcon } from 'lucide-react';
import { Input } from '@/components/comman/ui';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { SkeletonBox } from '@/components/comman/ui';
import { useToast } from '@/contexts/ToastContext';
import { apiUploadMediaAsset } from '@/api/services/mediaLibrary';
import { apiGetStoreChatSettings, apiSaveStoreChatSettings } from '@/api/services/storeChatSettings';

const DEFAULT_LINE = 'We reply as soon as we can';

/** Seller-side "Chat settings": the photo, name, status line and welcome text buyers see in the chat. Empty = the default. */
export function ChatSettingsModal({ storeId, storeName, storeLogo, onClose }: { storeId: string; storeName: string; storeLogo?: string | null; onClose: () => void }) {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [name, setName] = useState('');
  const [statusLine, setStatusLine] = useState('');
  const [greeting, setGreeting] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    apiGetStoreChatSettings(storeId)
      .then(res => { if (!live) return; setAvatarUrl(res.data.avatarUrl ?? ''); setName(res.data.name ?? ''); setStatusLine(res.data.statusLine ?? ''); setGreeting(res.data.greeting ?? ''); })
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

  const save = async () => {
    setSaving(true); setError('');
    try {
      await apiSaveStoreChatSettings(storeId, { avatarUrl, name, statusLine, greeting });
      toast.success('Chat settings saved');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not save the chat settings.');
      setSaving(false);
    }
  };

  const shownPhoto = avatarUrl || storeLogo || '';
  return (
    <Modal
      title="Chat settings" onClose={onClose} width={520} mobileSheet
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
          {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
        </div>
      )}
    </Modal>
  );
}
