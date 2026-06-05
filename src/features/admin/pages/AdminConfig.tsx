import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Divider';

interface Toggle {
  id:      string;
  label:   string;
  desc:    string;
  enabled: boolean;
}

const DEFAULT_FLAGS: Toggle[] = [
  { id: 'ai_studio',      label: 'AI Studio',          desc: 'Enable AI-powered tools for sellers',            enabled: true  },
  { id: 'marketplace',    label: 'Marketplace',         desc: 'Allow products to be listed in the marketplace', enabled: true  },
  { id: 'digital_upload', label: 'Digital Uploads',     desc: 'Sellers can upload digital products',            enabled: true  },
  { id: 'affiliate',      label: 'Affiliate Program',   desc: 'Enable seller affiliate / referral program',     enabled: false },
  { id: 'gift_cards',     label: 'Gift Cards',          desc: 'Enable gift card creation and redemption',       enabled: false },
  { id: 'pos_mode',       label: 'POS Mode',            desc: 'Enable point-of-sale register for sellers',      enabled: true  },
  { id: 'store_builder',  label: 'Store Builder',       desc: 'Let sellers customize their storefront',        enabled: true  },
  { id: 'bulk_import',    label: 'Bulk Product Import', desc: 'Allow CSV import for product listings',          enabled: false },
];

function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className="relative flex-shrink-0 cursor-pointer"
      style={{ width: 40, height: 22 }}
    >
      <div
        className="w-full h-full rounded-full transition-colors"
        style={{ background: enabled ? '#D97757' : '#E8E6DC' }}
      />
      <div
        className="absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-all"
        style={{ left: enabled ? '21px' : '3px' }}
      />
    </button>
  );
}

export function AdminConfig() {
  usePageTitle('Config');
  const [flags, setFlags]           = useState<Toggle[]>(DEFAULT_FLAGS);
  const [aiCredits, setAiCredits]   = useState('1000');
  const [aiModel, setAiModel]       = useState('claude-sonnet-4-6');
  const [fromName, setFromName]     = useState('Solvexo');
  const [fromEmail, setFromEmail]   = useState('noreply@solvexo.com');
  const [replyTo, setReplyTo]       = useState('support@solvexo.com');
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState('');

  const toggleFlag = (id: string) =>
    setFlags(prev => prev.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-carbon">Platform Config</h1>
        <p className="text-[12px] text-slate mt-0.5">Feature flags, AI settings, email config and system controls.</p>
      </div>

      {/* Maintenance Mode — always visible at top */}
      <Card className={maintenance ? 'border-2 border-error' : ''}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[14px] font-bold text-carbon">🚨 Maintenance Mode</p>
            <p className="text-[12px] text-slate mt-0.5">
              When enabled, the platform shows a maintenance page to all users.
            </p>
          </div>
          <Toggle enabled={maintenance} onToggle={() => setMaintenance(m => !m)} />
        </div>
        {maintenance && (
          <div className="mt-4">
            <Input
              label="Maintenance Message"
              placeholder="We are back soon! Scheduled maintenance until 4:00 AM UTC."
              value={maintenanceMsg}
              onChange={e => setMaintenanceMsg(e.target.value)}
            />
            <p className="text-[11px] mt-1.5 font-semibold" style={{ color: '#C13030' }}>
              ⚠️ Maintenance mode is ON — users cannot access the platform.
            </p>
          </div>
        )}
      </Card>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        {/* Feature flags */}
        <Card>
          <p className="text-[14px] font-bold text-carbon mb-4">Feature Flags</p>
          <div className="flex flex-col gap-3">
            {flags.map((flag, i) => (
              <div key={flag.id}>
                {i > 0 && <Divider my={2} />}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-carbon">{flag.label}</p>
                    <p className="text-[11px] text-slate">{flag.desc}</p>
                  </div>
                  <Toggle enabled={flag.enabled} onToggle={() => toggleFlag(flag.id)} />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right column */}
        <div className="flex flex-col gap-5">
          {/* AI Config */}
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4">AI Configuration</p>
            <div className="flex flex-col gap-3">
              <Input
                label="Monthly Credit Limit (per seller)"
                type="number"
                value={aiCredits}
                onChange={e => setAiCredits(e.target.value)}
              />
              <Select
                label="AI Model"
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
              >
                <option value="claude-sonnet-4-6">Claude Sonnet 4.6</option>
                <option value="claude-haiku-4-5">Claude Haiku 4.5</option>
                <option value="claude-opus-4">Claude Opus 4</option>
              </Select>
              <div
                className="rounded-lg p-3 text-[12px]"
                style={{ background: '#FBECE4', color: '#B95A3A' }}
              >
                <p className="font-semibold mb-0.5">Cost estimate</p>
                <p style={{ color: '#8C6050' }}>
                  At {aiCredits} credits × 12,481 active sellers = ~{(parseInt(aiCredits || '0') * 12481).toLocaleString()} credits / month
                </p>
              </div>
              <Button variant="primary" size="sm">Save AI Config</Button>
            </div>
          </Card>

          {/* Email Config */}
          <Card>
            <p className="text-[14px] font-bold text-carbon mb-4">Email Configuration</p>
            <div className="flex flex-col gap-3">
              <Input
                label="From Name"
                value={fromName}
                onChange={e => setFromName(e.target.value)}
              />
              <Input
                label="From Email"
                type="email"
                value={fromEmail}
                onChange={e => setFromEmail(e.target.value)}
              />
              <Input
                label="Reply-To Email"
                type="email"
                value={replyTo}
                onChange={e => setReplyTo(e.target.value)}
              />
              <Select label="Email Provider">
                <option>SendGrid</option>
                <option>Mailgun</option>
                <option>AWS SES</option>
                <option>Postmark</option>
              </Select>
              <Button variant="primary" size="sm">Save Email Config</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
