import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGetStoreInventory, type InventoryProduct } from '@/api/services/product';
import { StorePageHeader, useStoreWorkspace } from '@/components/layouts/StoreLayout';
import { getStoreLiveUrl } from '@/utils/storefrontUrl';
import { useToast } from '@/contexts/ToastContext';
import { buildCaption, drawCreative, FORMATS, safeColor, type CreativeFormat } from './creativeCanvas';

/** Loads an image for the canvas. CORS-enabled so the PNG export is not blocked; null when it cannot be used. */
function loadImage(src: string | null | undefined): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export default function SocialCreatives() {
  const { store, storeId } = useStoreWorkspace();
  const toast = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [productId, setProductId] = useState('');
  const [format, setFormat] = useState<CreativeFormat>('square');
  const [badge, setBadge] = useState('');
  const [accent, setAccent] = useState(() => safeColor(store?.checkoutBranding?.accentColor));
  const [useLogo, setUseLogo] = useState(true);

  const load = useCallback(() => {
    setLoading(true); setError('');
    apiGetStoreInventory(storeId, 1, 50, { q, status: 'active', sort: 'newest' })
      .then((r) => { const items = r.data?.products ?? []; setProducts(items); setProductId((cur) => (items.some((p) => p.productId === cur) ? cur : items[0]?.productId ?? '')); })
      .catch(() => setError('Could not load your products.'))
      .finally(() => setLoading(false));
  }, [storeId, q]);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { const t = setTimeout(load, q ? 300 : 0); return () => clearTimeout(t); }, [load, q]);

  const product = useMemo(() => products.find((p) => p.productId === productId) ?? null, [products, productId]);
  const price = useMemo(() => {
    if (!product) return '';
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: store?.baseCurrency ?? 'USD' }).format(product.price); } catch { return String(product.price); }
  }, [product, store?.baseCurrency]);
  const link = product && store ? getStoreLiveUrl(store, `/product/${product.productId}`) : '';
  const caption = product && store ? buildCaption(product.name, price, link, store.name) : '';

  useEffect(() => {
    if (!product || !store || !canvasRef.current) return;
    let alive = true;
    Promise.all([loadImage(product.image), useLogo ? loadImage(store.logo) : Promise.resolve(null)]).then(([image, logo]) => {
      if (!alive || !canvasRef.current) return;
      drawCreative(canvasRef.current, { format, name: product.name, price, storeName: store.name, accent, logo, image, badge });
    });
    return () => { alive = false; };
  }, [product, store, format, price, accent, useLogo, badge]);

  const download = () => {
    const c = canvasRef.current;
    if (!c || !product) return;
    try {
      c.toBlob((blob) => {
        if (!blob) { toast.error('Could not create the image.'); return; }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${product.name.replace(/[^\w-]+/g, '-').slice(0, 40) || 'creative'}-${format}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
      }, 'image/png');
    } catch {
      toast.error('This product photo cannot be exported. Turn it off or upload the photo again.');
    }
  };
  const copy = async () => {
    try { await navigator.clipboard.writeText(caption); toast.success('Caption copied'); } catch { toast.error('Could not copy. Select the text and copy it.'); }
  };

  return (
    <div>
      <StorePageHeader title="Social creatives" subtitle="Make a post, story or WhatsApp status from a product in seconds." />
      <div className="px-4 lg:px-7 pt-5 pb-10 w-full grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="space-y-4 min-w-0">
          <label className="block text-sm font-medium" htmlFor="sc-search">Find a product
            <input id="sc-search" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name" />
          </label>
          {error ? (
            <div role="alert" className="text-sm text-red-600">{error} <button className="underline" onClick={load}>Retry</button></div>
          ) : loading ? (
            <div className="text-sm text-gray-500">Loading products…</div>
          ) : products.length === 0 ? (
            <div className="text-sm text-gray-500">No active products found.</div>
          ) : (
            <label className="block text-sm font-medium" htmlFor="sc-product">Product
              <select id="sc-product" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={productId} onChange={(e) => setProductId(e.target.value)}>
                {products.map((p) => <option key={p.productId} value={p.productId}>{p.name}</option>)}
              </select>
            </label>
          )}
          <label className="block text-sm font-medium" htmlFor="sc-format">Size
            <select id="sc-format" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={format} onChange={(e) => setFormat(e.target.value as CreativeFormat)}>
              {(Object.keys(FORMATS) as CreativeFormat[]).map((k) => <option key={k} value={k}>{FORMATS[k].label}</option>)}
            </select>
          </label>
          <label className="block text-sm font-medium" htmlFor="sc-badge">Badge (optional)
            <input id="sc-badge" maxLength={24} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" value={badge} onChange={(e) => setBadge(e.target.value)} placeholder="e.g. 20% OFF" />
          </label>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium" htmlFor="sc-color">Colour</label>
            <input id="sc-color" type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-9 w-14 rounded border" />
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={useLogo} onChange={(e) => setUseLogo(e.target.checked)} /> Use my logo</label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={!product} onClick={download}>Download PNG</button>
            <button className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-50" disabled={!product} onClick={copy}>Copy caption</button>
          </div>
          {caption && <pre aria-label="Caption" className="whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm">{caption}</pre>}
        </div>
        <div className="min-w-0 flex justify-center items-start">
          <canvas ref={canvasRef} aria-label="Creative preview" className="max-w-full max-h-[75vh] rounded-lg border bg-white" style={{ aspectRatio: `${FORMATS[format].w} / ${FORMATS[format].h}`, width: format === 'banner' ? '100%' : 'auto', height: format === 'banner' ? 'auto' : '75vh' }} />
        </div>
      </div>
    </div>
  );
}
