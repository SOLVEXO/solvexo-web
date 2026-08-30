import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Percent, Tag, PackagePlus, Truck, Trash2, Pencil, Power, PowerOff, ArrowRight } from 'lucide-react';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  apiGetDiscounts, apiCreateDiscount, apiUpdateDiscount, apiDeleteDiscount,
  type AutomaticDiscount, type DiscountType, type DiscountTarget, type CreateDiscountPayload,
} from '@/api/services/discounts';
import { apiGetStoreCategoryTree, type CategoryNode } from '@/api/services/categories';
import { apiGetPublicStoreProducts, type PublicStoreProduct } from '@/api/services/store';
import { currencySymbol } from '@/utils/currency';
import {
  Button, Table, type TableColumn, Modal, Input, Select, Field, Badge,
  ActionMenu, type ActionMenuItem, SearchInput,
} from '@/components/comman/ui';

// ── Real, no-code seller discounts — the piece the Marketing page's manual
// Coupon system doesn't cover (a buyer never types anything; it's resolved
// server-side at checkout, same as an admin platform Campaign). Backend
// (DiscountsService) and this frontend api client (discounts.ts) already
// existed and were already wired into checkout pricing — this page is the
// missing seller-facing surface that closes the loop, same class of gap as
// AtelierLivePreview's hardcoded-theme bug fixed earlier: real, working
// functionality nobody could actually reach. ──

const DISCOUNT_TYPE_LABEL: Record<DiscountType, string> = {
  percentage: 'Percentage',
  fixed: 'Fixed amount',
  bogo: 'Buy X Get Y',
  free_shipping: 'Free shipping',
};

const DISCOUNT_TYPE_ICON: Record<DiscountType, typeof Percent> = {
  percentage: Percent,
  fixed: Tag,
  bogo: PackagePlus,
  free_shipping: Truck,
};

function flattenCategories(nodes: CategoryNode[], depth = 0): { id: string; name: string; depth: number }[] {
  const out: { id: string; name: string; depth: number }[] = [];
  for (const n of nodes) {
    out.push({ id: n._id, name: n.name, depth });
    if (n.children?.length) out.push(...flattenCategories(n.children, depth + 1));
  }
  return out;
}

function discountStatus(d: AutomaticDiscount): { label: string; color: 'green' | 'gray' | 'yellow' | 'red' } {
  if (!d.isActive) return { label: 'Inactive', color: 'gray' };
  const now = Date.now();
  if (d.startsAt && new Date(d.startsAt).getTime() > now) return { label: 'Scheduled', color: 'yellow' };
  if (d.endsAt && new Date(d.endsAt).getTime() < now) return { label: 'Expired', color: 'red' };
  return { label: 'Active', color: 'green' };
}

function formatValue(d: AutomaticDiscount, storeCurrency: string): string {
  if (d.discountType === 'percentage') return `${d.discountValue}% off`;
  if (d.discountType === 'fixed') return `${currencySymbol(d.currency ?? storeCurrency)}${d.discountValue} off`;
  if (d.discountType === 'bogo') {
    const pct = d.getDiscountPercent ?? 100;
    return `Buy ${d.buyQuantity} get ${d.getQuantity} ${pct >= 100 ? 'free' : `${pct}% off`}`;
  }
  return 'Free shipping';
}

function formatTarget(d: AutomaticDiscount, categoryNames: Record<string, string>): string {
  if (d.target === 'store') return 'Entire store';
  if (d.target === 'category') {
    const names = d.categoryIds.map(id => categoryNames[id]).filter(Boolean);
    if (names.length === 0) return `${d.categoryIds.length} categor${d.categoryIds.length === 1 ? 'y' : 'ies'}`;
    return names.length <= 2 ? names.join(', ') : `${names.slice(0, 2).join(', ')} +${names.length - 2}`;
  }
  return `${d.productIds.length} product${d.productIds.length === 1 ? '' : 's'}`;
}

// ── Create / Edit form ────────────────────────────────────────────────────────
function DiscountFormModal({
  storeId, storeCurrency, categories, initial, onClose, onSaved,
}: {
  storeId: string;
  storeCurrency: string;
  categories: { id: string; name: string; depth: number }[];
  initial: AutomaticDiscount | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? '');
  const [discountType, setDiscountType] = useState<DiscountType>(initial?.discountType ?? 'percentage');
  const [discountValue, setDiscountValue] = useState<number>(initial?.discountValue ?? 10);
  const [buyQuantity, setBuyQuantity] = useState<number>(initial?.buyQuantity ?? 2);
  const [getQuantity, setGetQuantity] = useState<number>(initial?.getQuantity ?? 1);
  const [getDiscountPercent, setGetDiscountPercent] = useState<number>(initial?.getDiscountPercent ?? 100);
  const [target, setTarget] = useState<DiscountTarget>(initial?.target ?? 'store');
  const [categoryIds, setCategoryIds] = useState<string[]>(initial?.categoryIds ?? []);
  const [productIds, setProductIds] = useState<string[]>(initial?.productIds ?? []);
  const [productSearch, setProductSearch] = useState('');
  const [productResults, setProductResults] = useState<PublicStoreProduct[]>([]);
  const [pickedProducts, setPickedProducts] = useState<Map<string, string>>(
    () => new Map((initial?.productIds ?? []).map(id => [id, `Product …${id.slice(-6)}`])),
  );
  const [minOrderAmount, setMinOrderAmount] = useState<string>(initial?.minOrderAmount != null ? String(initial.minOrderAmount) : '');
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? initial.startsAt.slice(0, 10) : '');
  const [endsAt, setEndsAt] = useState(initial?.endsAt ? initial.endsAt.slice(0, 10) : '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Debounced product search — only while targeting specific products.
  useEffect(() => {
    if (target !== 'products') return;
    const t = setTimeout(() => {
      apiGetPublicStoreProducts(storeId, { search: productSearch || undefined, limit: 20 })
        .then(res => setProductResults(res.data?.products ?? []))
        .catch(() => setProductResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [productSearch, target, storeId]);

  // Fill in real names for already-picked ids (edit mode starts with only
  // ids — a placeholder label until a matching search result arrives).
  useEffect(() => {
    if (productResults.length === 0) return;
    setPickedProducts(prev => {
      let changed = false;
      const next = new Map(prev);
      for (const p of productResults) {
        if (next.has(p._id) && next.get(p._id) !== p.name) { next.set(p._id, p.name); changed = true; }
      }
      return changed ? next : prev;
    });
  }, [productResults]);

  const toggleCategory = (id: string) =>
    setCategoryIds(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));

  const toggleProduct = (id: string, name: string) => {
    setProductIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    setPickedProducts(prev => {
      const next = new Map(prev);
      if (next.has(id)) next.delete(id);
      else next.set(id, name);
      return next;
    });
  };

  const handleTypeChange = (t: DiscountType) => {
    setDiscountType(t);
    if (t === 'free_shipping') setTarget('store');
  };

  const validate = (): string | null => {
    if (!name.trim()) return 'Name is required.';
    if (target === 'category' && categoryIds.length === 0) return 'Select at least one category.';
    if (target === 'products' && productIds.length === 0) return 'Select at least one product.';
    if (discountType === 'bogo' && (!buyQuantity || !getQuantity)) return 'Buy and get quantities are required for Buy X Get Y.';
    if (discountType === 'percentage' && discountValue > 100) return 'Percentage discount cannot exceed 100.';
    if (discountType === 'free_shipping' && target !== 'store') return 'Free shipping discounts must target the whole store.';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) { setError(err); return; }
    setSaving(true);
    setError('');
    const payload: CreateDiscountPayload = {
      name: name.trim(),
      discountType,
      discountValue: discountType === 'bogo' || discountType === 'free_shipping' ? 0 : Number(discountValue),
      target,
      ...(discountType === 'bogo'
        ? { buyQuantity: Number(buyQuantity), getQuantity: Number(getQuantity), getDiscountPercent: Number(getDiscountPercent) }
        : {}),
      ...(target === 'category' ? { categoryIds } : {}),
      ...(target === 'products' ? { productIds } : {}),
      ...(minOrderAmount ? { minOrderAmount: Number(minOrderAmount) } : {}),
      ...(startsAt ? { startsAt } : {}),
      ...(endsAt ? { endsAt } : {}),
    };
    try {
      if (isEdit) await apiUpdateDiscount(storeId, initial!._id, payload);
      else await apiCreateDiscount(storeId, payload);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save discount.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={isEdit ? 'Edit discount' : 'Create automatic discount'}
      onClose={onClose}
      width={540}
      footer={(
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" onClick={handleSave} loading={saving}>{isEdit ? 'Save changes' : 'Create discount'}</Button>
        </>
      )}
    >
      {error && (
        <p className="mb-3 text-[12.5px] text-error bg-error-bg border border-error-border rounded-md px-3 py-2">{error}</p>
      )}

      <Field label="Discount name" required>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Sale" />
      </Field>

      <Field label="Discount type" required>
        <Select value={discountType} onChange={e => handleTypeChange(e.target.value as DiscountType)}>
          <option value="percentage">Percentage off</option>
          <option value="fixed">Fixed amount off</option>
          <option value="bogo">Buy X Get Y</option>
          <option value="free_shipping">Free shipping</option>
        </Select>
      </Field>

      {discountType === 'percentage' && (
        <Field label="Percentage" required>
          <Input
            type="number" min={0} max={100} value={discountValue}
            onChange={e => setDiscountValue(Number(e.target.value))}
            rightIcon={<span className="text-[12px]">%</span>}
          />
        </Field>
      )}
      {discountType === 'fixed' && (
        <Field label="Amount off" required>
          <Input
            type="number" min={0} value={discountValue}
            onChange={e => setDiscountValue(Number(e.target.value))}
            leftAddon={currencySymbol(storeCurrency)}
          />
        </Field>
      )}
      {discountType === 'bogo' && (
        <div className="grid grid-cols-3 gap-2">
          <Field label="Buy quantity" required>
            <Input type="number" min={1} value={buyQuantity} onChange={e => setBuyQuantity(Number(e.target.value))} />
          </Field>
          <Field label="Get quantity" required>
            <Input type="number" min={1} value={getQuantity} onChange={e => setGetQuantity(Number(e.target.value))} />
          </Field>
          <Field label="Get % off" hint="100 = free">
            <Input type="number" min={1} max={100} value={getDiscountPercent} onChange={e => setGetDiscountPercent(Number(e.target.value))} />
          </Field>
        </div>
      )}
      {discountType === 'free_shipping' && (
        <p className="text-[12px] text-slate mb-[14px] -mt-1">Free shipping discounts always apply store-wide.</p>
      )}

      <Field label="Applies to" required>
        <Select
          value={target}
          onChange={e => setTarget(e.target.value as DiscountTarget)}
          disabled={discountType === 'free_shipping'}
        >
          <option value="store">Entire store</option>
          <option value="category">Specific categories</option>
          <option value="products">Specific products</option>
        </Select>
      </Field>

      {target === 'category' && (
        <Field label="Categories" required hint={categories.length === 0 ? 'This store has no categories yet.' : undefined}>
          <div className="max-h-[160px] overflow-y-auto border border-bone rounded-lg divide-y divide-[#f0eee6]">
            {categories.map(c => (
              <label
                key={c.id}
                className="flex items-center gap-2 px-3 py-[7px] text-[13px] text-carbon cursor-pointer hover:bg-cream"
                style={{ paddingLeft: 12 + c.depth * 14 }}
              >
                <input type="checkbox" className="accent-brand-orange" checked={categoryIds.includes(c.id)} onChange={() => toggleCategory(c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </Field>
      )}

      {target === 'products' && (
        <Field label="Products" required>
          <SearchInput value={productSearch} onChange={setProductSearch} placeholder="Search products…" className="mb-2" />
          {pickedProducts.size > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {Array.from(pickedProducts.entries()).map(([id, pname]) => (
                <span key={id} className="inline-flex items-center gap-1 bg-brand-pale-orange text-brand-deep-orange text-[11.5px] font-medium rounded-full px-2.5 py-[3px]">
                  {pname}
                  <button type="button" onClick={() => toggleProduct(id, pname)} className="border-0 bg-transparent cursor-pointer text-brand-deep-orange">×</button>
                </span>
              ))}
            </div>
          )}
          <div className="max-h-[160px] overflow-y-auto border border-bone rounded-lg divide-y divide-[#f0eee6]">
            {productResults.length === 0 ? (
              <p className="px-3 py-3 text-[12.5px] text-slate">No products found.</p>
            ) : productResults.map(p => (
              <label key={p._id} className="flex items-center gap-2 px-3 py-[7px] text-[13px] text-carbon cursor-pointer hover:bg-cream">
                <input type="checkbox" className="accent-brand-orange" checked={productIds.includes(p._id)} onChange={() => toggleProduct(p._id, p.name)} />
                {p.name}
              </label>
            ))}
          </div>
        </Field>
      )}

      <Field label="Minimum order amount" hint="Optional — leave blank for no minimum">
        <Input type="number" min={0} value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)} leftAddon={currencySymbol(storeCurrency)} />
      </Field>

      <div className="grid grid-cols-2 gap-2">
        <Field label="Starts" hint="Optional">
          <Input type="date" value={startsAt} onChange={e => setStartsAt(e.target.value)} />
        </Field>
        <Field label="Ends" hint="Optional">
          <Input type="date" value={endsAt} onChange={e => setEndsAt(e.target.value)} />
        </Field>
      </div>
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function StoreDiscounts() {
  const { storeId, store } = useStoreWorkspace();
  const navigate = useNavigate();
  const storeCurrency = store?.baseCurrency ?? 'USD';

  const [discounts, setDiscounts] = useState<AutomaticDiscount[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryTree, setCategoryTree] = useState<CategoryNode[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AutomaticDiscount | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AutomaticDiscount | null>(null);
  const [deleting, setDeleting] = useState(false);

  const flatCategories = useMemo(() => flattenCategories(categoryTree), [categoryTree]);
  const categoryNames = useMemo(
    () => Object.fromEntries(flatCategories.map(c => [c.id, c.name])),
    [flatCategories],
  );

  const load = () => {
    if (!storeId) return;
    setLoading(true);
    apiGetDiscounts(storeId)
      .then(res => setDiscounts(res.data ?? []))
      .catch(() => setDiscounts([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [storeId]);
  useEffect(() => {
    if (!storeId) return;
    apiGetStoreCategoryTree(storeId).then(res => setCategoryTree(res.data ?? [])).catch(() => {});
  }, [storeId]);

  const toggleActive = async (d: AutomaticDiscount) => {
    try {
      await apiUpdateDiscount(storeId, d._id, { isActive: !d.isActive });
      load();
    } catch {
      // The row simply stays unchanged — the seller can retry from the menu.
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await apiDeleteDiscount(storeId, confirmDelete._id);
      setConfirmDelete(null);
      load();
    } catch {
      // Keep the dialog open on failure so the seller can see it and retry.
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumn<AutomaticDiscount>[] = [
    {
      key: 'name', header: 'Discount', render: d => {
        const Icon = DISCOUNT_TYPE_ICON[d.discountType];
        return (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-brand-pale-orange flex items-center justify-center shrink-0">
              <Icon size={14} className="text-brand-orange" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-carbon truncate">{d.name}</p>
              <p className="text-[11.5px] text-slate">{DISCOUNT_TYPE_LABEL[d.discountType]}</p>
            </div>
          </div>
        );
      },
    },
    { key: 'value', header: 'Value', render: d => formatValue(d, storeCurrency) },
    { key: 'target', header: 'Applies to', render: d => formatTarget(d, categoryNames) },
    {
      key: 'status', header: 'Status', render: d => {
        const s = discountStatus(d);
        return <Badge color={s.color}>{s.label}</Badge>;
      },
    },
    {
      key: 'dates', header: 'Active dates', render: d => (
        <span className="text-[12px] text-slate whitespace-nowrap">
          {d.startsAt ? new Date(d.startsAt).toLocaleDateString() : 'Immediately'}
          {' – '}
          {d.endsAt ? new Date(d.endsAt).toLocaleDateString() : 'No end date'}
        </span>
      ),
    },
    {
      key: 'actions', header: '', align: 'right', render: d => {
        const items: ActionMenuItem[] = [
          { label: 'Edit', icon: <Pencil size={14} />, onClick: () => { setEditing(d); setModalOpen(true); } },
          d.isActive
            ? { label: 'Deactivate', icon: <PowerOff size={14} />, onClick: () => toggleActive(d) }
            : { label: 'Activate', icon: <Power size={14} />, onClick: () => toggleActive(d) },
          { label: 'Delete', icon: <Trash2 size={14} />, danger: true, onClick: () => setConfirmDelete(d) },
        ];
        return <ActionMenu items={items} />;
      },
    },
  ];

  return (
    <div>
      <StorePageHeader
        title="Discounts"
        subtitle="Automatic, no-code discounts — applied instantly, no code for buyers to enter"
        actions={(
          <Button variant="primary" icon={<Plus size={14} />} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Create discount
          </Button>
        )}
      />

      <div className="p-4 md:p-7">
        <button
          onClick={() => navigate(`/store/${storeId}/marketing`)}
          className="w-full flex items-center gap-3 mb-5 bg-white border border-bone rounded-xl px-4 py-3 text-left cursor-pointer hover:bg-cream transition-colors"
        >
          <div className="w-8 h-8 rounded-[8px] bg-info-bg flex items-center justify-center shrink-0">
            <Tag size={14} className="text-info" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-carbon">Looking for discount codes buyers type at checkout?</p>
            <p className="text-[12px] text-slate">Manage discount codes under Marketing → Coupons.</p>
          </div>
          <ArrowRight size={15} className="text-slate shrink-0" />
        </button>

        <div className="bg-white border border-bone rounded-xl overflow-hidden">
          <Table
            columns={columns}
            data={discounts}
            keyExtractor={d => d._id}
            loading={loading}
            emptyState={{
              icon: <Percent size={28} className="text-slate/50" />,
              title: 'No automatic discounts yet',
              description: 'Create a discount that applies instantly — a percentage or fixed amount off, a Buy X Get Y offer, or free shipping — with no code for buyers to enter.',
              action: { label: 'Create discount', icon: <Plus size={14} />, onClick: () => { setEditing(null); setModalOpen(true); } },
            }}
          />
        </div>
      </div>

      {modalOpen && (
        <DiscountFormModal
          storeId={storeId}
          storeCurrency={storeCurrency}
          categories={flatCategories}
          initial={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}

      {confirmDelete && (
        <Modal
          title="Delete discount?"
          onClose={() => setConfirmDelete(null)}
          footer={(
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)} disabled={deleting}>Cancel</Button>
              <Button variant="danger" onClick={handleDelete} loading={deleting}>Delete</Button>
            </>
          )}
        >
          <p className="text-[13px] text-slate">
            "{confirmDelete.name}" will stop applying immediately. This can't be undone.
          </p>
        </Modal>
      )}
    </div>
  );
}
