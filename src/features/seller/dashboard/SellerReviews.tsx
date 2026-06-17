import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';

// ── Data ──────────────────────────────────────────────────────────────────────
interface Review {
  id: number; name: string; initials: string; stars: number;
  product: string; date: string; text: string; reply: string | null; flaggable?: boolean;
}

const REVIEWS: Review[] = [
  { id: 1, name: 'Sarah M.',  initials: 'SM', stars: 5, product: 'Grade 5 Math Bundle',      date: 'May 18', text: 'Absolutely incredible resource. My students improved so much this year using this curriculum. Worth every penny!', reply: null },
  { id: 2, name: 'David R.',  initials: 'DR', stars: 5, product: 'Fractions Mastery Kit',    date: 'May 14', text: 'Excellent kit with clear instructions and engaging materials. My class loved it!', reply: "Thank you David! So glad it's working well for your class. See you next year!" },
  { id: 3, name: 'Lena K.',   initials: 'LK', stars: 2, product: 'Handmade Ceramic Mug',     date: 'May 12', text: 'Nice quality but arrived with a small chip. Seller resolved it quickly with a replacement.', reply: 'So sorry about that Lena! A replacement is on its way. Thank you for your patience.' },
  { id: 4, name: 'Tom B.',    initials: 'TB', stars: 5, product: 'Brand Identity Figma Kit', date: 'May 10', text: 'Professional, well-organized, and saved me hours of work. Highly recommend!', reply: null },
  { id: 5, name: 'Mike S.',   initials: 'MS', stars: 2, product: 'Lo-Fi Music Pack',         date: 'May 6',  text: 'Some tracks were not as described. Expected longer loops but many are under 30 seconds.', reply: null, flaggable: true },
];

const STAR_BREAKDOWN = [
  { stars: 5, pct: 78, count: '661' },
  { stars: 4, pct: 14, count: '118' },
  { stars: 3, pct: 5,  count: '42'  },
  { stars: 2, pct: 2,  count: '17'  },
  { stars: 1, pct: 1,  count: '9'   },
];

const avatarColors: Record<string, { bg: string; color: string }> = {
  SM: { bg: '#FDECEA', color: '#C0392B' }, DR: { bg: '#EAF3FB', color: '#2156A8' },
  LK: { bg: '#EAF7EF', color: '#1E7A3C' }, TB: { bg: '#FFF4E5', color: '#B36200' },
  MS: { bg: '#E5F4FB', color: '#1A6A8A' },
};

// ── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ count, large }: { count: number; large?: boolean }) {
  const size = large ? 20 : 13;
  return (
    <span style={{ fontSize: size, lineHeight: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ color: i <= count ? '#D97757' : '#E8E6DC' }}>★</span>
      ))}
    </span>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function SellerReviews() {
  usePageTitle('Reviews');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortFilter,   setSortFilter]   = useState('');

  const filtered = REVIEWS.filter(r => {
    if (ratingFilter && String(r.stars) !== ratingFilter) return false;
    if (sortFilter === 'replied'   && !r.reply)     return false;
    if (sortFilter === 'unreplied' && r.reply)       return false;
    if (sortFilter === 'flagged'   && !r.flaggable)  return false;
    return true;
  });

  return (
    <>
      <SellerPageHeader
        title="Reviews & Reputation"
        subtitle="Monitor, respond to, and learn from customer feedback."
        actions={
          <button className="px-4 py-[7px] bg-white border border-[#E8E6DC] rounded-lg text-xs font-medium text-[#4A4945] cursor-pointer">
            Export Reviews
          </button>
        }
      />

      <div className="px-7 pb-8 pt-5 flex flex-col gap-5">

        {/* ── Top 2-col ── */}
        <div className="grid gap-4" style={{ gridTemplateColumns: '300px 1fr' }}>

          {/* Rating Summary */}
          <div className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <div className="text-center mb-5">
              <p className="text-[48px] font-bold text-[#141413] leading-none mb-1.5">4.8</p>
              <div className="mb-1.5"><Stars count={5} large /></div>
              <p className="text-xs text-[#8C8A82]">Based on 847 reviews</p>
            </div>
            <div className="flex flex-col gap-2">
              {STAR_BREAKDOWN.map(row => (
                <div key={row.stars} className="flex items-center gap-2">
                  <span className="text-xs text-[#4A4945] w-7 shrink-0">{row.stars} ★</span>
                  <div className="flex-1 h-1.5 rounded-[3px] bg-[#E8E6DC] overflow-hidden">
                    <div className="h-full rounded-[3px] bg-brand-orange" style={{ width: `${row.pct}%` }} />
                  </div>
                  <span className="text-[11px] text-[#8C8A82] w-7 text-right shrink-0">{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reputation Insights */}
          <div className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
            <p className="text-[13px] font-semibold text-[#141413] mb-4">Reputation Insights</p>
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { value: '72%',     label: 'Response Rate',      sub: 'Reply to all reviews',  color: '#2D8A4E' },
                { value: '4.2 hrs', label: 'Avg Response Time',  sub: 'Within 24hrs is great', color: '#1A72C2' },
                { value: '78%',     label: '5-Star Rate',         sub: 'Industry avg: 65%',     color: '#2D8A4E' },
                { value: '38',      label: 'Reviews This Month',  sub: '+12 vs last month',     color: '#141413' },
                { value: '1',       label: 'Flagged Reviews',     sub: '1 under moderation',    color: '#C08B1E' },
                { value: '82',      label: 'Net Promoter',        sub: 'Excellent',             color: '#2D8A4E' },
              ].map(item => (
                <div key={item.label} className="bg-[#FAF9F5] rounded-[10px] px-4 py-[14px]">
                  <p className="text-[22px] font-bold leading-[1.15]" style={{ color: item.color }}>{item.value}</p>
                  <p className="text-xs font-medium text-[#4A4945] mt-1">{item.label}</p>
                  <p className="text-[11px] text-[#8C8A82] mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div className="flex items-center gap-[10px]">
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className="w-[150px] px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select
            value={sortFilter}
            onChange={e => setSortFilter(e.target.value)}
            className="w-[140px] px-3 py-2 text-[13px] border border-[#E8E6DC] rounded-lg bg-white text-[#2C2A28] outline-none cursor-pointer"
          >
            <option value="">All</option>
            <option value="replied">Replied</option>
            <option value="unreplied">Unreplied</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>

        {/* ── Reviews list ── */}
        <div className="flex flex-col gap-[14px]">
          {filtered.map(review => {
            const av = avatarColors[review.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
            return (
              <div key={review.id} className="bg-white border border-[#E8E6DC] rounded-[10px] px-[22px] py-5 shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-[34px] h-[34px] rounded-full text-[10px] font-bold flex items-center justify-center shrink-0"
                      style={{ background: av.bg, color: av.color }}
                    >
                      {review.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-bold text-[#141413]">{review.name}</span>
                        <Stars count={review.stars} />
                        <span className="px-2 py-[2px] rounded-[5px] text-[11px] font-medium bg-[#F0EEE6] text-[#5A5852]">{review.product}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-[#8C8A82] shrink-0">{review.date}</span>
                </div>

                {/* Review text */}
                <p className="text-[13px] text-[#4A4945] leading-[1.6] mb-3">{review.text}</p>

                {/* Existing reply */}
                {review.reply && (
                  <div className="bg-[#FBECE4] rounded-[10px] px-[14px] py-3 mb-3">
                    <p className="text-[11px] font-semibold text-[#B95A3A] mb-1.5">Your reply:</p>
                    <p className="text-[13px] text-[#4A4945] leading-[1.6]">{review.reply}</p>
                    <div className="mt-2.5">
                      <button className="px-3 py-1 bg-white border border-[#E8E6DC] rounded-[6px] text-xs text-[#4A4945] cursor-pointer">
                        Edit Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!review.reply && (
                  <div className="flex items-center gap-2">
                    <button className="px-[14px] py-[5px] bg-white border border-[#E8E6DC] rounded-[7px] text-xs text-[#4A4945] cursor-pointer">
                      Reply
                    </button>
                    {review.flaggable && (
                      <button className="px-[14px] py-[5px] bg-[#FDECEA] border border-[#F5C6C2] rounded-[7px] text-xs font-medium text-[#C0392B] cursor-pointer">
                        Flag Review
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
