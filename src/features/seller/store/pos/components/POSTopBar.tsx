import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { ShoppingCart, ClipboardList, Package, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/comman/ui/Avatar';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import type { ActiveTab } from '../pos.types';

const TAB_ICONS: Record<ActiveTab, LucideIcon> = {
  sale:     ShoppingCart,
  orders:   ClipboardList,
  products: Package,
  summary:  BarChart2,
};

const TABS: ActiveTab[] = ['sale', 'orders', 'products', 'summary'];

interface POSTopBarProps {
  activeTab:    ActiveTab;
  setActiveTab: (t: ActiveTab) => void;
}

export function POSTopBar({ activeTab, setActiveTab }: POSTopBarProps) {
  const navigate = useNavigate();

  return (
    <div className="shrink-0 flex items-center gap-4 px-5 h-[52px] bg-pos-surface border-b border-carbon">
      {/* Logo */}
      <div className="flex items-center gap-[10px] shrink-0">
        <SolvexoIcon size={26} />
        <span className="text-[13px] font-bold text-white">POS Register</span>
        <div className="bg-carbon rounded-[6px] px-2 py-[2px]">
          <span className="text-[10px] text-brand-orange">● Live</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-[2px] bg-carbon rounded-lg p-[3px]">
        {TABS.map(tab => {
          const Icon = TAB_ICONS[tab];
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={clsx(
                'px-[14px] py-[6px] rounded-[6px] text-[12px] font-medium cursor-pointer border-0',
                'flex items-center gap-[5px] capitalize transition-colors duration-150',
                activeTab === tab
                  ? 'bg-brand-orange text-white'
                  : 'bg-transparent text-pos-faint',
              )}
            >
              <Icon size={12} />
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          );
        })}
      </div>

      <div className="flex-1" />

      {/* Shift info */}
      <div className="text-right mr-2">
        <p className="text-[11px] text-pos-muted">Shift: 9:00 AM · Open</p>
        <p className="text-[11px] font-medium text-brand-orange">Alex Chen · Register 1</p>
      </div>

      <Avatar name="Alex Chen" size={30} variant="pos" />

      <button
        onClick={() => navigate('/seller/dashboard')}
        className="px-3 py-[6px] rounded-lg text-[11px] cursor-pointer border border-carbon bg-transparent text-white/45"
      >
        ← Dashboard
      </button>
    </div>
  );
}
