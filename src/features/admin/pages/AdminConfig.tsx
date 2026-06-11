import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { AlertCircle, AlertTriangle } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
interface ToggleItem { id: string; label: string; desc: string; enabled: boolean }

const DEFAULT_FLAGS: ToggleItem[] = [
  { id: 'ai_studio',      label: 'AI Studio',           desc: 'Enable AI-powered tools for sellers',            enabled: true  },
  { id: 'marketplace',    label: 'Marketplace',          desc: 'Allow products to be listed in the marketplace', enabled: true  },
  { id: 'digital_upload', label: 'Digital Uploads',      desc: 'Sellers can upload digital products',            enabled: true  },
  { id: 'affiliate',      label: 'Affiliate Program',    desc: 'Enable seller affiliate / referral program',     enabled: false },
  { id: 'gift_cards',     label: 'Gift Cards',           desc: 'Enable gift card creation and redemption',       enabled: false },
  { id: 'pos_mode',       label: 'POS Mode',             desc: 'Enable point-of-sale register for sellers',      enabled: true  },
  { id: 'store_builder',  label: 'Store Builder',        desc: 'Let sellers customize their storefront',        enabled: true  },
  { id: 'bulk_import',    label: 'Bulk Product Import',  desc: 'Allow CSV import for product listings',          enabled: false },
];

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const inputStyle: React.CSSProperties = { width: '100%', padding: '9px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, outline: 'none', fontFamily: poppins, color: '#2C2A28', background: '#fff', boxSizing: 'border-box' as const };
const labelStyle: React.CSSProperties = { fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 5, display: 'block', fontFamily: poppins };

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} style={{ position: 'relative', width: 40, height: 22, cursor: 'pointer', background: 'none', border: 'none', flexShrink: 0, padding: 0 }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 11, background: enabled ? '#D97757' : '#E8E6DC', transition: 'background 0.2s' }} />
      <div style={{ position: 'absolute', top: 3, left: enabled ? 21 : 3, width: 16, height: 16, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }} />
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminConfig() {
  usePageTitle('Config');
  const [flags,           setFlags]          = useState<ToggleItem[]>(DEFAULT_FLAGS);
  const [aiCredits,       setAiCredits]      = useState('1000');
  const [aiModel,         setAiModel]        = useState('claude-sonnet-4-6');
  const [fromName,        setFromName]       = useState('Solvexo');
  const [fromEmail,       setFromEmail]      = useState('noreply@solvexo.com');
  const [replyTo,         setReplyTo]        = useState('support@solvexo.com');
  const [maintenance,     setMaintenance]    = useState(false);
  const [maintenanceMsg,  setMaintenanceMsg] = useState('');

  const toggleFlag = (id: string) => setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));

  return (
    <div style={{ padding: '24px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

      {/* ── Header ── */}
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#141413', marginBottom: 3 }}>Platform Config</h1>
        <p style={{ fontSize: 12, color: '#8C8A82' }}>Feature flags, AI settings, email config and system controls.</p>
      </div>

      {/* ── Maintenance Mode ── */}
      <div style={{ ...cardStyle, border: maintenance ? '2px solid #C13030' : '1px solid #E8E6DC' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
              <AlertCircle size={15} style={{ color: '#C13030' }} /> Maintenance Mode
            </p>
            <p style={{ fontSize: 12, color: '#8C8A82' }}>When enabled, the platform shows a maintenance page to all users.</p>
          </div>
          <ToggleSwitch enabled={maintenance} onToggle={() => setMaintenance(m => !m)} />
        </div>
        {maintenance && (
          <div style={{ marginTop: 16 }}>
            <label style={labelStyle}>Maintenance Message</label>
            <input placeholder="We are back soon! Scheduled maintenance until 4:00 AM UTC." value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)} style={inputStyle} />
            <p style={{ fontSize: 11, marginTop: 8, fontWeight: 600, color: '#C13030', display: 'flex', alignItems: 'center', gap: 4, fontFamily: poppins }}>
              <AlertTriangle size={11} /> Maintenance mode is ON — users cannot access the platform.
            </p>
          </div>
        )}
      </div>

      {/* ── 2-col ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Feature Flags */}
        <div style={cardStyle}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 18 }}>Feature Flags</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {flags.map((flag, i) => (
              <div key={flag.id}>
                {i > 0 && <div style={{ height: 1, background: '#F0EEE6', margin: '10px 0' }} />}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#141413', fontFamily: poppins }}>{flag.label}</p>
                    <p style={{ fontSize: 11, color: '#8C8A82', fontFamily: poppins }}>{flag.desc}</p>
                  </div>
                  <ToggleSwitch enabled={flag.enabled} onToggle={() => toggleFlag(flag.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* AI Config */}
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 16 }}>AI Configuration</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Monthly Credit Limit (per seller)</label>
                <input type="number" value={aiCredits} onChange={e => setAiCredits(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>AI Model</label>
                <select value={aiModel} onChange={e => setAiModel(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                  <option value="claude-opus-4">Claude Opus 4</option>
                </select>
              </div>
              <div style={{ background: '#FBECE4', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#B95A3A' }}>
                <p style={{ fontWeight: 600, marginBottom: 3, fontFamily: poppins }}>Cost estimate</p>
                <p style={{ color: '#8C6050', fontFamily: poppins }}>
                  At {aiCredits} credits × 12,481 active sellers = ~{(parseInt(aiCredits || '0') * 12481).toLocaleString()} credits / month
                </p>
              </div>
              <button style={{ padding: '8px 18px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins, alignSelf: 'flex-start' }}>
                Save AI Config
              </button>
            </div>
          </div>

          {/* Email Config */}
          <div style={cardStyle}>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#141413', marginBottom: 16 }}>Email Configuration</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>From Name</label>
                <input value={fromName} onChange={e => setFromName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>From Email</label>
                <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Reply-To Email</label>
                <input type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Email Provider</label>
                <select style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option>SendGrid</option>
                  <option>Mailgun</option>
                  <option>AWS SES</option>
                  <option>Postmark</option>
                </select>
              </div>
              <button style={{ padding: '8px 18px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins, alignSelf: 'flex-start' }}>
                Save Email Config
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}