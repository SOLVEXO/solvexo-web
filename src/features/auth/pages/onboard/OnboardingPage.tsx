import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useCreateStore } from '@/hooks/store/useCreateStore';
import { Button } from '@/components/ui/Button';
import { SolvexoLogo } from '@/components/ui/SolvexoLogo';
import {
  Camera, Palette, BookOpen, Store, Briefcase, Monitor, Globe,
  Package, Download, Calendar, Repeat, MonitorSmartphone,
  Sparkles, User, CreditCard, Plus, Wrench, ShoppingCart,
  ArrowRight, ArrowLeft, Check, AlertTriangle, Loader,
} from 'lucide-react';
import type { SellerType, ProductType, StoreData } from '@/api/commerce/store';

const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E', error: '#C13030', errorBg: '#FDEAEA',
};
const FONT = "'Poppins', sans-serif";

const STEPS = ['Store Info', 'Seller Type', 'What You Sell', 'Go Live'];

const SELLER_TYPES: { id: SellerType; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'creator',  Icon: Palette,   title: 'Creator',          desc: 'Sell digital art, templates, fonts, music, presets' },
  { id: 'creator',  Icon: BookOpen,  title: 'Educator',         desc: 'Worksheets, lesson plans, curriculum, assessments' },
  { id: 'retailer', Icon: Store,     title: 'Retailer',         desc: 'Physical goods, handmade products, branded items' },
  { id: 'brand',    Icon: Briefcase, title: 'Brand / Business', desc: 'Run a full online store with inventory and POS' },
  { id: 'reseller', Icon: Monitor,   title: 'Reseller',         desc: 'Source and resell products from suppliers' },
  { id: 'creator',  Icon: Globe,     title: 'Mix of the above', desc: 'I sell across multiple categories and formats' },
];

const PRODUCT_TYPES: { id: ProductType; Icon: React.ElementType; title: string; desc: string }[] = [
  { id: 'physical_products', Icon: Package,           title: 'Physical Products',     desc: 'Ship items to customers' },
  { id: 'digital_downloads', Icon: Download,          title: 'Digital Downloads',     desc: 'PDFs, files, audio, video' },
  { id: 'digital_downloads', Icon: BookOpen,          title: 'Educational Resources', desc: 'Worksheets, lesson plans' },
  { id: 'services',          Icon: Calendar,          title: 'Services / Bookings',   desc: 'Appointments and packages' },
  { id: 'services',          Icon: Repeat,            title: 'Subscriptions',         desc: 'Recurring membership access' },
  { id: 'in_person_pos',     Icon: MonitorSmartphone, title: 'In-Person / POS',       desc: 'Sell at a physical location' },
];

const CATEGORIES = [
  'Education & Learning', 'Art & Design', 'Handmade & Crafts',
  'Digital Downloads', 'Home & Lifestyle', 'Business & Productivity',
  'Fashion & Apparel', 'Technology', 'Arts & Crafts',
];

const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${C.bone}`, fontSize: 13, fontFamily: FONT,
  color: C.charcoal, outline: 'none', boxSizing: 'border-box', background: C.white,
};
const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: C.charcoal, marginBottom: 6, fontFamily: FONT,
};
const cardStyle: CSSProperties = {
  background: C.white, borderRadius: 16, padding: 32,
  border: `1px solid ${C.bone}`, width: '100%',
};
const tagStyle: CSSProperties = {
  background: '#EBF7EF', color: '#2D8A4E',
  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20, fontFamily: FONT,
};

interface StoreForm {
  storeName:    string;
  categoryId:   string;
  description:  string;
  logo:         string;
  sellerType:   SellerType | '';
  sellerKey:    string;
  productTypes: ProductType[];
}

// ── Step Progress ─────────────────────────────────────────────────────────────
function StepProgress({ current, maxReached, onStepClick }: { current: number; maxReached: number; onStepClick: (step: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done = n <= maxReached && n !== current; // green = visited but not current
        const active = n === current;                  // orange = current step
        const clickable = n <= maxReached && n !== current; // can jump to any visited step
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: clickable ? 'pointer' : 'default' }}
              onClick={() => clickable && onStepClick(n)}
            >
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, fontFamily: FONT, transition: 'all 0.3s',
                background: done ? C.success : active ? C.orange : C.bone,
                color: done || active ? C.white : C.slate,
                boxShadow: active ? `0 0 0 4px ${C.paleOrange}` : 'none',
              }}>
                {done ? <Check size={12} /> : n}
              </div>
              <span style={{ marginTop: 6, fontSize: 10, fontWeight: 500, whiteSpace: 'nowrap', color: active ? C.orange : done ? C.success : C.slate }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ width: 60, height: 2, marginBottom: 16, marginLeft: 4, marginRight: 4, background: n < maxReached ? C.success : C.bone, borderRadius: 2, transition: 'all 0.3s' }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function PageHeader({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', height: 64, borderBottom: `1px solid ${C.bone}`, background: C.white, position: 'sticky', top: 44, zIndex: 10 }}>
      <SolvexoLogo size={30} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT }}>
        <span style={{ fontSize: 13, color: C.slate }}>Already have an account?</span>
        <Button variant="ghost" size="sm" onClick={onSignIn}>Sign In</Button>
      </div>
    </div>
  );
}

// ── Step 1 — Store Info ───────────────────────────────────────────────────────
function Step1({ form, setForm, onNext }: { form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void }) {
  const [preview, setPreview] = useState('');
  const canProceed = form.storeName.trim().length > 0 && form.categoryId.length > 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setForm({ ...form, logo: url });
  };

  return (
    <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>Set up your store</h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT }}>You can always update these details later from Settings.</p>
      </div>
      <div style={cardStyle}>
        {/* Logo file upload */}
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: 16, background: C.cream, borderRadius: 12, marginBottom: 24 }}>
          <label style={{ width: 72, height: 72, borderRadius: 16, background: C.paleOrange, border: `2px dashed ${C.orange}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer', overflow: 'hidden' }}>
            {preview
              ? <img src={preview} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <Camera size={28} style={{ color: C.orange }} />}
            <input type="file" accept="image/png,image/jpeg,image/webp" style={{ display: 'none' }} onChange={handleFile} />
          </label>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 4 }}>Store Logo</p>
            <p style={{ fontSize: 12, color: C.slate, fontFamily: FONT }}>PNG, JPG or WebP. Click to upload.</p>
            {preview && <p style={{ fontSize: 11, color: C.success, fontFamily: FONT, marginTop: 4 }}>✓ Logo selected</p>}
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Store Name <span style={{ color: C.orange }}>*</span></label>
          <input placeholder="e.g. Creative Classroom Resources"
            value={form.storeName} onChange={e => setForm({ ...form, storeName: e.target.value })}
            style={inputStyle} />
          {form.storeName && (
            <p style={{ fontSize: 11, color: C.slate, marginTop: 5, fontFamily: FONT }}>
              Your store URL: <span style={{ color: C.orange }}>{form.storeName.toLowerCase().replace(/\s+/g, '-')}.solvexo.store</span>
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Store Category <span style={{ color: C.orange }}>*</span></label>
          <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}
            style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select your main category...</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Store Description <span style={{ color: C.slate, fontWeight: 400 }}>(optional)</span></label>
          <textarea placeholder="Tell buyers what makes your store special..."
            rows={4} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
            style={{ ...inputStyle, resize: 'vertical' }} />
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={() => canProceed && onNext()} disabled={!canProceed}>
          Continue <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
        </Button>
      </div>
    </div>
  );
}

// ── Step 2 — Seller Type ──────────────────────────────────────────────────────
function Step2({ form, setForm, onNext, onBack }: { form: StoreForm; setForm: (f: StoreForm) => void; onNext: () => void; onBack: () => void }) {
  return (
    <div style={{ maxWidth: 760, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>What kind of seller are you?</h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT }}>We'll personalise your dashboard and tools based on your answer.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {SELLER_TYPES.map((t, idx) => {
          const selKey = `${t.id}-${idx}`;
          const isSelected = form.sellerKey === selKey;
          return (
            <div key={selKey} onClick={() => setForm({ ...form, sellerType: t.id, sellerKey: selKey })}
              style={{ background: C.white, borderRadius: 14, padding: 20, border: `2px solid ${isSelected ? C.orange : C.bone}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: isSelected ? `0 0 0 4px ${C.paleOrange}` : 'none' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <t.Icon size={32} />
                <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${isSelected ? C.orange : C.bone}`, background: isSelected ? C.orange : C.white, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {isSelected && <Check size={10} style={{ color: C.white }} />}
                </div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 4 }}>{t.title}</p>
              <p style={{ fontSize: 11, color: C.slate, fontFamily: FONT, lineHeight: 1.5 }}>{t.desc}</p>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" size="md" onClick={onBack} style={{ flexShrink: 0 }}><ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Back</Button>
        <Button variant="primary" size="lg" style={{ flex: 1, justifyContent: 'center' }} onClick={() => form.sellerType && onNext()} disabled={!form.sellerType}>
          {form.sellerType ? <span>Continue <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span> : 'Select one to continue'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 3 — What You Sell (store create hota hai yahan) ─────────────────────
function Step3({ form, setForm, onNext, onBack, loading, error }: {
  form: StoreForm; setForm: (f: StoreForm) => void;
  onNext: () => void; onBack: () => void;
  loading: boolean; error: string;
}) {
  const toggle = (id: ProductType) =>
    setForm({ ...form, productTypes: form.productTypes.includes(id) ? form.productTypes.filter(x => x !== id) : [...form.productTypes, id] });

  return (
    <div style={{ maxWidth: 700, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>What will you sell?</h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT }}>Select all that apply — we'll activate the right tools for you.</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {PRODUCT_TYPES.map((t, idx) => {
          const on = form.productTypes.includes(t.id);
          return (
            <div key={idx} onClick={() => toggle(t.id)}
              style={{ background: C.white, borderRadius: 14, padding: '18px 16px', border: `2px solid ${on ? C.orange : C.bone}`, cursor: 'pointer', transition: 'all 0.2s', boxShadow: on ? `0 0 0 4px ${C.paleOrange}` : 'none', position: 'relative' }}>
              {on && (
                <div style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRadius: '50%', background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={10} style={{ color: C.white }} />
                </div>
              )}
              <t.Icon size={30} style={{ display: 'block', marginBottom: 10 }} />
              <p style={{ fontSize: 13, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 4 }}>{t.title}</p>
              <p style={{ fontSize: 11, color: C.slate, fontFamily: FONT }}>{t.desc}</p>
            </div>
          );
        })}
      </div>

      {form.productTypes.length > 0 && (
        <div style={{ background: C.paleOrange, borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <Sparkles size={18} style={{ color: C.deepOrange, flexShrink: 0 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.deepOrange, fontFamily: FONT, marginBottom: 6 }}>We'll activate these tools for you:</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {form.productTypes.includes('physical_products') && <span style={tagStyle}>Inventory Manager</span>}
              {form.productTypes.includes('digital_downloads') && <span style={tagStyle}>Digital Delivery</span>}
              {form.productTypes.includes('in_person_pos')     && <span style={tagStyle}>POS Register</span>}
              {form.productTypes.includes('services')          && <span style={tagStyle}>Bookings</span>}
              <span style={tagStyle}>AI Studio</span>
              <span style={tagStyle}>Marketplace</span>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div style={{ background: C.errorBg, borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertTriangle size={14} style={{ color: C.error, flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: C.error, fontFamily: FONT }}>{error}</span>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" size="md" onClick={onBack} style={{ flexShrink: 0 }} disabled={loading}>
          <ArrowLeft size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Back
        </Button>
        <Button variant="primary" size="lg" style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => form.productTypes.length > 0 && onNext()}
          disabled={form.productTypes.length === 0 || loading}>
          {loading
            ? <span style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}><Loader size={14} /> Creating your store...</span>
            : form.productTypes.length > 0
              ? <span>Create Store <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} /></span>
              : 'Select at least one'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 4 — Go Live (direct store data from createStore) ─────────────────────
function Step4({ store }: { store: StoreData | null }) {
  const navigate = useNavigate();

  const sellerLabel   = SELLER_TYPES.find(t => t.id === store?.sellerType)?.title ?? store?.sellerType ?? '—';
  const productLabels = (store?.productTypes ?? []).map(p => PRODUCT_TYPES.find(t => t.id === p)?.title ?? p).filter((v, i, a) => a.indexOf(v) === i).join(', ');
  const toolLabels    = (store?.enabledTools ?? []).map(t => t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())).join(', ');

  return (
    <div style={{ maxWidth: 580, width: '100%', margin: '0 auto' }}>
      <div style={{ ...cardStyle, textAlign: 'center', padding: '48px 40px' }}>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 10 }}>Your store is ready!</h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT, lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
          Welcome to Solvexo. Your seller dashboard is set up and your tools are activated.
        </p>

        {/* Real store summary from API — 2 column layout */}
        <div style={{ background: C.cream, borderRadius: 14, padding: 20, marginBottom: 28, textAlign: 'left' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 14 }}>Your Solvexo Setup</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {[
              { Icon: Store,      label: 'Store',         value: store?.name ?? '—' },
              { Icon: Globe,      label: 'Store URL',     value: store?.slug ? `${store.slug}.solvexo.store` : '—' },
              { Icon: User,       label: 'Seller type',   value: sellerLabel },
              { Icon: Package,    label: 'Category',      value: store?.categoryId ?? '—' },
              { Icon: Download,   label: 'Products',      value: productLabels || '—' },
              { Icon: CreditCard, label: 'Plan',           value: store?.plan ? `${store.plan.charAt(0).toUpperCase() + store.plan.slice(1)} — Free` : 'Starter — Free' },
              { Icon: Sparkles,   label: 'AI Credits',    value: store?.aiCredits != null ? `${store.aiCredits} free credits included` : '—' },
              { Icon: Wrench,     label: 'Active Tools',  value: toolLabels || '—', fullWidth: true },
            ].map(({ Icon, label, value, fullWidth }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, gridColumn: fullWidth ? '1 / -1' : undefined }}>
                <Icon size={16} style={{ width: 24, color: C.slate, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={{ fontSize: 10, color: C.slate, fontFamily: FONT }}>{label}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: C.carbon, fontFamily: FONT }}>{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended next steps */}
        <p style={{ fontSize: 13, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 14 }}>Recommended next steps</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { Icon: Plus,         label: 'Add your first product', path: '/seller/products/add' },
            { Icon: Wrench,       label: 'Customise your store',   path: '/seller/store' },
            { Icon: ShoppingCart, label: 'Browse the marketplace',  path: '/marketplace' },
          ].map(({ Icon, label, path }) => (
            <div key={label} onClick={() => navigate(path, { replace: true })} style={{ padding: '14px 12px', borderRadius: 12, border: `1.5px solid ${C.bone}`, background: C.white, textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }} onMouseEnter={e => (e.currentTarget.style.borderColor = C.orange)} onMouseLeave={e => (e.currentTarget.style.borderColor = C.bone)}>
              <Icon size={24} style={{ display: 'block', margin: '0 auto 6px', color: C.charcoal }} />
              <p style={{ fontSize: 12, fontWeight: 500, color: C.charcoal, fontFamily: FONT }}>{label}</p>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={() => navigate('/seller/dashboard', { replace: true })}>
          Go to My Dashboard <ArrowRight size={14} style={{ display: 'inline', verticalAlign: 'middle', marginLeft: 4 }} />
        </Button>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate    = useNavigate();
  usePageTitle('Onboarding');
  const createStore = useCreateStore();
  const [step, setStep]               = useState(1);
  const [maxReached, setMaxReached]   = useState(1); // tracks highest step visited
  const [form, setForm] = useState<StoreForm>({
    storeName: '', categoryId: '', description: '', logo: '',
    sellerType: '', sellerKey: '', productTypes: [],
  });

  const next = () => setStep(s => { const n = Math.min(s + 1, 4); setMaxReached(m => Math.max(m, n)); return n; });
  const back = () => setStep(s => Math.max(s - 1, 1));
  const jumpTo = (target: number) => setStep(target); // click on completed step

  // Step 3 — API call on Continue
  const handleStep3Next = async () => {
    if (!form.sellerType || form.productTypes.length === 0) return;
    const result = await createStore.execute({
      name:         form.storeName,
      categoryId:   form.categoryId,
      description:  form.description,
      sellerType:   form.sellerType as SellerType,
      productTypes: [...new Set(form.productTypes)],
    });
    if (result) {
      setMaxReached(4);
      setStep(4);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <PageHeader onSignIn={() => navigate('/login')} />

      <div style={{ background: C.white, borderBottom: `1px solid ${C.bone}`, padding: '12px 40px' }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <StepProgress current={step} maxReached={maxReached} onStepClick={jumpTo} />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '32px 24px 60px' }}>
        {step === 1 && <Step1 form={form} setForm={setForm} onNext={next} />}
        {step === 2 && <Step2 form={form} setForm={setForm} onNext={next} onBack={back} />}
        {step === 3 && (
          <Step3
            form={form} setForm={setForm}
            onNext={handleStep3Next} onBack={back}
            loading={createStore.loading} error={createStore.error}
          />
        )}
        {step === 4 && <Step4 store={createStore.store} />}
      </div>
    </div>
  );
}
