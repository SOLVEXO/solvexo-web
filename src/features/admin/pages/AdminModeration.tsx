import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { ArrowLeft, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ── Data ──────────────────────────────────────────────────────────────────────
type Risk     = 'high' | 'medium' | 'low';
type ItemType = 'Listing' | 'Seller' | 'Review';

interface ModerationItem {
  id: string; type: ItemType; item: string;
  seller: string; reason: string; risk: Risk; reported: string;
}

const ITEMS: ModerationItem[] = [
  { id: 'R-3401', type: 'Listing', item: 'Grade 12 Exam Papers 2024', seller: 'ExamLeaks99',   reason: 'Possible copyright violation', risk: 'high',   reported: '2h ago'    },
  { id: 'R-3400', type: 'Seller',  item: 'FastDigital99 account',     seller: 'FastDigital99', reason: 'Duplicate account suspected',  risk: 'high',   reported: '3h ago'    },
  { id: 'R-3399', type: 'Listing', item: 'Premium UI Kit Bundle',     seller: 'DesignHub',     reason: 'Counterfeit product report',   risk: 'medium', reported: '5h ago'    },
  { id: 'R-3398', type: 'Review',  item: "Review on 'Math Bundle'",   seller: 'anon_buyer',    reason: 'Suspected fake review',        risk: 'low',    reported: '8h ago'    },
  { id: 'R-3397', type: 'Listing', item: 'Music Sample Pack Vol.3',   seller: 'BeatFactory',   reason: 'DMCA takedown request',        risk: 'high',   reported: 'Yesterday' },
  { id: 'R-3396', type: 'Seller',  item: 'QuickSell Store',           seller: 'QuickSell',     reason: 'High refund rate (42%)',       risk: 'medium', reported: 'Yesterday' },
];

const RISK: Record<Risk, { label: string; bg: string; color: string; Icon: LucideIcon }> = {
  high:   { label: 'High',   bg: '#FDECEA', color: '#C0392B', Icon: AlertCircle   },
  medium: { label: 'Medium', bg: '#FFF4DC', color: '#B36200', Icon: AlertTriangle },
  low:    { label: 'Low',    bg: '#F0EEE6', color: '#5A5852', Icon: Info          },
};

const typeStyle: Record<ItemType, { bg: string; color: string }> = {
  Listing: { bg: '#EAF0FB', color: '#2156A8' },
  Seller:  { bg: '#FBECE4', color: '#C96847' },
  Review:  { bg: '#F0EEE6', color: '#5A5852' },
};

const metrics = [
  { label: 'Queue Total',     value: '52',      sub: 'Items to review',    trend: null,            trendUp: false },
  { label: 'Urgent',          value: '14',      sub: 'High-risk flags',    trend: null,            trendUp: false },
  { label: 'Approved Today',  value: '86',      sub: null,                 trend: '+12 vs yesterday', trendUp: true },
  { label: 'Avg Review Time', value: '4.2 min', sub: null,                 trend: '-0.8 min',      trendUp: true  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminModeration() {
  const navigate = useNavigate();
  usePageTitle('Moderation');
  const [search, setSearch] = useState('');
  const [typeF,  setTypeF]  = useState('');
  const [riskF,  setRiskF]  = useState('');

  const filtered = ITEMS.filter(item => {
    const q = search.toLowerCase();
    if (q && !item.id.toLowerCase().includes(q) && !item.item.toLowerCase().includes(q) && !item.seller.toLowerCase().includes(q)) return false;
    if (typeF && item.type !== typeF) return false;
    if (riskF && item.risk !== riskF) return false;
    return true;
  });

  return (
    <div>

      {/* ── Header ── */}
      <div className="bg-white border-b border-bone px-7 py-[14px] flex items-center justify-between sticky top-0 z-10">
        <div>
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Content Moderation</h1>
          <p className="text-[12px] text-slate mt-[2px]">Review flagged listings, sellers, and reports</p>
        </div>
        <div className="flex items-center gap-[10px]">
          <span className="inline-flex items-center gap-1 px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold bg-[#FDECEA] text-[#C0392B]">
            <AlertCircle size={11} /> 14 Urgent
          </span>
          <span className="inline-flex items-center gap-1 px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold bg-[#FFF4DC] text-[#B36200]">
            <AlertTriangle size={11} /> 38 Pending
          </span>
          <button
            onClick={() => navigate('/seller/dashboard')}
            className="px-3 py-[6px] rounded-lg text-[12px] font-medium text-slate bg-transparent border border-bone cursor-pointer flex items-center gap-[5px]"
          >
            <ArrowLeft size={13} /> Back to Demo
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="px-7 pt-5 pb-8 flex flex-col gap-5">

        {/* Metrics */}
        <div className="grid grid-cols-4 gap-3">
          {metrics.map(m => (
            <div key={m.label} className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] px-5 py-4">
              <p className="text-[11px] font-medium text-slate uppercase tracking-[0.06em] mb-1">{m.label}</p>
              <p className="text-[28px] font-bold text-charcoal leading-[1.15]">{m.value}</p>
              {m.trend && <p className="text-[12px] text-[#2D8A4E] mt-1">▲ {m.trend}</p>}
              {m.sub   && <p className="text-[12px] text-slate mt-1">{m.sub}</p>}
            </div>
          ))}
        </div>

        {/* Table card */}
        <div className="bg-white border border-bone rounded-[10px] shadow-[0_1px_4px_rgba(0,0,0,0.04)] overflow-hidden">

          {/* Filters */}
          <div className="px-5 py-[14px] border-b border-bone flex gap-[10px] items-center flex-wrap">
            <div className="flex items-center gap-[6px] border border-bone rounded-lg px-3 bg-white flex-1 max-w-[280px]">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8C8A82" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input placeholder="Search flagged items..." value={search} onChange={e => setSearch(e.target.value)}
                className="border-none outline-none text-[13px] py-2 w-full text-[#2C2A28] bg-transparent" />
            </div>
            {[
              { value: typeF, set: setTypeF, opts: ['All Types','Listing','Seller','Review'] },
              { value: riskF, set: setRiskF, opts: ['All Priority','high','medium','low']    },
            ].map((s, i) => (
              <select key={i} value={s.value} onChange={e => s.set(e.target.value)}
                className="px-3 py-2 rounded-lg border border-bone text-[13px] bg-white text-[#2C2A28] outline-none cursor-pointer">
                {s.opts.map(o => <option key={o} value={o.startsWith('All') ? '' : o}>{o}</option>)}
              </select>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  {['#','Type','Item','Seller','Reason','Risk','Reported','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-[10px] text-[11px] font-semibold text-slate uppercase tracking-[0.05em] border-b border-bone bg-[#FAF9F5] whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item, i) => {
                  const risk = RISK[item.risk];
                  const ts   = typeStyle[item.type];
                  return (
                    <tr key={item.id}
                      className="transition-colors duration-[120ms]"
                      style={{ borderBottom: i < filtered.length - 1 ? '1px solid #F0EEE6' : 'none', background: item.risk === 'high' ? '#FFFAF9' : '#fff' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#FAF9F5')}
                      onMouseLeave={e => (e.currentTarget.style.background = item.risk === 'high' ? '#FFFAF9' : '#fff')}
                    >
                      {/* ID */}
                      <td className="px-4 py-3 font-bold text-[#B95A3A] whitespace-nowrap text-[13px]">{item.id}</td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                          style={{ background: ts.bg, color: ts.color }}>{item.type}</span>
                      </td>
                      {/* Item */}
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-[13px] font-medium text-charcoal m-0">{item.item}</p>
                      </td>
                      {/* Seller */}
                      <td className="px-4 py-3 text-[13px] text-[#4A4945] whitespace-nowrap">{item.seller}</td>
                      {/* Reason */}
                      <td className="px-4 py-3 text-[13px] text-[#4A4945] max-w-[200px]">{item.reason}</td>
                      {/* Risk */}
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
                          style={{ background: risk.bg, color: risk.color }}>
                          <risk.Icon size={10} /> {risk.label}
                        </span>
                      </td>
                      {/* Reported */}
                      <td className="px-4 py-3 text-[13px] text-slate whitespace-nowrap">{item.reported}</td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex gap-[6px]">
                          {[['Review','#1A72C2'],['Approve','#2D8A4E'],['Remove','#C13030']].map(([lbl, bg]) => (
                            <button key={lbl} className="px-[10px] py-1 rounded-[6px] text-[11px] font-medium text-white border-none cursor-pointer whitespace-nowrap"
                              style={{ background: bg }}>
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
