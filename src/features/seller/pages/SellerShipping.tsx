import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button }      from '@/components/ui/Button';
import { Badge }       from '@/components/ui/Badge';
import { MetricCard }  from '@/components/ui/MetricCard';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { MapPin, Truck, Tag, Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Types & Data ──────────────────────────────────────────────────────────────
type Tab = { id: string; Icon: LucideIcon; label: string };

const TABS: Tab[] = [
  { id: 'zones',    Icon: MapPin, label: 'Zones'               },
  { id: 'carriers', Icon: Truck,  label: 'Carriers'            },
  { id: 'labels',   Icon: Tag,    label: 'Labels & Tracking'  },
  { id: 'local',    Icon: Home,   label: 'Local Delivery'      },
];

type Service = { name: string; days: string; price: string };
type Zone    = { name: string; coverage: string; services: Service[] };

const ZONES: Zone[] = [
  {
    name: 'United States (Domestic)',
    coverage: 'All 50 states • USPS, UPS, FedEx',
    services: [
      { name: 'Standard',   days: '5–7 days',  price: '$4.99'  },
      { name: 'Expedited',  days: '2–3 days',  price: '$12.99' },
      { name: 'Overnight',  days: '1 day',     price: '$24.99' },
    ],
  },
  {
    name: 'Canada',
    coverage: 'All provinces • Canada Post, UPS',
    services: [
      { name: 'Standard',   days: '7–14 days', price: '$9.99'  },
      { name: 'Expedited',  days: '3–5 days',  price: '$18.99' },
    ],
  },
  {
    name: 'Europe',
    coverage: 'EU + UK • DHL, Royal Mail',
    services: [
      { name: 'Standard',   days: '10–21 days', price: '$14.99' },
    ],
  },
  {
    name: 'Rest of World',
    coverage: 'All other countries • DHL, USPS Priority Mail Intl.',
    services: [
      { name: 'Standard',   days: '14–30 days', price: '$19.99' },
    ],
  },
];

// ── Zones Tab ─────────────────────────────────────────────────────────────────
function ZonesTab() {
  return (
    <div className="flex flex-col gap-4">
      {ZONES.map(zone => (
        <div key={zone.name} className="p-5 border border-bone rounded-xl bg-white">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className="text-[14px] font-semibold text-carbon mb-0.5">{zone.name}</p>
              <p className="text-[12px] text-slate">{zone.coverage}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="sm">Edit</Button>
              <Badge color="green">Active</Badge>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {zone.services.map(svc => (
              <div
                key={svc.name}
                className="inline-flex flex-col items-start p-3 border border-bone rounded-lg bg-cream cursor-pointer hover:border-brand-orange transition-colors"
              >
                <span className="text-[12px] font-medium text-charcoal leading-tight">{svc.name}</span>
                <span className="text-[11px] text-slate mb-1">{svc.days}</span>
                <span className="text-[14px] font-bold text-brand-orange">{svc.price}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Placeholder Tabs ──────────────────────────────────────────────────────────
function PlaceholderTab({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-48 border border-bone rounded-xl bg-white">
      <p className="text-[13px] text-slate">{label} — coming soon</p>
    </div>
  );
}

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
          <Button variant="primary" size="sm">+ Add Shipping Zone</Button>
        }
      />

      <div className="p-7 flex flex-col gap-5">

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard label="Active Zones"      value="4"     sub="Domestic + International" />
          <MetricCard label="Labels Printed"    value="142"   trend="This month"          trendUp />
          <MetricCard label="Avg Shipping Cost" value="$6.40" trend="-$0.80 vs last month" trendUp />
          <MetricCard label="On-Time Delivery"  value="96%"   trend="Excellent"           trendUp />
        </div>

        {/* Tabs */}
        <div className="border-b border-bone">
          <div className="flex items-center gap-0">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={[
                  'flex items-center gap-1.5 px-4 py-3 text-[13px] cursor-pointer transition-colors',
                  'border-b-2 -mb-px',
                  activeTab === tab.id
                    ? 'border-brand-orange text-brand-deep-orange font-semibold'
                    : 'border-transparent text-slate hover:text-charcoal',
                ].join(' ')}
              >
                <tab.Icon size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-0">
          {activeTab === 'zones'    && <ZonesTab />}
          {activeTab === 'carriers' && <PlaceholderTab label="Carriers" />}
          {activeTab === 'labels'   && <PlaceholderTab label="Labels & Tracking" />}
          {activeTab === 'local'    && <PlaceholderTab label="Local Delivery" />}
        </div>

      </div>
    </>
  );
}
