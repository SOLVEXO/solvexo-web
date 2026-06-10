import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { MapPin, Truck, Tag, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
const TABS: { id: string; Icon: LucideIcon; label: string }[] = [
  { id: 'zones',    Icon: MapPin, label: 'Zones'              },
  { id: 'carriers', Icon: Truck,  label: 'Carriers'           },
  { id: 'labels',   Icon: Tag,    label: 'Labels & Tracking'  },
  { id: 'local',    Icon: Home,   label: 'Local Delivery'     },
];

const ZONES = [
  {
    name: 'United States (Domestic)', coverage: 'All 50 states • USPS, UPS, FedEx',
    services: [
      { name: 'Standard',  days: '5–7 days', price: '$4.99'  },
      { name: 'Expedited', days: '2–3 days', price: '$12.99' },
      { name: 'Overnight', days: '1 day',    price: '$24.99' },
    ],
  },
  {
    name: 'Canada', coverage: 'All provinces • Canada Post, UPS',
    services: [
      { name: 'Standard',  days: '7–14 days', price: '$9.99'  },
      { name: 'Expedited', days: '3–5 days',  price: '$18.99' },
    ],
  },
  {
    name: 'Europe', coverage: 'EU + UK • DHL, Royal Mail',
    services: [
      { name: 'Standard',  days: '10–21 days', price: '$14.99' },
    ],
  },
  {
    name: 'Rest of World', coverage: 'All other countries • DHL, USPS Priority Mail Intl.',
    services: [
      { name: 'Standard',  days: '14–30 days', price: '$19.99' },
    ],
  },
];

const metrics = [
  { label: 'Active Zones',      value: '4',     trend: null,                 sub: 'Domestic + International', trendUp: false },
  { label: 'Labels Printed',    value: '142',   trend: 'This month',         sub: null,                       trendUp: true  },
  { label: 'Avg Shipping Cost', value: '$6.40', trend: '-$0.80 vs last month', sub: null,                     trendUp: true  },
  { label: 'On-Time Delivery',  value: '96%',   trend: 'Excellent',          sub: null,                       trendUp: true  },
] as const;

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerShipping() {
  usePageTitle('Shipping');
  const [activeTab, setActiveTab] = useState('zones');

  return (
    <>
      <SellerPageHeader
        title="Shipping"
        subtitle="Configure zones, carriers, labels, and delivery options."
        actions={
          <button style={{ padding: '7px 16px', background: '#D97757', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: poppins }}>
            + Add Shipping Zone
          </button>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Metrics ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {metrics.map(m => (
            <div key={m.label} style={{ ...cardStyle, padding: '16px 20px' }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#8C8A82', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{m.label}</p>
              <p style={{ fontSize: 28, fontWeight: 700, color: '#141413', lineHeight: 1.15 }}>{m.value}</p>
              {m.trend && <p style={{ fontSize: 12, color: '#2D8A4E', marginTop: 4 }}>▲ {m.trend}</p>}
              {m.sub   && <p style={{ fontSize: 12, color: '#8C8A82', marginTop: 4 }}>{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div style={{ borderBottom: '1px solid #E8E6DC' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '10px 16px', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 500,
                  cursor: 'pointer', border: 'none', fontFamily: poppins,
                  background: 'transparent', transition: 'all 0.12s', marginBottom: -1,
                  borderBottom: `2px solid ${activeTab === tab.id ? '#D97757' : 'transparent'}`,
                  color: activeTab === tab.id ? '#B95A3A' : '#8C8A82',
                }}
              >
                <tab.Icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Zones Tab ── */}
        {activeTab === 'zones' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {ZONES.map(zone => (
              <div key={zone.name} style={{ ...cardStyle, padding: '18px 22px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#141413', marginBottom: 3 }}>{zone.name}</p>
                    <p style={{ fontSize: 12, color: '#8C8A82' }}>{zone.coverage}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <button style={{ padding: '5px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                      Edit
                    </button>
                    <span style={{ padding: '3px 10px', borderRadius: 5, fontSize: 11, fontWeight: 600, background: '#E3F4EA', color: '#1E7A3C', fontFamily: poppins }}>
                      Active
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                  {zone.services.map(svc => (
                    <div
                      key={svc.name}
                      style={{
                        display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start',
                        padding: '10px 14px', border: '1px solid #E8E6DC', borderRadius: 9,
                        background: '#FAF9F5', cursor: 'pointer', transition: 'border-color 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#D97757')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#E8E6DC')}
                    >
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#4A4945', lineHeight: 1.3, fontFamily: poppins }}>{svc.name}</span>
                      <span style={{ fontSize: 11, color: '#8C8A82', marginBottom: 5, fontFamily: poppins }}>{svc.days}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#D97757', fontFamily: poppins }}>{svc.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Placeholder Tabs ── */}
        {activeTab !== 'zones' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 180, ...cardStyle }}>
            <p style={{ fontSize: 13, color: '#8C8A82', fontFamily: poppins }}>
              {TABS.find(t => t.id === activeTab)?.label} — coming soon
            </p>
          </div>
        )}

      </div>
    </>
  );
}