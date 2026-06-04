import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { SolvexoLogo } from '@/components/ui/SolvexoLogo';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  orange: '#D97757', deepOrange: '#B95A3A', paleOrange: '#FBECE4',
  carbon: '#141413', charcoal: '#2C2A28', slate: '#8C8A82',
  bone: '#E8E6DC', cream: '#FAF9F5', white: '#FFFFFF',
  success: '#2D8A4E',
};
const FONT = "'Poppins', sans-serif";

// ── Step data ─────────────────────────────────────────────────────────────────
const STEPS = ['Account', 'Store Info', 'Seller Type', 'What You Sell', 'Go Live'];

const SELLER_TYPES = [
  { id: 'creator',    emoji: '🎨', title: 'Creator',          desc: 'Sell digital art, templates, fonts, music, presets' },
  { id: 'educator',   emoji: '📚', title: 'Educator',          desc: 'Worksheets, lesson plans, curriculum, assessments' },
  { id: 'retailer',   emoji: '🏪', title: 'Retailer',          desc: 'Physical goods, handmade products, branded items' },
  { id: 'brand',      emoji: '💼', title: 'Brand / Business',  desc: 'Run a full online store with inventory and POS' },
  { id: 'freelancer', emoji: '💻', title: 'Freelancer',        desc: 'Offer services, bookings, or consulting packages' },
  { id: 'multiple',   emoji: '🌐', title: 'Mix of the above',  desc: 'I sell across multiple categories and formats' },
];

const PRODUCT_TYPES = [
  { id: 'physical',      emoji: '📦', title: 'Physical Products',    desc: 'Ship items to customers' },
  { id: 'digital',       emoji: '💾', title: 'Digital Downloads',    desc: 'PDFs, files, audio, video' },
  { id: 'educational',   emoji: '📚', title: 'Educational Resources',desc: 'Worksheets, lesson plans' },
  { id: 'services',      emoji: '📅', title: 'Services / Bookings',  desc: 'Appointments and packages' },
  { id: 'subscriptions', emoji: '🔁', title: 'Subscriptions',        desc: 'Recurring membership access' },
  { id: 'pos',           emoji: '🖥️', title: 'In-Person / POS',     desc: 'Sell at a physical location' },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 8,
  border: `1px solid ${C.bone}`, fontSize: 13, fontFamily: FONT,
  color: C.charcoal, outline: 'none', boxSizing: 'border-box',
  background: C.white,
};
const labelStyle: CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 500,
  color: C.charcoal, marginBottom: 6, fontFamily: FONT,
};
const cardStyle: CSSProperties = {
  background: C.white, borderRadius: 16, padding: 32,
  border: `1px solid ${C.bone}`,
  //  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
  width: '100%',
};

// ── Step Progress ─────────────────────────────────────────────────────────────
function StepProgress({ current }: { current: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0, fontFamily: FONT }}>
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done   = n < current;
        const active = n === current;
        return (
          <div key={n} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700, fontFamily: FONT,
                transition: 'all 0.3s',
                background: done ? C.success : active ? C.orange : C.bone,
                color:      done || active ? C.white : C.slate,
                boxShadow:  active ? `0 0 0 4px ${C.paleOrange}` : 'none',
              }}>
                {done ? '✓' : n}
              </div>
              <span style={{
                marginTop: 6, fontSize: 10, fontWeight: 500,
                color: active ? C.orange : done ? C.success : C.slate,
                whiteSpace: 'nowrap',
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                width: 60, height: 2, marginBottom: 16, marginLeft: 4, marginRight: 4,
                background: n < current ? C.success : C.bone,
                borderRadius: 2, transition: 'all 0.3s',
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Social Button ─────────────────────────────────────────────────────────────
function SocialBtn({ icon, label }: { icon: string; label: string }) {
  return (
    <button style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      padding: '10px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500,
      fontFamily: FONT, cursor: 'pointer', background: C.white,
      border: `1px solid ${C.bone}`, color: C.charcoal, transition: 'background 0.15s',
    }}>
      <span style={{ fontSize: 16 }}>{icon}</span>
      {label}
    </button>
  );
}

// ── OR Divider ────────────────────────────────────────────────────────────────
function OrDivider() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
      <div style={{ flex: 1, height: 1, background: C.bone }} />
      <span style={{ fontSize: 12, color: C.slate, fontFamily: FONT }}>or continue with</span>
      <div style={{ flex: 1, height: 1, background: C.bone }} />
    </div>
  );
}

// ── Page Header ───────────────────────────────────────────────────────────────
function PageHeader({ onSignIn }: { onSignIn: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 40px', height: 64, borderBottom: `1px solid ${C.bone}`,
      background: C.white, position: 'sticky', top: 44, zIndex: 10,
    }}>
      <SolvexoLogo size={30} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: FONT }}>
        <span style={{ fontSize: 13, color: C.slate }}>Already have an account?</span>
        <Button variant="ghost" size="sm" onClick={onSignIn}>Sign In</Button>
      </div>
    </div>
  );
}

// ── Step 1 — Create Account ───────────────────────────────────────────────────
function Step1({ onNext }: { onNext: () => void }) {
  return (
    <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>
          Create your free account
        </h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT }}>
          Commerce. Solved. — Start selling in minutes.
        </p>
      </div>

      <div style={cardStyle}>
        {/* Name row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>First Name</label>
            <input defaultValue="Alex" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Last Name</label>
            <input defaultValue="Chen" style={inputStyle} />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Email Address</label>
          <input type="email" placeholder="alex@example.com" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Password</label>
          <input type="password" placeholder="Minimum 8 characters" style={inputStyle} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Country</label>
          <select defaultValue="United States" style={{ ...inputStyle, cursor: 'pointer' }}>
            <option>United States</option>
            <option>Canada</option>
            <option>United Kingdom</option>
            <option>Australia</option>
            <option>Other</option>
          </select>
        </div>

        <OrDivider />

        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          <SocialBtn icon="🌐" label="Google"   />
          <SocialBtn icon="🍎" label="Apple"    />
          <SocialBtn icon="📘" label="Facebook" />
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={onNext}>
          Create Free Account →
        </Button>

        <p style={{ textAlign: 'center', fontSize: 11, color: C.slate, marginTop: 12, fontFamily: FONT }}>
          By signing up you agree to our{' '}
          <span style={{ color: C.orange, cursor: 'pointer' }}>Terms of Service</span>
          {' '}and{' '}
          <span style={{ color: C.orange, cursor: 'pointer' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}

// ── Step 2 — Store Info ───────────────────────────────────────────────────────
function Step2({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [name, setName] = useState('');
  return (
    <div style={{ maxWidth: 520, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>
          Set up your store
        </h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT }}>
          You can always update these details later from Settings.
        </p>
      </div>

      <div style={cardStyle}>
        {/* Logo upload */}
        <div style={{
          display: 'flex', gap: 20, alignItems: 'center',
          padding: 16, background: C.cream, borderRadius: 12, marginBottom: 24,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: 16, background: C.paleOrange,
            border: `2px dashed ${C.orange}`, display: 'flex', alignItems: 'center',
            justifyContent: 'center', flexShrink: 0, cursor: 'pointer', fontSize: 28,
          }}>
            📷
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 4 }}>
              Upload your store logo
            </p>
            <p style={{ fontSize: 12, color: C.slate, fontFamily: FONT, marginBottom: 8 }}>
              PNG or JPG, min 200×200px. Helps buyers recognise your brand.
            </p>
            <Button variant="secondary" size="sm">Choose File</Button>
          </div>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>
            Store Name <span style={{ color: C.orange }}>*</span>
          </label>
          <input
            placeholder="e.g. Creative Classroom Resources"
            value={name}
            onChange={e => setName(e.target.value)}
            style={inputStyle}
          />
          {name && (
            <p style={{ fontSize: 11, color: C.slate, marginTop: 5, fontFamily: FONT }}>
              Your store URL:{' '}
              <span style={{ color: C.orange }}>
                {name.toLowerCase().replace(/\s+/g, '-')}.solvexo.store
              </span>
            </p>
          )}
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Store Category</label>
          <select style={{ ...inputStyle, cursor: 'pointer' }}>
            <option value="">Select your main category...</option>
            <option>Education & Learning</option>
            <option>Art & Design</option>
            <option>Handmade & Crafts</option>
            <option>Digital Downloads</option>
            <option>Home & Lifestyle</option>
            <option>Business & Productivity</option>
            <option>Fashion & Apparel</option>
            <option>Technology</option>
          </select>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>
            Store Description{' '}
            <span style={{ color: C.slate, fontWeight: 400 }}>(optional)</span>
          </label>
          <textarea
            placeholder="Tell buyers what makes your store special..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="ghost" size="md" onClick={onBack}>← Back</Button>
          <Button variant="primary" size="lg" style={{ flex: 1, justifyContent: 'center' }} onClick={onNext}>
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Step 3 — Seller Type ──────────────────────────────────────────────────────
function Step3({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div style={{ maxWidth: 760, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>
          What kind of seller are you?
        </h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT }}>
          We'll personalise your dashboard and tools based on your answer.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {SELLER_TYPES.map(t => (
          <div
            key={t.id}
            onClick={() => setSelected(t.id)}
            style={{
              background: C.white, borderRadius: 14, padding: 20,
              border: `2px solid ${selected === t.id ? C.orange : C.bone}`,
              cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: selected === t.id ? `0 0 0 4px ${C.paleOrange}` : 'none',
              position: 'relative',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{t.emoji}</span>
              <div style={{
                width: 20, height: 20, borderRadius: '50%',
                border: `2px solid ${selected === t.id ? C.orange : C.bone}`,
                background: selected === t.id ? C.orange : C.white,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {selected === t.id && <span style={{ fontSize: 10, color: C.white, fontWeight: 700 }}>✓</span>}
              </div>
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 4 }}>{t.title}</p>
            <p style={{ fontSize: 11, color: C.slate, fontFamily: FONT, lineHeight: 1.5 }}>{t.desc}</p>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" size="md" onClick={onBack} style={{ flexShrink: 0 }}>← Back</Button>
        <Button
          variant="primary" size="lg"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => selected && onNext()}
        >
          {selected ? 'Continue →' : 'Select one to continue'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 4 — What You Sell ────────────────────────────────────────────────────
function Step4({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const toggle = (id: string) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  return (
    <div style={{ maxWidth: 700, width: '100%', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 8 }}>
          What will you sell?
        </h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT }}>
          Select all that apply — we'll activate the right tools for you.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
        {PRODUCT_TYPES.map(t => {
          const on = selected.includes(t.id);
          return (
            <div
              key={t.id}
              onClick={() => toggle(t.id)}
              style={{
                background: C.white, borderRadius: 14, padding: '18px 16px',
                border: `2px solid ${on ? C.orange : C.bone}`,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: on ? `0 0 0 4px ${C.paleOrange}` : 'none',
                position: 'relative',
              }}
            >
              {on && (
                <div style={{
                  position: 'absolute', top: 10, right: 10,
                  width: 20, height: 20, borderRadius: '50%',
                  background: C.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: 10, color: C.white, fontWeight: 700 }}>✓</span>
                </div>
              )}
              <span style={{ fontSize: 30, display: 'block', marginBottom: 10 }}>{t.emoji}</span>
              <p style={{ fontSize: 13, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 4 }}>{t.title}</p>
              <p style={{ fontSize: 11, color: C.slate, fontFamily: FONT }}>{t.desc}</p>
            </div>
          );
        })}
      </div>

      {selected.length > 0 && (
        <div style={{
          background: C.paleOrange, borderRadius: 12, padding: '14px 18px',
          marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 18 }}>✨</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: C.deepOrange, fontFamily: FONT, marginBottom: 6 }}>
              We'll activate these tools for you:
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {selected.includes('physical')      && <span style={tagStyle}>Inventory Manager</span>}
              {selected.includes('digital')       && <span style={tagStyle}>Digital Delivery</span>}
              {selected.includes('educational')   && <span style={tagStyle}>AI Worksheet Builder</span>}
              {selected.includes('pos')           && <span style={tagStyle}>POS Register</span>}
              {selected.includes('subscriptions') && <span style={tagStyle}>Subscriptions</span>}
              <span style={tagStyle}>AI Studio</span>
              <span style={tagStyle}>Marketplace</span>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <Button variant="ghost" size="md" onClick={onBack} style={{ flexShrink: 0 }}>← Back</Button>
        <Button
          variant="primary" size="lg"
          style={{ flex: 1, justifyContent: 'center' }}
          onClick={() => selected.length > 0 && onNext()}
        >
          {selected.length > 0 ? 'Continue →' : 'Select at least one'}
        </Button>
      </div>
    </div>
  );
}

const tagStyle: CSSProperties = {
  background: '#EBF7EF', color: '#2D8A4E',
  fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
  fontFamily: FONT,
};

// ── Step 5 — Go Live ──────────────────────────────────────────────────────────
function Step5({ onFinish }: { onFinish: () => void }) {
  return (
    <div style={{ maxWidth: 580, width: '100%', margin: '0 auto' }}>
      <div style={{
        ...cardStyle,
        textAlign: 'center',
        padding: '48px 40px',
        // boxShadow: '0 8px 48px rgba(0,0,0,0.08)',
      }}>
        {/* <div style={{ fontSize: 52, marginBottom: 20 }}>🎉</div> */}
        <h1 style={{ fontSize: 30, fontWeight: 700, color: C.carbon, fontFamily: FONT, marginBottom: 10 }}>
          Your store is ready!
        </h1>
        <p style={{ fontSize: 14, color: C.slate, fontFamily: FONT, lineHeight: 1.7, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
          Welcome to Solvexo. Your seller dashboard is set up and your tools are activated. Let's make your first sale.
        </p>

        {/* Setup summary */}
        <div style={{ background: C.cream, borderRadius: 14, padding: 20, marginBottom: 28, textAlign: 'left' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 14 }}>
            Your Solvexo Setup
          </p>
          {[
            ['🏪', 'Store',             'My Solvexo Store'],
            ['👤', 'Seller type',       'Creator'],
            ['📦', 'Products activated','Physical Products, Digital Downloads'],
            ['💳', 'Plan',              'Starter — Free'],
            ['✨', 'AI Credits',        '100 free credits included'],
          ].map(([icon, label, value]) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <span style={{ fontSize: 16, width: 24, textAlign: 'center' }}>{icon}</span>
              <span style={{ fontSize: 12, color: C.slate, fontFamily: FONT, width: 140, flexShrink: 0 }}>{label}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.carbon, fontFamily: FONT }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Next steps */}
        <p style={{ fontSize: 13, fontWeight: 600, color: C.carbon, fontFamily: FONT, marginBottom: 14 }}>
          Recommended next steps
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 28 }}>
          {[
            { icon: '✚', label: 'Add your first product' },
            { icon: '🏗️', label: 'Customise your store' },
            { icon: '🛒', label: 'Browse the marketplace' },
          ].map(item => (
            <div key={item.label} style={{
              padding: '14px 12px', borderRadius: 12,
              border: `1.5px solid ${C.bone}`, background: C.white,
              textAlign: 'center', cursor: 'pointer',
            }}>
              <span style={{ fontSize: 24, display: 'block', marginBottom: 6 }}>{item.icon}</span>
              <p style={{ fontSize: 12, fontWeight: 500, color: C.charcoal, fontFamily: FONT }}>{item.label}</p>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" fullWidth onClick={onFinish}>
          Go to My Dashboard →
        </Button>

        <p style={{ fontSize: 11, color: C.slate, marginTop: 12, fontFamily: FONT }}>
          You're on the free Starter plan.{' '}
          <span style={{ color: C.orange, cursor: 'pointer' }}>Upgrade anytime</span>
          {' '}to unlock unlimited products, AI Studio, POS, and custom domain.
        </p>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function OnboardingPage() {
  const navigate  = useNavigate();
  const [step, setStep] = useState(1);

  const next = () => setStep(s => Math.min(s + 1, 5));
  const back = () => setStep(s => Math.max(s - 1, 1));

  return (
    <div style={{ minHeight: '100vh', background: C.cream, fontFamily: FONT, display: 'flex', flexDirection: 'column' }}>
      <PageHeader onSignIn={() => navigate('/login')} />

      {/* Progress bar — compact, no extra padding */}
      <div style={{
        background: C.white, borderBottom: `1px solid ${C.bone}`,
        padding: '12px 40px',
      }}>
        <div style={{ maxWidth: 500, margin: '0 auto' }}>
          <StepProgress current={step} />
        </div>
      </div>

      {/* Content — reduced top gap */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '32px 24px 60px',
      }}>
        {step === 1 && <Step1 onNext={next} />}
        {step === 2 && <Step2 onNext={next} onBack={back} />}
        {step === 3 && <Step3 onNext={next} onBack={back} />}
        {step === 4 && <Step4 onNext={next} onBack={back} />}
        {step === 5 && <Step5 onFinish={() => navigate('/seller/dashboard')} />}
      </div>
    </div>
  );
}
