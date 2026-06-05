import { useState } from 'react';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { MetricCard } from '@/components/ui/MetricCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type FilterCategory =
  | 'all'
  | 'products'
  | 'orders'
  | 'finance'
  | 'marketing'
  | 'customers'
  | 'settings'
  | 'security';

type TeamMember = 'all' | 'alex' | 'jordan' | 'sam';

interface ActivityItem {
  id: number;
  user: string;
  role: 'Owner' | 'Manager' | 'Staff';
  category: string;
  timestamp: string;
  title: string;
  detail: string;
  ip: string;
  isSecurity?: boolean;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const FILTER_CATEGORIES: { id: FilterCategory; label: string; count?: number }[] = [
  { id: 'all',       label: 'All Events'   },
  { id: 'products',  label: 'Products',   count: 1 },
  { id: 'orders',    label: 'Orders',     count: 2 },
  { id: 'finance',   label: 'Finance',    count: 2 },
  { id: 'marketing', label: 'Marketing',  count: 1 },
  { id: 'customers', label: 'Customers',  count: 1 },
  { id: 'settings',  label: 'Settings',   count: 1 },
  { id: 'security',  label: 'Security',   count: 1 },
];

const ACTIVITY_LOG: ActivityItem[] = [
  {
    id: 1,
    user: 'Alex Chen',
    role: 'Owner',
    category: 'Product',
    timestamp: '2 min ago',
    title: 'Updated product price',
    detail: 'Grade 5 Math Bundle: $44.00 → $49.00',
    ip: '192.168.1.1',
  },
  {
    id: 2,
    user: 'Jordan Lee',
    role: 'Manager',
    category: 'Order',
    timestamp: '18 min ago',
    title: 'Fulfilled order',
    detail: 'Order #8821 — Sarah Mitchell — Shipped via USPS',
    ip: '10.0.0.4',
  },
  {
    id: 3,
    user: 'Alex Chen',
    role: 'Owner',
    category: 'Marketing',
    timestamp: '1h ago',
    title: 'Created coupon',
    detail: 'BACK2SCHOOL — 20% off — expires Jun 30',
    ip: '192.168.1.1',
  },
  {
    id: 4,
    user: 'Sam Rivera',
    role: 'Staff',
    category: 'POS',
    timestamp: '2h ago',
    title: 'Processed POS sale',
    detail: 'Ceramic Mug Set × 2 — $56.00 — Cash',
    ip: '10.0.0.7',
  },
  {
    id: 5,
    user: 'Jordan Lee',
    role: 'Manager',
    category: 'Customer',
    timestamp: '3h ago',
    title: 'Edited customer profile',
    detail: 'David Reynolds — Updated email address',
    ip: '10.0.0.4',
  },
  {
    id: 6,
    user: 'Alex Chen',
    role: 'Owner',
    category: 'Finance',
    timestamp: 'Yesterday 4:12 PM',
    title: 'Changed payout schedule',
    detail: 'Weekly → Bi-weekly payout schedule',
    ip: '192.168.1.1',
  },
  {
    id: 7,
    user: 'Alex Chen',
    role: 'Owner',
    category: 'Settings',
    timestamp: 'Yesterday 2:44 PM',
    title: 'Added team member',
    detail: 'Taylor Kim — Staff role — Products, Inventory access',
    ip: '192.168.1.1',
  },
  {
    id: 8,
    user: 'Sam Rivera',
    role: 'Staff',
    category: 'Order',
    timestamp: 'May 18 11:22 AM',
    title: 'Applied discount',
    detail: 'Order #8818 — 10% manual discount applied',
    ip: '10.0.0.7',
  },
  {
    id: 9,
    user: 'Jordan Lee',
    role: 'Manager',
    category: 'Finance',
    timestamp: 'May 18 10:14 AM',
    title: 'Issued refund',
    detail: 'RMA-039 — Mike Svensson — $24.00 refunded',
    ip: '10.0.0.4',
  },
  {
    id: 10,
    user: 'Alex Chen',
    role: 'Owner',
    category: 'Security',
    timestamp: 'May 17 9:00 AM',
    title: 'Login from new device',
    detail: 'Safari on iPhone — New York, US',
    ip: '76.24.1.82',
    isSecurity: true,
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRoleBadgeColor(role: ActivityItem['role']): string {
  if (role === 'Owner')   return 'bg-brand-pale-orange text-brand-deep-orange';
  if (role === 'Manager') return 'bg-info-bg text-info';
  return 'bg-bone text-slate';
}

function getCategoryBadgeColor(category: string): string {
  const map: Record<string, string> = {
    Product:  'bg-[#EEF2FF] text-[#4F46E5]',
    Order:    'bg-info-bg text-info',
    Marketing:'bg-warning-bg text-warning',
    POS:      'bg-[#F3E8FF] text-[#7C3AED]',
    Customer: 'bg-success-bg text-success',
    Finance:  'bg-[#FFF3E0] text-[#D97706]',
    Settings: 'bg-bone text-slate',
    Security: 'bg-error-bg text-error',
  };
  return map[category] ?? 'bg-bone text-slate';
}

// ── Sub-components ────────────────────────────────────────────────────────────

function RolePill({ role }: { role: ActivityItem['role'] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getRoleBadgeColor(role)}`}>
      {role}
    </span>
  );
}

function CategoryPill({ category, isAlert }: { category: string; isAlert?: boolean }) {
  if (isAlert) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-error-bg text-error">
        Security Alert
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${getCategoryBadgeColor(category)}`}>
      {category}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function SellerActivity() {
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('all');
  const [activeMember, setActiveMember] = useState<TeamMember>('all');
  const [dateRange, setDateRange] = useState('last7');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = 284;

  return (
    <>
      <SellerPageHeader
        title="Activity Log"
        subtitle="Full audit trail of all staff actions, changes, and security events."
        actions={
          <>
            <Button variant="ghost" size="sm">Export Log</Button>
            <Button variant="ghost" size="sm">Security Settings</Button>
          </>
        }
      />

      <div className="p-7 flex flex-col gap-6">
        {/* Metric Cards */}
        <div className="flex gap-4">
          <MetricCard label="Total Events"        value="2,841" sub="Last 90 days" />
          <MetricCard label="Staff Actions Today" value="14"    sub="3 team members active" />
          <MetricCard label="Security Alerts"     value="0"     trend="No threats" trendUp />
          <MetricCard label="Last Login"          value="2 min ago" sub="Alex Chen — Chrome" />
        </div>

        {/* 2-col layout */}
        <div className="grid gap-5" style={{ gridTemplateColumns: '260px 1fr' }}>

          {/* LEFT — Sidebar filters */}
          <Card padding="none">
            {/* Filter by Type */}
            <div className="p-4 border-b border-bone">
              <p className="text-[13px] font-semibold text-carbon">Filter by Type</p>
            </div>
            {FILTER_CATEGORIES.map(cat => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`w-full flex items-center justify-between px-4 py-3 border-b border-bone cursor-pointer transition-colors text-left ${
                    isActive
                      ? 'bg-brand-pale-orange border-l-2 border-l-brand-orange text-brand-deep-orange font-semibold'
                      : 'hover:bg-cream text-charcoal'
                  }`}
                >
                  <span className="text-[13px]">{cat.label}</span>
                  {cat.count != null && (
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-bone text-[11px] font-semibold text-slate">
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Filter by Team Member */}
            <div className="p-4 border-b border-bone">
              <p className="text-[12px] font-semibold text-charcoal mb-3">Filter by Team Member</p>
              {[
                { id: 'all' as TeamMember, label: 'All Members' },
                { id: 'alex' as TeamMember, label: 'Alex Chen', sub: 'Owner' },
                { id: 'jordan' as TeamMember, label: 'Jordan Lee', sub: 'Manager' },
                { id: 'sam' as TeamMember, label: 'Sam Rivera', sub: 'Staff' },
              ].map(m => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 mb-2 cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={() => setActiveMember(m.id)}
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      activeMember === m.id
                        ? 'border-brand-orange bg-brand-orange'
                        : 'border-bone bg-white'
                    }`}
                  >
                    {activeMember === m.id && (
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                  <span className="text-[13px] text-charcoal">
                    {m.label}
                    {m.sub && <span className="text-slate text-[11px] ml-1">({m.sub})</span>}
                  </span>
                </label>
              ))}
            </div>

            {/* Date Range */}
            <div className="p-4">
              <p className="text-[12px] font-semibold text-charcoal mb-2">Date Range</p>
              <Select
                value={dateRange}
                onChange={e => setDateRange(e.target.value)}
              >
                <option value="last7">Last 7 days</option>
                <option value="last30">Last 30 days</option>
                <option value="last90">Last 90 days</option>
                <option value="custom">Custom range</option>
              </Select>
              <Button variant="ghost" size="sm" fullWidth className="mt-3">
                Apply Filter
              </Button>
            </div>
          </Card>

          {/* RIGHT — Activity feed */}
          <Card padding="none" className="overflow-hidden">
            {/* Filter row */}
            <div className="p-4 border-b border-bone flex items-center gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Search activity..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="w-[160px]">
                <Select
                  value={actionFilter}
                  onChange={e => setActionFilter(e.target.value)}
                >
                  <option value="all">All Actions</option>
                  <option value="products">Products</option>
                  <option value="orders">Orders</option>
                  <option value="finance">Finance</option>
                  <option value="security">Security</option>
                </Select>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-success" />
                <span className="text-[11px] text-success font-medium">Live</span>
              </div>
            </div>

            {/* Activity items */}
            {ACTIVITY_LOG.map(item => (
              <div key={item.id} className="p-4 border-b border-bone last:border-b-0">
                {/* Row 1: avatar + meta */}
                <div className="flex items-center gap-2 mb-1">
                  <Avatar name={item.user} size={32} />
                  <span className="text-[13px] font-semibold text-carbon">{item.user}</span>
                  <RolePill role={item.role} />
                  <CategoryPill category={item.category} isAlert={item.isSecurity} />
                  <span className="ml-auto text-[11px] text-slate flex-shrink-0">{item.timestamp}</span>
                </div>

                {/* Row 2: action title */}
                <p className="text-[13px] font-semibold text-carbon pl-[44px] mb-0.5">
                  {item.title}
                </p>

                {/* Row 3: detail */}
                <p className="text-[12px] text-slate pl-[44px] mb-0.5">
                  {item.detail}
                </p>

                {/* Row 4: IP */}
                <p className="text-[11px] text-slate pl-[44px]">
                  IP: {item.ip}
                </p>
              </div>
            ))}

            {/* Pagination */}
            <div className="p-4 flex items-center justify-between border-t border-bone">
              <span className="text-[12px] text-slate">Showing 10 of 2,841 events</span>

              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-bone text-[13px] text-charcoal hover:bg-cream transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>

                {/* Page 1 */}
                <button
                  onClick={() => setCurrentPage(1)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                    currentPage === 1
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'border-bone text-charcoal hover:bg-cream'
                  }`}
                >
                  1
                </button>

                {/* Page 2 */}
                <button
                  onClick={() => setCurrentPage(2)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                    currentPage === 2
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'border-bone text-charcoal hover:bg-cream'
                  }`}
                >
                  2
                </button>

                {/* Page 3 */}
                <button
                  onClick={() => setCurrentPage(3)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                    currentPage === 3
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'border-bone text-charcoal hover:bg-cream'
                  }`}
                >
                  3
                </button>

                {/* Ellipsis */}
                <span className="w-8 h-8 flex items-center justify-center text-[13px] text-slate">
                  …
                </span>

                {/* Last page */}
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg border text-[13px] font-medium transition-colors cursor-pointer ${
                    currentPage === totalPages
                      ? 'bg-brand-orange text-white border-brand-orange'
                      : 'border-bone text-charcoal hover:bg-cream'
                  }`}
                >
                  284
                </button>

                {/* Next */}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="w-8 h-8 flex items-center justify-center rounded-lg border border-bone text-[13px] text-charcoal hover:bg-cream transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
