import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { MetricCard } from '@/components/ui/MetricCard';
import { Input, Select } from '@/components/ui/Input';

interface User {
  id:     string;
  name:   string;
  email:  string;
  role:   'Seller' | 'Buyer' | 'Admin';
  plan:   string;
  status: 'Active' | 'Suspended' | 'Pending';
  joined: string;
}

const USERS: User[] = [
  { id: 'U-1001', name: 'Alex Chen',        email: 'alex@myshop.com',       role: 'Seller', plan: 'Professional', status: 'Active',    joined: 'Jan 2024' },
  { id: 'U-1002', name: 'Sarah Mitchell',   email: 'sarah@email.com',       role: 'Buyer',  plan: 'Free',         status: 'Active',    joined: 'Mar 2024' },
  { id: 'U-1003', name: 'DesignHub Studio', email: 'designhub@gmail.com',   role: 'Seller', plan: 'Starter',      status: 'Active',    joined: 'Feb 2024' },
  { id: 'U-1004', name: 'FastDigital99',    email: 'fastdigital@yahoo.com', role: 'Seller', plan: 'Starter',      status: 'Suspended', joined: 'Nov 2023' },
  { id: 'U-1005', name: 'BeatFactory',      email: 'beats@mail.com',        role: 'Seller', plan: 'Professional', status: 'Active',    joined: 'Jun 2024' },
  { id: 'U-1006', name: 'Tom Barnes',       email: 'tom.b@outlook.com',     role: 'Buyer',  plan: 'Free',         status: 'Active',    joined: 'Nov 2023' },
  { id: 'U-1007', name: 'QuickSell Store',  email: 'quicksell@store.com',   role: 'Seller', plan: 'Starter',      status: 'Pending',   joined: 'May 2025' },
  { id: 'U-1008', name: 'Priya Sharma',     email: 'priya@edu.in',          role: 'Seller', plan: 'Professional', status: 'Active',    joined: 'Apr 2025' },
];

const ROLE_COLORS: Record<string, 'orange' | 'blue' | 'red'> = {
  Seller: 'orange',
  Buyer:  'blue',
  Admin:  'red',
};

const STATUS_COLORS: Record<string, 'green' | 'red' | 'yellow'> = {
  Active:    'green',
  Suspended: 'red',
  Pending:   'yellow',
};

export function AdminUsers() {
  usePageTitle('Users');
  const [search, setSearch]     = useState('');
  const [roleFilter, setRole]   = useState('');
  const [statusFilter, setStatusF] = useState('');

  const filtered = USERS.filter(u => {
    const q = search.toLowerCase();
    if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    if (roleFilter   && u.role   !== roleFilter)   return false;
    if (statusFilter && u.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className="p-7 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-[18px] font-bold text-carbon">Users & Sellers</h1>
        <p className="text-[12px] text-slate mt-0.5">Manage all platform users, sellers and accounts.</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Total Users"    value="48,294" trend="+1.2K this week" trendUp />
        <MetricCard label="Active Sellers" value="12,481" trend="+284 this month" trendUp />
        <MetricCard label="Suspended"      value="127"    sub="Under review" />
      </div>

      {/* Table */}
      <Card padding="none">
        {/* Filters */}
        <div className="px-5 py-4 flex items-end gap-3 border-b border-bone">
          <div style={{ maxWidth: 260 }} className="flex-1">
            <Input placeholder="Search by name or email…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="w-[140px]">
            <Select value={roleFilter} onChange={e => setRole(e.target.value)}>
              <option value="">All Roles</option>
              <option>Seller</option>
              <option>Buyer</option>
              <option>Admin</option>
            </Select>
          </div>
          <div className="w-[150px]">
            <Select value={statusFilter} onChange={e => setStatusF(e.target.value)}>
              <option value="">All Statuses</option>
              <option>Active</option>
              <option>Suspended</option>
              <option>Pending</option>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-bone">
                {['User', 'Email', 'Role', 'Plan', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate uppercase tracking-wider px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <tr key={u.id} className={`hover:bg-cream/50 transition-colors ${i < filtered.length - 1 ? 'border-b border-bone' : ''}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <Avatar name={u.name} size={28} />
                      <div>
                        <p className="font-semibold text-carbon text-[12px]">{u.name}</p>
                        <p className="text-[11px] text-slate">{u.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-charcoal">{u.email}</td>
                  <td className="px-5 py-3.5"><Badge color={ROLE_COLORS[u.role]}>{u.role}</Badge></td>
                  <td className="px-5 py-3.5 text-charcoal">{u.plan}</td>
                  <td className="px-5 py-3.5"><Badge color={STATUS_COLORS[u.status]}>{u.status}</Badge></td>
                  <td className="px-5 py-3.5 text-slate">{u.joined}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <button className="text-[12px] font-medium cursor-pointer hover:underline" style={{ color: '#1A72C2' }}>View</button>
                      <span className="text-bone">|</span>
                      <button className="text-[12px] font-medium cursor-pointer hover:underline" style={{ color: '#C13030' }}>
                        {u.status === 'Suspended' ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
