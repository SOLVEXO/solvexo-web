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

const poppins   = "'Poppins', sans-serif";
const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #E8E6DC', borderRadius: 10, padding: '20px 22px', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' };
const selectStyle: React.CSSProperties = { padding: '8px 12px', fontSize: 13, border: '1px solid #E8E6DC', borderRadius: 8, background: '#fff', color: '#2C2A28', outline: 'none', cursor: 'pointer', fontFamily: poppins };

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
          <button style={{ padding: '7px 16px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 8, fontSize: 12, fontWeight: 500, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
            Export Reviews
          </button>
        }
      />

      <div style={{ padding: '20px 28px 32px', display: 'flex', flexDirection: 'column', gap: 20, fontFamily: poppins }}>

        {/* ── Top 2-col ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>

          {/* Rating Summary */}
          <div style={cardStyle}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <p style={{ fontSize: 48, fontWeight: 700, color: '#141413', lineHeight: 1, marginBottom: 6 }}>4.8</p>
              <div style={{ marginBottom: 6 }}><Stars count={5} large /></div>
              <p style={{ fontSize: 12, color: '#8C8A82' }}>Based on 847 reviews</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STAR_BREAKDOWN.map(row => (
                <div key={row.stars} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12, color: '#4A4945', width: 28, flexShrink: 0, fontFamily: poppins }}>{row.stars} ★</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: '#E8E6DC', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${row.pct}%`, background: '#D97757' }} />
                  </div>
                  <span style={{ fontSize: 11, color: '#8C8A82', width: 28, textAlign: 'right', flexShrink: 0, fontFamily: poppins }}>{row.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reputation Insights */}
          <div style={cardStyle}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#141413', marginBottom: 16 }}>Reputation Insights</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { value: '72%',     label: 'Response Rate',      sub: 'Reply to all reviews',  color: '#2D8A4E' },
                { value: '4.2 hrs', label: 'Avg Response Time',  sub: 'Within 24hrs is great', color: '#1A72C2' },
                { value: '78%',     label: '5-Star Rate',         sub: 'Industry avg: 65%',     color: '#2D8A4E' },
                { value: '38',      label: 'Reviews This Month',  sub: '+12 vs last month',     color: '#141413' },
                { value: '1',       label: 'Flagged Reviews',     sub: '1 under moderation',    color: '#C08B1E' },
                { value: '82',      label: 'Net Promoter',        sub: 'Excellent',             color: '#2D8A4E' },
              ].map(item => (
                <div key={item.label} style={{ background: '#FAF9F5', borderRadius: 10, padding: '14px 16px' }}>
                  <p style={{ fontSize: 22, fontWeight: 700, color: item.color, lineHeight: 1.15, fontFamily: poppins }}>{item.value}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#4A4945', marginTop: 4, fontFamily: poppins }}>{item.label}</p>
                  <p style={{ fontSize: 11, color: '#8C8A82', marginTop: 2, fontFamily: poppins }}>{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Filters ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} style={{ ...selectStyle, width: 150 }}>
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>
          <select value={sortFilter} onChange={e => setSortFilter(e.target.value)} style={{ ...selectStyle, width: 140 }}>
            <option value="">All</option>
            <option value="replied">Replied</option>
            <option value="unreplied">Unreplied</option>
            <option value="flagged">Flagged</option>
          </select>
        </div>

        {/* ── Reviews list ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(review => {
            const av = avatarColors[review.initials] ?? { bg: '#F0EEE6', color: '#5A5852' };
            return (
              <div key={review.id} style={cardStyle}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: av.bg, color: av.color, fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {review.initials}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#141413', fontFamily: poppins }}>{review.name}</span>
                        <Stars count={review.stars} />
                        <span style={{ padding: '2px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, background: '#F0EEE6', color: '#5A5852', fontFamily: poppins }}>{review.product}</span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#8C8A82', flexShrink: 0, fontFamily: poppins }}>{review.date}</span>
                </div>

                {/* Review text */}
                <p style={{ fontSize: 13, color: '#4A4945', lineHeight: 1.6, marginBottom: 12, fontFamily: poppins }}>{review.text}</p>

                {/* Existing reply */}
                {review.reply && (
                  <div style={{ background: '#FBECE4', borderRadius: 10, padding: '12px 14px', marginBottom: 12 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#B95A3A', marginBottom: 6, fontFamily: poppins }}>Your reply:</p>
                    <p style={{ fontSize: 13, color: '#4A4945', lineHeight: 1.6, fontFamily: poppins }}>{review.reply}</p>
                    <div style={{ marginTop: 10 }}>
                      <button style={{ padding: '4px 12px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 6, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                        Edit Reply
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {!review.reply && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button style={{ padding: '5px 14px', background: '#fff', border: '1px solid #E8E6DC', borderRadius: 7, fontSize: 12, color: '#4A4945', cursor: 'pointer', fontFamily: poppins }}>
                      Reply
                    </button>
                    {review.flaggable && (
                      <button style={{ padding: '5px 14px', background: '#FDECEA', border: '1px solid #F5C6C2', borderRadius: 7, fontSize: 12, fontWeight: 500, color: '#C0392B', cursor: 'pointer', fontFamily: poppins }}>
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