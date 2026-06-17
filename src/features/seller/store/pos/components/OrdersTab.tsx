import { Avatar } from '@/components/comman/ui/Avatar';
import { Badge } from '@/components/comman/ui/Badge';
import { RECENT_SALES } from '../pos.data';

const DAY_STATS = [
  { label: "Today's Sales",  value: '$842.50', sub: '14 transactions'   },
  { label: 'Avg Ticket',     value: '$60.18',  sub: '↑ vs yesterday'    },
  { label: 'Top Item',       value: 'Ceramic Mug', sub: '8 sold today'  },
  { label: 'Cash in Drawer', value: '$340.00', sub: 'Expected'          },
];

export function OrdersTab() {
  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Day stats */}
      <div className="flex gap-[14px] mb-5">
        {DAY_STATS.map(({ label, value, sub }) => (
          <div key={label} className="flex-1 bg-pos-surface border border-carbon rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1 text-pos-muted">{label}</p>
            <p className="text-[20px] font-bold text-white">{value}</p>
            <p className="text-[11px] mt-[2px] text-pos-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Transactions table */}
      <div className="bg-pos-surface border border-carbon rounded-xl overflow-hidden">
        <div className="flex items-center gap-[10px] px-4 py-[14px] border-b border-carbon">
          <p className="text-[14px] font-semibold text-white flex-1">Recent Transactions</p>
          <input
            placeholder="Search..."
            className="bg-carbon border-0 rounded-lg px-3 py-[6px] text-[12px] text-white outline-none"
          />
          <button className="bg-carbon border-0 rounded-lg px-3 py-[6px] text-[11px] cursor-pointer text-pos-faint">
            Export
          </button>
        </div>

        <table className="w-full border-collapse">
          <thead>
            <tr>
              {['Order', 'Customer', 'Items', 'Total', 'Method', 'Time', 'Actions'].map(h => (
                <th
                  key={h}
                  className="text-left px-4 py-[10px] text-[10px] font-semibold uppercase tracking-[0.07em] bg-[#141312] border-b border-carbon text-pos-muted"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RECENT_SALES.map(s => (
              <tr key={s.id} className="border-b border-pos-surface">
                <td className="px-4 py-3">
                  <span className="text-[12px] font-bold text-brand-orange">{s.id}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Avatar name={s.customer === 'Walk-in' ? 'WI' : s.customer} size={24} variant="pos" />
                    <span className="text-[12px] text-white">{s.customer}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[12px] text-pos-faint">{s.items}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[13px] font-semibold text-white">${s.total.toFixed(2)}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge color={s.method === 'Card' ? 'blue' : s.method === 'Cash' ? 'green' : 'orange'}>
                    {s.method}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] text-pos-muted">{s.time}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-[6px]">
                    <button className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-pos-faint">
                      Receipt
                    </button>
                    <button className="px-[10px] py-1 bg-carbon border-0 rounded-[6px] text-[11px] cursor-pointer text-error">
                      Refund
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
