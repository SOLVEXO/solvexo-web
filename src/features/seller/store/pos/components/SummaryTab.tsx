const SHIFT_METRICS = [
  { label: 'Total Sales',      value: '$842.50', sub: '14 transactions'         },
  { label: 'Cash Sales',       value: '$340.00', sub: '5 transactions'          },
  { label: 'Card Sales',       value: '$502.50', sub: '9 transactions'          },
  { label: 'Avg Transaction',  value: '$60.18',  sub: '+$4.20 vs yesterday'     },
  { label: 'Items Sold',       value: '38 units',sub: 'Across 16 products'      },
  { label: 'Refunds',          value: '$0.00',   sub: '0 refunds today'         },
];

const TOP_SELLERS = [
  ['Ceramic Mug',     8, '$224.00'],
  ['Scented Candle',  6, '$144.00'],
  ['Bamboo Pen Set',  5, '$110.00'],
  ['Linen Tote',      4, '$168.00'],
] as const;

const DRAWER_ROWS = [
  ['Opening Float',    '$200.00', false],
  ['Cash Sales',       '$340.00', false],
  ['Payouts',          '−$0.00',  false],
  ['Expected',         '$540.00', false],
  ['Actual (counted)', '$538.50', false],
  ['Variance',         '−$1.50',  true ],
] as const;

export function SummaryTab() {
  return (
    <div className="flex-1 overflow-y-auto p-6">

      {/* Header */}
      <div className="flex items-center gap-[10px] mb-6">
        <p className="text-[18px] font-bold text-white flex-1">Shift Summary</p>
        <p className="text-[12px] text-pos-muted">Opened 9:00 AM · May 22, 2026</p>
        <button className="px-4 py-2 bg-[#C1303020] border border-error rounded-lg text-[12px] font-semibold text-error cursor-pointer">
          Close Shift
        </button>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-3 gap-[14px] mb-6">
        {SHIFT_METRICS.map(({ label, value, sub }) => (
          <div key={label} className="bg-pos-surface border border-carbon rounded-xl p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.08em] mb-1 text-pos-muted">{label}</p>
            <p className="text-[22px] font-bold text-white">{value}</p>
            <p className="text-[11px] mt-[2px] text-pos-muted">{sub}</p>
          </div>
        ))}
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-2 gap-4">

        {/* Top sellers */}
        <div className="bg-pos-surface border border-carbon rounded-xl p-4">
          <p className="text-[13px] font-semibold text-white mb-[14px]">Top Sellers Today</p>
          {TOP_SELLERS.map(([name, qty, revenue]) => (
            <div key={name} className="flex items-center gap-[10px] mb-[10px]">
              <span className="text-[12px] text-white flex-1">{name}</span>
              <span className="text-[11px] text-pos-muted">{qty} sold</span>
              <span className="text-[12px] font-semibold text-brand-orange">{revenue}</span>
            </div>
          ))}
        </div>

        {/* Cash drawer */}
        <div className="bg-pos-surface border border-carbon rounded-xl p-4">
          <p className="text-[13px] font-semibold text-white mb-[14px]">Cash Drawer Reconciliation</p>
          {DRAWER_ROWS.map(([label, val, isWarning]) => (
            <div key={label} className="flex justify-between pb-2 mb-2 border-b border-carbon">
              <span className="text-[12px] text-pos-faint">{label}</span>
              <span className={isWarning ? 'text-[12px] font-medium text-warning' : 'text-[12px] font-medium text-white'}>
                {val}
              </span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
