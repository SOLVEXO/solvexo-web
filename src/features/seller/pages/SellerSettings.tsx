import { useState } from 'react';
import {
  User, KeyRound, ShieldCheck, Bell,
  Store, Search, CreditCard, Package, Receipt,
  Users, Lock,
  DollarSign, ArrowDownToLine, FileText,
  Trash2, Camera, Settings,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input, Textarea, Select } from '@/components/ui/Input';
import { Divider } from '@/components/ui/Divider';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

type SettingSection =
  | 'profile' | 'email-password' | 'two-factor' | 'notifications'
  | 'store-info' | 'domain-seo' | 'payment-methods' | 'shipping' | 'tax'
  | 'staff' | 'permissions'
  | 'plan-billing' | 'payouts' | 'invoices'
  | 'delete-account';

const SETTINGS_NAV: { group: string; items: { id: SettingSection; label: string; Icon: LucideIcon }[] }[] = [
  {
    group: 'Account',
    items: [
      { id: 'profile',          label: 'Profile',           Icon: User          },
      { id: 'email-password',   label: 'Email & Password',  Icon: KeyRound      },
      { id: 'two-factor',       label: 'Two-Factor Auth',   Icon: ShieldCheck   },
      { id: 'notifications',    label: 'Notifications',     Icon: Bell          },
    ],
  },
  {
    group: 'Store',
    items: [
      { id: 'store-info',       label: 'Store Info',        Icon: Store         },
      { id: 'domain-seo',       label: 'Domain & SEO',      Icon: Search        },
      { id: 'payment-methods',  label: 'Payment Methods',   Icon: CreditCard    },
      { id: 'shipping',         label: 'Shipping',          Icon: Package       },
      { id: 'tax',              label: 'Tax Settings',      Icon: Receipt       },
    ],
  },
  {
    group: 'Team',
    items: [
      { id: 'staff',            label: 'Staff Members',     Icon: Users         },
      { id: 'permissions',      label: 'Permissions',       Icon: Lock          },
    ],
  },
  {
    group: 'Billing',
    items: [
      { id: 'plan-billing',     label: 'Plan & Billing',    Icon: DollarSign    },
      { id: 'payouts',          label: 'Payouts',           Icon: ArrowDownToLine },
      { id: 'invoices',         label: 'Invoices',          Icon: FileText      },
    ],
  },
  {
    group: 'Danger Zone',
    items: [
      { id: 'delete-account',   label: 'Delete Account',    Icon: Trash2        },
    ],
  },
];

export function SellerSettings() {
  const [active, setActive] = useState<SettingSection>('profile');
  const [firstName, setFirstName] = useState('Alex');
  const [lastName,  setLastName]  = useState('Chen');
  const [phone,     setPhone]     = useState('+1 (555) 234-5678');
  const [bio,       setBio]       = useState('Passionate educator and digital creator. Selling high-quality math resources for K–8 students.');

  return (
    <>
      <SellerPageHeader
        title="Settings"
        subtitle="Manage your account and store preferences."
      />

      <div className="p-7">
        <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 280px' }}>
          {/* LEFT: main content */}
          <div>
            {/* Main content */}
            {active === 'profile' && (
              <Card>
                <p className="text-[16px] font-bold text-carbon mb-5">Profile</p>

                {/* Photo upload */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="relative">
                    <div
                      className="rounded-full flex items-center justify-center text-[28px] font-bold flex-shrink-0"
                      style={{ width: 80, height: 80, background: '#FBECE4', color: '#B95A3A' }}
                    >
                      AC
                    </div>
                    <button
                      className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center text-white cursor-pointer"
                      style={{ background: '#D97757' }}
                    >
                      <Camera size={12} />
                    </button>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-carbon">Profile Photo</p>
                    <p className="text-[12px] text-slate mb-2">JPG, PNG — max 2 MB</p>
                    <Button variant="ghost" size="sm">Upload Photo</Button>
                  </div>
                </div>

                <Divider my={4} />

                {/* Name */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Input
                    label="First Name"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                  />
                  <Input
                    label="Last Name"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                  />
                </div>

                {/* Email */}
                <div className="mb-4">
                  <label className="block text-[12px] font-medium text-charcoal mb-1.5">Email</label>
                  <div className="flex items-center gap-2">
                    <input
                      readOnly
                      defaultValue="alex@myshop.com"
                      className="flex-1 text-[13px] text-charcoal px-3 py-2.5 rounded-lg border border-bone bg-cream outline-none"
                    />
                    <Badge color="green">✓ Verified</Badge>
                  </div>
                </div>

                {/* Phone */}
                <div className="mb-4">
                  <Input
                    label="Phone Number"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                {/* Country */}
                <div className="mb-4">
                  <Select label="Country">
                    <option>United States</option>
                    <option>United Kingdom</option>
                    <option>Canada</option>
                    <option>Australia</option>
                    <option>South Africa</option>
                    <option>Nigeria</option>
                    <option>Kenya</option>
                  </Select>
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <Textarea
                    label="Bio"
                    rows={3}
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    placeholder="Tell buyers about yourself…"
                  />
                </div>

                <Button variant="primary" size="md">Save Changes</Button>
              </Card>
            )}

            {active !== 'profile' && (
              <Card>
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-3" style={{ color: '#8C8A82' }}>
                    {(() => { const found = SETTINGS_NAV.flatMap(g => g.items).find(i => i.id === active); return found ? <found.Icon size={40} /> : <Settings size={40} />; })()}
                  </div>
                  <p className="text-[15px] font-semibold text-carbon mb-1">
                    {SETTINGS_NAV.flatMap(g => g.items).find(i => i.id === active)?.label ?? 'Settings'}
                  </p>
                  <p className="text-[13px] text-slate">
                    {active === 'delete-account'
                      ? 'Permanently delete your account and all data.'
                      : 'Settings for this section are coming soon.'}
                  </p>
                  {active === 'delete-account' && (
                    <Button variant="danger" size="sm" className="mt-4">Delete My Account</Button>
                  )}
                </div>
              </Card>
            )}
          </div>

          {/* RIGHT: sidebar nav */}
          <div>
            <Card padding="none" className="sticky top-[70px]">
              {SETTINGS_NAV.map((group, gi) => (
                <div key={group.group}>
                  {gi > 0 && <div className="h-px bg-bone" />}
                  <div className="px-4 py-2 pt-3">
                    <p className="text-[10px] font-semibold text-slate uppercase tracking-wider">{group.group}</p>
                  </div>
                  {group.items.map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer border-l-2"
                      style={{
                        borderLeftColor: active === item.id ? '#D97757' : 'transparent',
                        background:      active === item.id ? '#FBECE4' : 'transparent',
                        color:           active === item.id ? '#B95A3A' : '#2C2A28',
                      }}
                    >
                      <item.Icon size={14} />
                      <span
                        className="text-[13px]"
                        style={{ fontWeight: active === item.id ? 600 : 400 }}
                      >
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              ))}
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
