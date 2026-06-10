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

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px solid #E8E6DC', borderRadius: 8, padding: '0 12px', background: '#fff' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              placeholder="Search apps..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', fontSize: 13, padding: '8px 0', width: 200, fontFamily: poppins, color: '#2C2A28', background: 'transparent' }}
            />
          </div>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{m.value}</p>
              <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>
            </div>
          ))}
        </div>

        {/* ── Tab Pills ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setActiveTab('connected')}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: 'none', fontFamily: poppins, transition: 'all 0.12s',
              display: 'flex', alignItems: 'center', gap: 5,
              background: activeTab === 'connected' ? '#141413' : '#fff',
              color:      activeTab === 'connected' ? '#fff'    : '#4A4945',
              boxShadow:  activeTab !== 'connected' ? '0 0 0 1px #E8E6DC' : 'none',
            }}
          >
            <Check size={13} /> Connected (6)
          </button>
          <button
            onClick={() => setActiveTab('available')}
            style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', border: 'none', fontFamily: poppins, transition: 'all 0.12s',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {filteredApps.map(app => (
              <div key={app.id} style={{ ...cardStyle, padding: '20px 22px', position: 'relative' }}>
                {/* Connected badge */}
                <div style={{ position: 'absolute', top: 16, right: 16 }}>
                  <span style={{ padding: '3px 9px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#E3F4EA', color: '#1E7A3C', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Check size={10} /> Connected
                  </span>
                </div>

                {/* Icon */}
                <div style={{ width: 46, height: 46, borderRadius: 10, background: app.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, flexShrink: 0 }}>
                  <app.Icon size={22} style={{ color: '#6B7280' }} />
                </div>

                <p style={{ fontSize: 16, fontWeight: 700, color: '#141413', marginBottom: 4, paddingRight: 80 }}>{app.name}</p>
                <p style={{ fontSize: 13, color: '#8C8A82', marginBottom: 16, lineHeight: 1.5 }}>{app.desc}</p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button style={{ padding: '5px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                    Configure
                  </button>
                  <button style={{ padding: '5px 14px', background: '#FDECEA', border: '1px solid #F5C6C2', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#C0392B', cursor: 'pointer', fontFamily: poppins }}>
                    Disconnect
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'available' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0', color: '#8C8A82', fontSize: 14, fontFamily: poppins }}>
            Browse 50+ available apps in the marketplace.
          </div>
        )}

        {/* ── Developer Tools ── */}
        <div style={{ ...cardStyle, padding: '20px 22px', marginTop: 4 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#141413', marginBottom: 20 }}>Developer Tools — API &amp; Webhooks</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
            {/* API Key */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 6, fontFamily: poppins }}>API Key</p>
              <input
                readOnly
                value={apiKey}
                style={{
                  width: '100%', fontFamily: 'monospace', fontSize: 12, color: '#4A4945',
                  padding: '9px 12px', borderRadius: 8, border: '1px solid #E8E6DC',
                  background: '#FAF9F5', outline: 'none', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <button style={{ padding: '5px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>Copy</button>
                <button style={{ padding: '5px 14px', background: '#FDECEA', border: '1px solid #F5C6C2', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#C0392B', cursor: 'pointer', fontFamily: poppins }}>Regenerate</button>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 6, fontFamily: poppins }}>Webhook URL</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  placeholder="https://your-app.com/webhooks/solvexo"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  style={{ flex: 1, padding: '9px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', fontFamily: poppins }}
                />
                <button style={{ padding: '9px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins, flexShrink: 0 }}>
                  Save
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Events */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', marginBottom: 10, fontFamily: poppins }}>Active Webhook Events</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {WEBHOOK_EVENTS.map(event => (
                <span key={event} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 12px', background: '#E3F4EA', borderRadius: 20,
                  fontSize: 11, fontWeight: 500, color: '#1E7A3C', fontFamily: poppins,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2D8A4E', flexShrink: 0 }} />
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