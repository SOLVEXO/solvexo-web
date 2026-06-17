import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { CreditCard, DollarSign, BarChart2, Mail, Package, Zap, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
type AppTab = 'connected' | 'available';

interface AppDef {
  id: string; Icon: LucideIcon; iconBg: string; name: string; desc: string;
}

const CONNECTED_APPS: AppDef[] = [
  { id: 'stripe',           Icon: CreditCard, iconBg: '#EEF2FF', name: 'Stripe',           desc: 'Accept credit cards, Apple Pay, Google Pay.'  },
  { id: 'paypal',           Icon: DollarSign, iconBg: '#E8F4FD', name: 'PayPal',           desc: 'PayPal checkout and payout.'                  },
  { id: 'google-analytics', Icon: BarChart2,  iconBg: '#FFF8E1', name: 'Google Analytics', desc: 'Track store traffic and conversions.'          },
  { id: 'mailchimp',        Icon: Mail,       iconBg: '#FFF3E0', name: 'Mailchimp',        desc: 'Sync customers and send email campaigns.'      },
  { id: 'shippo',           Icon: Package,    iconBg: '#E8F5E9', name: 'Shippo',           desc: 'Discounted shipping labels and tracking.'      },
  { id: 'zapier',           Icon: Zap,        iconBg: '#FFF3E0', name: 'Zapier',           desc: 'Connect Solvexo to 5,000+ apps.'               },
];

const WEBHOOK_EVENTS = [
  'order.created','order.paid','order.fulfilled',
  'product.updated','refund.issued','review.posted',
];

const metrics = [
  { label: 'Connected Apps',  value: '6',   sub: 'Active integrations'  },
  { label: 'Last Sync',       value: '2:14 PM', sub: 'All apps synced today' },
  { label: 'Available Apps',  value: '50+', sub: 'In app marketplace'   },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerIntegrations() {
  usePageTitle('Integrations');
  const [activeTab,   setActiveTab]   = useState<AppTab>('connected');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey]      = useState('sk_live_••••••••••••••••••••••••4821');
  const [webhookUrl,  setWebhookUrl]  = useState('');

  const filteredApps = CONNECTED_APPS.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <SellerPageHeader
        title="Apps & Integrations"
        subtitle="Connect your favorite tools and extend Solvexo's power."
        actions={
          <div className="flex items-center gap-1.5 border border-[#E8E6DC] rounded-lg px-3 bg-white">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="border-none outline-none text-[13px] py-2 w-[200px] text-[#2C2A28] bg-transparent"
            />
          </div>
        }
      />

      <div className="px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* ── Metrics ── */}
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-[#E8E6DC] rounded-[10px] px-5 py-4 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
              <p className="text-[11px] font-medium text-[#8C8A82] uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-[#141413] leading-[1.15]">{m.value}</p>
              <p className="text-xs text-[#8C8A82] mt-1">{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Pills ── */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('connected')}
            className="px-4 py-[7px] rounded-[20px] text-[13px] font-medium cursor-pointer border-none transition-all duration-[120ms] flex items-center gap-[5px]"
            style={{
              background: activeTab === 'connected' ? '#141413' : '#fff',
              color:      activeTab === 'connected' ? '#fff'    : '#4A4945',
              boxShadow:  activeTab !== 'connected' ? '0 0 0 1px #E8E6DC' : 'none',
            }}
          >
            <Check size={13} /> Connected (6)
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className="px-4 py-[7px] rounded-[20px] text-[13px] font-medium cursor-pointer border-none transition-all duration-[120ms]"
            style={{
              background: activeTab === 'available' ? '#141413' : '#fff',
              color:      activeTab === 'available' ? '#fff'    : '#4A4945',
              boxShadow:  activeTab !== 'available' ? '0 0 0 1px #E8E6DC' : 'none',
            }}
          >
            Available (6)
          </button>
        </div>

        {/* ── Connected Apps Grid ── */}
        {activeTab === 'connected' && (
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            {filteredApps.map(app => (
              <div key={app.id} className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5 relative">
                {/* Connected badge */}
                <div className="absolute top-4 right-4">
                  <span className="px-[9px] py-[3px] rounded-[5px] text-[11px] font-semibold bg-[#E3F4EA] text-[#1E7A3C] flex items-center gap-1">
                    <Check size={10} /> Connected
                  </span>
                </div>

                {/* Icon */}
                <div
                  className="w-[46px] h-[46px] rounded-[10px] flex items-center justify-center mb-3 shrink-0"
                  style={{ background: app.iconBg }}
                >
                  <app.Icon size={22} style={{ color: '#6B7280' }} />
                </div>

                <p className="text-[16px] font-bold text-[#141413] mb-1 pr-[80px]">{app.name}</p>
                <p className="text-[13px] text-[#8C8A82] mb-4 leading-[1.5]">{app.desc}</p>

                <div className="flex items-center gap-2">
                  <button className="px-[14px] py-[5px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">
                    Configure
                  </button>
                  <button className="px-[14px] py-[5px] bg-[#FDECEA] border border-[#F5C6C2] rounded-[7px] text-xs font-medium text-[#C0392B] cursor-pointer">
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'available' && (
          <div className="flex items-center justify-center py-[60px] text-[#8C8A82] text-[14px]">
            Browse 50+ available apps in the marketplace.
          </div>
        )}

        {/* ── Developer Tools ── */}
        <div className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-5 mt-1">
          <p className="text-[15px] font-bold text-[#141413] mb-5">Developer Tools — API &amp; Webhooks</p>

          <div className="grid gap-5 mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
            {/* API Key */}
            <div>
              <p className="text-xs font-medium text-[#4A4945] mb-1.5">API Key</p>
              <input
                readOnly
                value={apiKey}
                className="w-full font-mono text-xs text-[#4A4945] px-3 py-[9px] rounded-lg border border-[#E8E6DC] bg-[#FAF9F5] outline-none box-border"
              />
              <div className="flex gap-2 mt-2">
                <button className="px-[14px] py-[5px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">Copy</button>
                <button className="px-[14px] py-[5px] bg-[#FDECEA] border border-[#F5C6C2] rounded-[7px] text-xs font-medium text-[#C0392B] cursor-pointer">Regenerate</button>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <p className="text-xs font-medium text-[#4A4945] mb-1.5">Webhook URL</p>
              <div className="flex items-center gap-2">
                <input
                  placeholder="https://your-app.com/webhooks/solvexo"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  className="flex-1 px-3 py-[9px] text-[13px] border border-[#E8E6DC] rounded-lg bg-white text-[#2C2A28] outline-none"
                />
                <button className="px-4 py-[9px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer shrink-0">
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Events */}
          <div>
            <p className="text-xs font-medium text-[#4A4945] mb-[10px]">Active Webhook Events</p>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map(event => (
                <span key={event} className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E3F4EA] rounded-[20px] text-[11px] font-medium text-[#1E7A3C]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2D8A4E] shrink-0" />
                  {event}
                </span>
              ))}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
