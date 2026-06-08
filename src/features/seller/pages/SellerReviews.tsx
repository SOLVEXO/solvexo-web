import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';

interface Review {
  id: number;
  name: string;
  stars: number;
  product: string;
  date: string;
  text: string;
  reply: string | null;
  flaggable?: boolean;
}

const REVIEWS: Review[] = [
  {
    id: 1,
    name: 'Sarah M.',
    stars: 5,
    product: 'Grade 5 Math Bundle',
    date: 'May 18',
    text: 'Absolutely incredible resource. My students improved so much this year using this curriculum. Worth every penny!',
    reply: null,
  },
  {
    id: 2,
    name: 'David R.',
    stars: 5,
    product: 'Fractions Mastery Kit',
    date: 'May 14',
    text: 'Excellent kit with clear instructions and engaging materials. My class loved it!',
    reply: "Thank you David! So glad it's working well for your class. See you next year!",
  },
  {
    id: 3,
    name: 'Lena K.',
    stars: 2,
    product: 'Handmade Ceramic Mug',
    date: 'May 12',
    text: 'Nice quality but arrived with a small chip. Seller resolved it quickly with a replacement.',
    reply: 'So sorry about that Lena! A replacement is on its way. Thank you for your patience.',
  },
  {
    id: 4,
    name: 'Tom B.',
    stars: 5,
    product: 'Brand Identity Figma Kit',
    date: 'May 10',
    text: 'Professional, well-organized, and saved me hours of work. Highly recommend!',
    reply: null,
  },
  {
    id: 5,
    name: 'Mike S.',
    stars: 2,
    product: 'Lo-Fi Music Pack',
    date: 'May 6',
    text: 'Some tracks were not as described. Expected longer loops but many are under 30 seconds.',
    reply: null,
    flaggable: true,
  },
];

const STAR_BREAKDOWN = [
  { stars: 5, pct: 78,  count: '661' },
  { stars: 4, pct: 14,  count: '118' },
  { stars: 3, pct: 5,   count: '42'  },
  { stars: 2, pct: 2,   count: '17'  },
  { stars: 1, pct: 1,   count: '9'   },
];

function StarDisplay({ count, size = 'sm' }: { count: number; size?: 'sm' | 'lg' }) {
  const full = Math.floor(count);
  const half = count % 1 >= 0.5;
  return (
    <span className={size === 'lg' ? 'text-[22px]' : 'text-[13px]'}>
      {Array.from({ length: full }).map((_, i) => (
        <span key={i} className="text-brand-orange">★</span>
      ))}
      {half && <span className="text-brand-orange">½</span>}
      {Array.from({ length: 5 - full - (half ? 1 : 0) }).map((_, i) => (
        <span key={i} className="text-bone">★</span>
      ))}
    </span>
  );
}

export function SellerReviews() {
  usePageTitle('Reviews');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortFilter, setSortFilter]     = useState('');

  return (
    <>
      <SellerPageHeader
        title="Reviews & Reputation"
        subtitle="Monitor, respond to, and learn from customer feedback."
        actions={
          <Button variant="ghost" size="sm">Export Reviews</Button>
        }
      />

      <div className="p-7 flex flex-col gap-5">

        {/* Top 2-col */}
        <div className="grid grid-cols-[320px_1fr] gap-5">

          {/* Rating Summary */}
          <Card>
            <div className="text-center mb-4">
              <p className="text-[48px] font-bold text-carbon leading-none mb-1">4.8</p>
              <div className="mb-1"><StarDisplay count={4.5} size="lg" /></div>
              <p className="text-[12px] text-slate">Based on 847 reviews</p>
            </div>

            <div className="flex flex-col gap-2">
              {STAR_BREAKDOWN.map(row => (
                <div key={row.stars} className="flex items-center gap-2">
                  <span className="text-[13px] text-charcoal w-8 flex-shrink-0">{row.stars} ★</span>
                  <div className="flex-1 h-1.5 rounded-full bg-bone overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand-orange"
                      style={{ width: `${row.pct}%` }}
                    />
                  </div>
                  <span className="text-[12px] text-slate w-8 text-right flex-shrink-0">{row.pct}%</span>
                </div>
              ))}
            </div>
          </Card>

          {/* Reputation Insights */}
          <Card>
            <p className="text-[13px] font-semibold text-carbon mb-4">Reputation Insights</p>
            <div className="grid grid-cols-3 gap-4">
              {[
                { value: '72%',    label: 'Response Rate',          sub: 'Reply to all reviews',  color: 'text-success'  },
                { value: '4.2 hrs',label: 'Avg Response Time',      sub: 'Within 24hrs is great', color: 'text-info'     },
                { value: '78%',    label: '5-Star Rate',            sub: 'Industry avg: 65%',     color: 'text-success'  },
                { value: '38',     label: 'Reviews This Month',     sub: '+12 vs last month',     color: 'text-carbon'   },
                { value: '1',      label: 'Flagged Reviews',        sub: '1 under moderation',    color: 'text-warning'  },
                { value: '82',     label: 'Net Promoter',           sub: 'Excellent',             color: 'text-success'  },
              ].map(item => (
                <div key={item.label} className="bg-cream rounded-xl p-4">
                  <p className={`text-[22px] font-bold leading-tight ${item.color}`}>{item.value}</p>
                  <p className="text-[12px] font-medium text-charcoal mt-0.5">{item.label}</p>
                  <p className="text-[11px] text-slate mt-0.5">{item.sub}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3">
          <div className="w-[160px]">
            <Select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)}>
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </Select>
          </div>
          <div className="w-[140px]">
            <Select value={sortFilter} onChange={e => setSortFilter(e.target.value)}>
              <option value="">All</option>
              <option value="replied">Replied</option>
              <option value="unreplied">Unreplied</option>
              <option value="flagged">Flagged</option>
            </Select>
          </div>
        </div>

        {/* Reviews list */}
        <div className="flex flex-col gap-4">
          {REVIEWS.map(review => (
            <Card key={review.id}>
              {/* Header row */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar name={review.name} size={36} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-bold text-carbon">{review.name}</span>
                      <StarDisplay count={review.stars} />
                      <Badge color="gray">{review.product}</Badge>
                    </div>
                  </div>
                </div>
                <span className="text-[12px] text-slate flex-shrink-0">{review.date}</span>
              </div>

              {/* Review text */}
              <p className="text-[13px] text-charcoal leading-relaxed mb-3">{review.text}</p>

              {/* Existing reply */}
              {review.reply && (
                <div className="bg-brand-pale-orange rounded-xl p-3 mb-3">
                  <p className="text-[11px] text-brand-deep-orange font-semibold mb-1">Your reply:</p>
                  <p className="text-[13px] text-charcoal leading-relaxed">{review.reply}</p>
                  <div className="mt-2">
                    <Button variant="ghost" size="sm">Edit Reply</Button>
                  </div>
                </div>
              )}

              {/* Actions */}
              {!review.reply && (
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">Reply</Button>
                  {review.flaggable && (
                    <Button variant="danger" size="sm">Flag Review</Button>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </>
  );
}
