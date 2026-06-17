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
          <button className="px-4 py-[7px] bg-brand-orange border-none rounded-lg text-xs font-semibold text-white cursor-pointer">
            + Add Shipping Zone
          </button>
        }
      />

      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* ── Metrics ── */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
              <p className="text-[11px] font-medium text-[#8C8A82] uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-[#141413] leading-[1.15]">{m.value}</p>
              {m.trend && <p className="text-xs text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
              {m.sub   && <p className="text-xs text-[#8C8A82] mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* ── Tab bar ── */}
        <div className="border-b border-[#E8E6DC]">
          <div className="flex items-center gap-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-[13px] cursor-pointer border-none bg-transparent transition-all duration-[120ms] -mb-px"
                style={{
                  fontWeight: activeTab === tab.id ? 600 : 500,
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
          <div className="flex flex-col gap-3.5">
            {ZONES.map(zone => (
              <div key={zone.name} className="bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-[22px] py-[18px]">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-[#141413] mb-[3px]">{zone.name}</p>
                    <p className="text-xs text-[#8C8A82]">{zone.coverage}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button className="px-3 py-[5px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">
                      Edit
                    </button>
                    <span className="px-2.5 py-[3px] rounded-[5px] text-[11px] font-semibold bg-[#E3F4EA] text-[#1E7A3C]">
                      Active
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {zone.services.map(svc => (
                    <div
                      key={svc.name}
                      className="inline-flex flex-col items-start px-3.5 py-2.5 border border-[#E8E6DC] rounded-[9px] bg-[#FAF9F5] cursor-pointer transition-[border-color] duration-[120ms]"
                      onMouseEnter={e => (e.currentTarget.style.borderColor = '#D97757')}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = '#E8E6DC')}
                    >
                      <span className="text-xs font-semibold text-[#4A4945] leading-[1.3]">{svc.name}</span>
                      <span className="text-[11px] text-[#8C8A82] mb-[5px]">{svc.days}</span>
                      <span className="text-sm font-bold text-brand-orange">{svc.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Placeholder Tabs ── */}
        {activeTab !== 'zones' && (
          <div className="flex items-center justify-center h-[180px] bg-white border border-[#E8E6DC] rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] text-[#8C8A82]">
              {TABS.find(t => t.id === activeTab)?.label} — coming soon
            </p>
          </div>
        )}

      </div>
    </>
  );
}
