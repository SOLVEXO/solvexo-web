import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { MetricCard } from '@/components/ui/MetricCard';

// ── Data ─────────────────────────────────────────────────────────────────────

type AppTab = 'connected' | 'available';

interface AppDef {
  id: string;
  icon: string;
  iconBg: string;
  name: string;
  desc: string;
}

const CONNECTED_APPS: AppDef[] = [
  {
    id: 'stripe',
    icon: '💳',
    iconBg: 'bg-[#EEF2FF]',
    name: 'Stripe',
    desc: 'Accept credit cards, Apple Pay, Google Pay.',
  },
  {
    id: 'paypal',
    icon: 'P',
    iconBg: 'bg-[#E8F4FD]',
    name: 'PayPal',
    desc: 'PayPal checkout and payout.',
  },
  {
    id: 'google-analytics',
    icon: '📊',
    iconBg: 'bg-[#FFF8E1]',
    name: 'Google Analytics',
    desc: 'Track store traffic and conversions.',
  },
  {
    id: 'mailchimp',
    icon: '📧',
    iconBg: 'bg-[#FFF3E0]',
    name: 'Mailchimp',
    desc: 'Sync customers and send email campaigns.',
  },
  {
    id: 'shippo',
    icon: '📦',
    iconBg: 'bg-[#E8F5E9]',
    name: 'Shippo',
    desc: 'Discounted shipping labels and tracking.',
  },
  {
    id: 'zapier',
    icon: '⚡',
    iconBg: 'bg-[#FFF3E0]',
    name: 'Zapier',
    desc: 'Connect Solvexo to 5,000+ apps.',
  },
];

const WEBHOOK_EVENTS = [
  'order.created',
  'order.paid',
  'order.fulfilled',
  'product.updated',
  'refund.issued',
  'review.posted',
];

// ── Component ─────────────────────────────────────────────────────────────────

export function SellerIntegrations() {
  usePageTitle('Integrations');
  const [activeTab, setActiveTab] = useState<AppTab>('connected');
  const [searchQuery, setSearchQuery] = useState('');
  const [apiKey] = useState('sk_live_••••••••••••••••••••••••4821');
  const [webhookUrl, setWebhookUrl] = useState('');

  const filteredApps = CONNECTED_APPS.filter(app =>
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.desc.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <>
      <SellerPageHeader
        title="Apps & Integrations"
        subtitle="Connect your favorite tools and extend Solvexo's power."
        actions={
          <Input
            placeholder="Search apps..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="max-w-[240px]"
          />
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="flex gap-4">
          <MetricCard label="Connected Apps" value="6" sub="Active integrations" />
          <MetricCard label="Last Sync" value="2:14 PM" sub="All apps synced today" />
          <MetricCard label="Available Apps" value="50+" sub="In app marketplace" />
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-2 mt-5 mb-5">
          <button
            onClick={() => setActiveTab('connected')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              activeTab === 'connected'
                ? 'bg-carbon text-white'
                : 'border border-bone text-charcoal hover:bg-cream'
            }`}
          >
            ✓ Connected (6)
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-medium transition-colors cursor-pointer ${
              activeTab === 'available'
                ? 'bg-carbon text-white'
                : 'border border-bone text-charcoal hover:bg-cream'
            }`}
          >
            Available (6)
          </button>
        </div>

        {/* Connected Apps Grid */}
        {activeTab === 'connected' && (
          <div className="grid grid-cols-3 gap-5">
            {filteredApps.map(app => (
              <Card key={app.id} padding="md" className="relative">
                {/* Connected badge */}
                <div className="absolute top-4 right-4">
                  <Badge color="green">✓ Connected</Badge>
                </div>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center text-[22px] mb-3 flex-shrink-0 ${app.iconBg}`}
                >
                  {app.icon}
                </div>

                {/* Name + desc */}
                <p className="text-[16px] font-bold text-carbon mb-1 pr-20">{app.name}</p>
                <p className="text-[13px] text-slate mb-4">{app.desc}</p>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">Configure</Button>
                  <Button variant="danger" size="sm">Disconnect</Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {activeTab === 'available' && (
          <div className="flex items-center justify-center py-16 text-slate text-[14px]">
            Browse 50+ available apps in the marketplace.
          </div>
        )}

        {/* Developer Tools */}
        <div className="mt-6 p-5 border border-bone rounded-xl bg-white">
          <p className="text-[15px] font-bold text-carbon mb-4">Developer Tools — API &amp; Webhooks</p>

          <div className="grid grid-cols-2 gap-5">
            {/* API Key */}
            <div>
              <p className="text-[12px] font-medium text-charcoal mb-2">API Key</p>
              <input
                readOnly
                value={apiKey}
                className="w-full font-mono text-[12px] text-charcoal px-3 py-2.5 rounded-lg border border-bone bg-cream outline-none select-all"
              />
              <div className="flex items-center gap-2 mt-2">
                <Button variant="ghost" size="sm">Copy</Button>
                <Button variant="danger" size="sm">Regenerate</Button>
              </div>
            </div>

            {/* Webhook URL */}
            <div>
              <p className="text-[12px] font-medium text-charcoal mb-2">Webhook URL</p>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="https://your-app.com/webhooks/solvexo"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                />
                <Button variant="primary" size="sm" className="flex-shrink-0 ml-2">Save</Button>
              </div>
            </div>
          </div>

          {/* Active Webhook Events */}
          <div className="mt-4">
            <p className="text-[12px] font-medium text-charcoal mb-2">Active Webhook Events</p>
            <div className="flex flex-wrap gap-2">
              {WEBHOOK_EVENTS.map(event => (
                <span
                  key={event}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-success-bg text-success text-[11px] rounded-full font-medium"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block" />
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
