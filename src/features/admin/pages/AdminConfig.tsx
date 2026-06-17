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

// ── Toggle switch ─────────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="relative w-10 h-[22px] cursor-pointer bg-transparent border-none flex-shrink-0 p-0">
      <div className="w-full h-full rounded-[11px] transition-colors duration-200"
        style={{ background: enabled ? '#D97757' : '#E8E6DC' }} />
      <div className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-200"
        style={{ left: enabled ? 21 : 3 }} />
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
    <div className="px-7 pt-6 pb-8 flex flex-col gap-5">

      {/* ── Header ── */}
      <div>
        <h1 className="text-[18px] font-bold text-charcoal mb-[3px]">Platform Config</h1>
        <p className="text-[12px] text-slate">Feature flags, AI settings, email config and system controls.</p>
      </div>

      {/* ── Maintenance Mode ── */}
      <div
        className="bg-white rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
        style={{ border: maintenance ? '2px solid #C13030' : '1px solid #E8E6DC' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-bold text-charcoal flex items-center gap-[6px] mb-[3px]">
              <AlertCircle size={15} style={{ color: '#C13030' }} /> Maintenance Mode
            </p>
            <p className="text-[12px] text-slate">When enabled, the platform shows a maintenance page to all users.</p>
          </div>
          <ToggleSwitch enabled={maintenance} onToggle={() => setMaintenance(m => !m)} />
        </div>
        {maintenance && (
          <div className="mt-4">
            <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">Maintenance Message</label>
            <input placeholder="We are back soon! Scheduled maintenance until 4:00 AM UTC." value={maintenanceMsg} onChange={e => setMaintenanceMsg(e.target.value)}
              className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
            <p className="text-[11px] mt-2 font-semibold text-[#C13030] flex items-center gap-1">
              <AlertTriangle size={11} /> Maintenance mode is ON — users cannot access the platform.
            </p>
          </div>
        )}
      </div>

      {/* ── 2-col ── */}
      <div className="grid grid-cols-2 gap-4">

        {/* Feature Flags */}
        <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
          <p className="text-[14px] font-bold text-charcoal mb-[18px]">Feature Flags</p>
          <div className="flex flex-col gap-0">
            {flags.map((flag, i) => (
              <div key={flag.id}>
                {i > 0 && <div className="h-px bg-[#F0EEE6] my-[10px]" />}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-charcoal">{flag.label}</p>
                    <p className="text-[11px] text-slate">{flag.desc}</p>
                  </div>
                  <ToggleSwitch enabled={flag.enabled} onToggle={() => toggleFlag(flag.id)} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* AI Config */}
          <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[14px] font-bold text-charcoal mb-4">AI Configuration</p>
            <div className="flex flex-col gap-[14px]">
              <div>
                <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">Monthly Credit Limit (per seller)</label>
                <input type="number" value={aiCredits} onChange={e => setAiCredits(e.target.value)}
                  className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">AI Model</label>
                <select value={aiModel} onChange={e => setAiModel(e.target.value)}
                  className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border cursor-pointer">
                  <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                  <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                  <option value="claude-opus-4">Claude Opus 4</option>
                </select>
              </div>
              <div className="bg-[#FBECE4] rounded-lg px-3 py-[10px] text-[12px] text-[#B95A3A]">
                <p className="font-semibold mb-[3px]">Cost estimate</p>
                <p className="text-[#8C6050]">
                  At {aiCredits} credits × 12,481 active sellers = ~{(parseInt(aiCredits || '0') * 12481).toLocaleString()} credits / month
                </p>
              </div>
              <button className="px-[18px] py-2 bg-brand-orange border-none rounded-lg text-[12px] font-semibold text-white cursor-pointer self-start">
                Save AI Config
              </button>
            </div>
          </div>

          {/* Email Config */}
          <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[14px] font-bold text-charcoal mb-4">Email Configuration</p>
            <div className="flex flex-col gap-[14px]">
              <div>
                <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">From Name</label>
                <input value={fromName} onChange={e => setFromName(e.target.value)}
                  className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">From Email</label>
                <input type="email" value={fromEmail} onChange={e => setFromEmail(e.target.value)}
                  className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">Reply-To Email</label>
                <input type="email" value={replyTo} onChange={e => setReplyTo(e.target.value)}
                  className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border" />
              </div>
              <div>
                <label className="text-[12px] font-medium text-[#4A4945] mb-[5px] block">Email Provider</label>
                <select className="w-full px-3 py-[9px] text-[13px] border border-bone rounded-lg outline-none text-[#2C2A28] bg-white box-border cursor-pointer">
                  <option>SendGrid</option>
                  <option>Mailgun</option>
                  <option>AWS SES</option>
                  <option>Postmark</option>
                </select>
              </div>
              <button className="px-[18px] py-2 bg-brand-orange border-none rounded-lg text-[12px] font-semibold text-white cursor-pointer self-start">
                Save Email Config
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
