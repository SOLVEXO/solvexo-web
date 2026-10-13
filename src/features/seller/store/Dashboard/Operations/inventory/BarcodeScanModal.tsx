import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, ScanLine } from 'lucide-react';
import { Modal } from '@/components/comman/ui/Modal';
import { Button } from '@/components/comman/ui/Button';
import { Input, Select } from '@/components/comman/ui';
import { hasNavPermission } from '@/components/layouts/StoreLayout';
import { TokenStorage } from '@/api/services/auth';
import { apiLookupByCode, type LookupHit } from '@/api/services/inventoryOps';
import { apiAdjustStock, type StockAdjustmentReason } from '@/api/services/product';

// The browser's built-in shape detector (Chrome / Edge / Android). Not in the TS DOM lib yet, so typed minimally here.
interface DetectorLike { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> }
type DetectorCtor = new (opts?: { formats?: string[] }) => DetectorLike;
const getDetectorCtor = (): DetectorCtor | null =>
  (typeof window !== 'undefined' && (window as unknown as { BarcodeDetector?: DetectorCtor }).BarcodeDetector) || null;

const ADJUST_REASONS: { value: StockAdjustmentReason; label: string }[] = [
  { value: 'restocked',  label: 'Restocked' },
  { value: 'correction', label: 'Count correction' },
  { value: 'other',      label: 'Other' },
];

/** Scan (camera or USB/Bluetooth scanner, which "types" the code and presses Enter) or type a barcode / SKU, see that
 *  variant's stock, and adjust it right there. Uses GET inventory/:storeId/lookup, so it only ever finds this store's items. */
export function BarcodeScanModal({ storeId, onClose, onChanged }: { storeId: string; onClose: () => void; onChanged?: () => void }) {
  const [code, setCode] = useState('');
  const [hits, setHits] = useState<LookupHit[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cameraOn, setCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const supportsCamera = !!getDetectorCtor() && !!navigator.mediaDevices?.getUserMedia;
  const user = TokenStorage.getUser<{ role?: 'admin' | 'seller' | 'staff' | 'user'; permissions?: string[] }>();
  const canAdjust = hasNavPermission(user as never, ['inventory.adjust']);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const lookup = useCallback(async (raw: string) => {
    const value = raw.trim();
    if (!value) return;
    setLoading(true); setError('');
    try {
      const res = await apiLookupByCode(storeId, value);
      setHits(res.data);
      if (res.data.length === 0) setError(`Nothing in this store matches "${value}".`);
    } catch (err: unknown) {
      setHits(null);
      setError(err instanceof Error ? err.message : 'Lookup failed. Please try again.');
    } finally {
      setLoading(false);
      setCode('');
      inputRef.current?.focus();
    }
  }, [storeId]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraOn(false);
  }, []);

  useEffect(() => () => { streamRef.current?.getTracks().forEach(t => t.stop()); }, []);

  useEffect(() => {
    if (!cameraOn) return;
    const Detector = getDetectorCtor();
    if (!Detector) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | undefined;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code', 'itf'] });
        timer = setInterval(async () => {
          try {
            const found = await detector.detect(video);
            if (found[0]?.rawValue) {
              clearInterval(timer);
              stopCamera();
              void lookup(found[0].rawValue);
            }
          } catch { /* a frame that cannot be read is just skipped */ }
        }, 400);
      } catch {
        setCameraError('Could not open the camera. Allow camera access, or type / scan the code instead.');
        setCameraOn(false);
      }
    })();
    return () => { cancelled = true; if (timer) clearInterval(timer); };
  }, [cameraOn, lookup, stopCamera]);

  const applyAdjust = (variantId: string, delta: number, reason: StockAdjustmentReason) => {
    setError('');
    return apiAdjustStock(storeId, variantId, delta, reason).then(res => {
      if (res.data?.pending) { setError('Sent for manager approval. Stock stays unchanged until it is approved.'); return; }
      setHits(prev => prev && prev.map(h => (h.variantId === variantId
        ? { ...h, stock: res.data.newStock, available: h.available == null ? null : h.available + delta }
        : h)));
      onChanged?.();
    }).catch((err: unknown) => {
      setError(err instanceof Error ? err.message : 'Could not adjust stock.');
    });
  };

  return (
    <Modal title="Scan barcode / SKU" onClose={() => { stopCamera(); onClose(); }} width={520} mobileSheet>
      <div className="flex flex-col gap-4">
        <form onSubmit={e => { e.preventDefault(); void lookup(code); }} className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              ref={inputRef} label="Barcode or SKU" value={code} onChange={e => setCode(e.target.value)}
              placeholder="Scan or type, then press Enter" inputMode="text" autoComplete="off" enterKeyHint="search"
            />
          </div>
          <Button type="submit" icon={<ScanLine size={14} />} loading={loading} disabled={!code.trim()}>Find</Button>
        </form>

        {supportsCamera && (
          <div className="flex flex-col gap-2">
            <Button
              type="button" variant="secondary" size="sm"
              icon={cameraOn ? <CameraOff size={14} /> : <Camera size={14} />}
              onClick={() => { setCameraError(''); if (cameraOn) stopCamera(); else setCameraOn(true); }}
            >
              {cameraOn ? 'Stop camera' : 'Scan with camera'}
            </Button>
            {cameraOn && <video ref={videoRef} playsInline muted className="w-full max-h-[260px] rounded-lg bg-black object-cover" aria-label="Camera preview" />}
            {cameraError && <p role="alert" className="text-[12px] text-error">{cameraError}</p>}
          </div>
        )}

        {error && <p role="alert" className="text-[12px] text-error">{error}</p>}

        {hits?.map(h => <HitCard key={h.variantId} hit={h} canAdjust={canAdjust} onAdjust={applyAdjust} />)}
      </div>
    </Modal>
  );
}

function HitCard({ hit, canAdjust, onAdjust }: { hit: LookupHit; canAdjust: boolean; onAdjust: (variantId: string, delta: number, reason: StockAdjustmentReason) => Promise<void> }) {
  const [qty, setQty] = useState('1');
  const [reason, setReason] = useState<StockAdjustmentReason>('restocked');
  const [busy, setBusy] = useState(false);
  const n = parseInt(qty, 10);
  const valid = Number.isInteger(n) && n > 0;
  const go = async (sign: 1 | -1) => { if (!valid) return; setBusy(true); await onAdjust(hit.variantId, sign * n, sign === 1 ? reason : (reason === 'restocked' ? 'correction' : reason)); setBusy(false); };
  const label = hit.options.map(o => o.value).join(' / ');
  return (
    <div className="rounded-xl border border-bone p-3 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        {hit.image && <img src={hit.image} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-charcoal truncate">{hit.productName}{label ? ` — ${label}` : ''}</p>
          <p className="text-[11px] text-slate">SKU: {hit.sku ?? '—'} · Barcode: {hit.barcode ?? '—'}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-[15px] font-bold text-charcoal">{hit.unlimitedStock ? '∞' : hit.stock}</p>
          <p className="text-[10.5px] text-slate">{hit.unlimitedStock ? 'unlimited' : `${hit.available ?? 0} available`}</p>
        </div>
      </div>
      {canAdjust && !hit.unlimitedStock && (
        <div className="flex flex-wrap items-end gap-2">
          <div className="w-20"><Input label="Qty" type="number" min={1} step={1} inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} /></div>
          <div className="flex-1 min-w-[140px]">
            <Select label="Reason" value={reason} onChange={e => setReason(e.target.value as StockAdjustmentReason)}>
              {ADJUST_REASONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </Select>
          </div>
          <Button size="sm" disabled={!valid || busy} onClick={() => void go(1)}>Add</Button>
          <Button size="sm" variant="secondary" disabled={!valid || busy} onClick={() => void go(-1)}>Remove</Button>
        </div>
      )}
    </div>
  );
}
