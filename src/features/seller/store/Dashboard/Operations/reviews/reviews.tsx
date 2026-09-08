import { useEffect, useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useStoreWorkspace, StorePageHeader } from '@/components/layouts/StoreLayout';
import {
  StarRating, EmptyState, SkeletonBox, Card, Badge,
  Table, type TableColumn, ActionMenu, type ActionMenuItem,
  Modal, Button, FilterDropdown, TabBar,
} from '@/components/comman/ui';
import { Star, Flag, MessageSquare, Trash2, ImageIcon, Check, X as XIcon } from 'lucide-react';
import {
  apiGetStoreReviews, apiReplyToReview, apiEditReply, apiFlagReview, apiUnflagReview, apiModerateDeleteReview,
  apiApproveReview, apiRejectReview,
  type StoreReviewEntry, type StoreReviewStats,
} from '@/api/services/rating';

const AVATAR_PALETTE = ['#FDECEA:#C0392B', '#EAF3FB:#2156A8', '#EAF7EF:#1E7A3C', '#FFF4E5:#B36200', '#E5F4FB:#1A6A8A'];
function avatarStyle(name: string) {
  const idx = name.charCodeAt(0) % AVATAR_PALETTE.length;
  const [bg, color] = AVATAR_PALETTE[idx].split(':');
  return { bg, color };
}

const PER_PAGE = 10;

export function StoreReviews() {
  usePageTitle('Reviews');
  const { storeId, store } = useStoreWorkspace();
  const moderationEnabled = !!store?.reviewModerationEnabled;

  const [reviews, setReviews] = useState<StoreReviewEntry[]>([]);
  const [stats, setStats]     = useState<StoreReviewStats | null>(null);
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [ratingFilter, setRatingFilter] = useState('');
  const [replyStatusFilter, setReplyStatusFilter] = useState('');
  const [productIdFilter, setProductIdFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'pending'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  const [replyingTo, setReplyingTo] = useState<StoreReviewEntry | null>(null);
  const [editingReplyOf, setEditingReplyOf] = useState<StoreReviewEntry | null>(null);
  const [actionError, setActionError] = useState('');
  const [deletingReview, setDeletingReview] = useState<StoreReviewEntry | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [moderatingId, setModeratingId] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string | number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    apiGetStoreReviews(storeId, {
      page,
      rating: ratingFilter ? parseInt(ratingFilter) : undefined,
      productId: productIdFilter || undefined,
      replyStatus: (replyStatusFilter || undefined) as any,
      status: statusTab === 'pending' ? 'pending' : undefined,
    })
      .then(res => {
        if (cancelled) return;
        setReviews(res.data.reviews ?? []);
        setStats(res.data.stats);
        setTotal(res.data.pagination.total);
      })
      .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load reviews.'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [storeId, page, ratingFilter, replyStatusFilter, productIdFilter, statusTab, refreshKey]);

  useEffect(() => { setSelectedKeys(new Set()); }, [page, ratingFilter, replyStatusFilter, productIdFilter, statusTab]);

  function reload() { setRefreshKey(k => k + 1); }

  async function handleApprove(r: StoreReviewEntry) {
    setActionError('');
    setModeratingId(r.reviewId);
    try { await apiApproveReview(r.reviewId); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to approve review.'); }
    finally { setModeratingId(null); }
  }

  async function handleReject(r: StoreReviewEntry) {
    setActionError('');
    setModeratingId(r.reviewId);
    try { await apiRejectReview(r.reviewId); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to reject review.'); }
    finally { setModeratingId(null); }
  }

  // Only ever meaningful for rows that are actually pending — a selection
  // mixing in already-published/rejected rows just quietly skips those
  // rather than erroring the whole batch.
  async function handleBulkModerate(ids: (string | number)[], action: 'approve' | 'reject') {
    setActionError('');
    setBulkBusy(true);
    const pendingIds = reviews.filter(r => r.status === 'pending' && ids.includes(r.reviewId)).map(r => r.reviewId);
    try {
      await Promise.allSettled(pendingIds.map(id => (action === 'approve' ? apiApproveReview(id) : apiRejectReview(id))));
      setSelectedKeys(new Set());
      reload();
    } finally {
      setBulkBusy(false);
    }
  }

  async function handleFlag(r: StoreReviewEntry) {
    setActionError('');
    try { await apiFlagReview(r.reviewId); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to flag review.'); }
  }

  async function handleUnflag(r: StoreReviewEntry) {
    setActionError('');
    try { await apiUnflagReview(r.reviewId); reload(); }
    catch (err) { setActionError(err instanceof Error ? err.message : 'Failed to unflag review.'); }
  }

  async function confirmModerateDelete() {
    if (!deletingReview) return;
    setDeleteBusy(true);
    setActionError('');
    try {
      await apiModerateDeleteReview(deletingReview.reviewId);
      setDeletingReview(null);
      reload();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to remove review.');
    } finally {
      setDeleteBusy(false);
    }
  }

  const columns: TableColumn<StoreReviewEntry>[] = [
    {
      key: 'sno', header: 'S.No', width: '56px',
      render: (_r, i) => <span className="text-[12px] text-slate">{(page - 1) * PER_PAGE + i + 1}</span>,
    },
    {
      key: 'customer', header: 'Customer', width: '220px',
      render: r => {
        const av = avatarStyle(r.customer.name);
        const initials = r.customer.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
        return (
          <div className="flex items-center gap-[10px]">
            <div className="w-8 h-8 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: av.bg, color: av.color }}>
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-charcoal truncate">{r.customer.name}</p>
              {r.isVerifiedPurchase && <p className="text-[10px] text-success font-medium">Verified Purchase</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'rating', header: 'Rating', width: '110px',
      render: r => r.rating != null ? <StarRating value={r.rating} size={12} /> : <span className="text-slate text-[12px]">—</span>,
    },
    {
      key: 'review', header: 'Review',
      render: r => (
        <div className="max-w-[360px]">
          {(r.comments ?? []).length > 0 ? (
            <p className="text-[13px] text-charcoal leading-[1.5] line-clamp-2">{r.comments[0].text}</p>
          ) : (
            <span className="text-[12px] text-slate italic">No comment</span>
          )}
          {(r.media ?? []).length > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-slate mt-1">
              <ImageIcon size={11} /> {r.media.length} photo{r.media.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status', header: 'Status', width: '150px',
      render: r => (
        <div className="flex flex-wrap gap-1">
          {r.status === 'pending' && <Badge color="orange">Pending</Badge>}
          {r.status === 'rejected' && <Badge color="red">Rejected</Badge>}
          {r.isFlagged && <Badge color="red">Flagged</Badge>}
          {r.status === 'published' && (r.sellerReply ? <Badge color="green">Replied</Badge> : <Badge color="gray">Awaiting reply</Badge>)}
        </div>
      ),
    },
    {
      key: 'createdAt', header: 'Date', width: '110px',
      render: r => <span className="text-[12px] text-slate">{new Date(r.createdAt).toLocaleDateString()}</span>,
    },
    {
      key: 'actions', header: '', align: 'right', width: '60px',
      render: r => {
        const moderationItems: ActionMenuItem[] = r.status === 'pending'
          ? [
              { label: 'Approve', icon: <Check size={13} />, onClick: () => handleApprove(r) },
              { label: 'Reject', icon: <XIcon size={13} />, danger: true, onClick: () => handleReject(r) },
            ]
          : [];
        const items: ActionMenuItem[] = [
          ...moderationItems,
          ...(r.sellerReply
            ? [{ label: 'Edit Reply', icon: <MessageSquare size={13} />, onClick: () => setEditingReplyOf(r) }]
            : [{ label: 'Reply', icon: <MessageSquare size={13} />, onClick: () => setReplyingTo(r) }]),
          r.isFlagged
            ? { label: 'Unflag', onClick: () => handleUnflag(r) }
            : { label: 'Flag Review', icon: <Flag size={13} />, onClick: () => handleFlag(r) },
          { label: 'Remove', icon: <Trash2 size={13} />, danger: true, onClick: () => { setDeletingReview(r); setActionError(''); } },
        ];
        return <ActionMenu items={items.map(item => ({ ...item, disabled: moderatingId === r.reviewId }))} />;
      },
    },
  ];

  return (
    <>
      <StorePageHeader
        title="Reviews & Reputation"
        subtitle="Monitor, respond to, and learn from customer feedback."
      />

      <div className="px-4 lg:px-7 pb-8 pt-5 flex flex-col gap-5">

        {actionError && (
          <div className="flex items-center justify-between gap-3 text-[13px] text-error bg-error-bg border border-error-border rounded-lg px-3 py-2">
            <span>{actionError}</span>
            <button onClick={() => setActionError('')} className="text-[11px] font-semibold text-error bg-transparent border-none cursor-pointer shrink-0">Dismiss</button>
          </div>
        )}

        {/* ── Top 2-col ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">

          {/* Rating Summary */}
          <Card>
            {loading && !stats ? (
              <div className="flex flex-col gap-3">
                <SkeletonBox height={70} width="100%" rounded="8px" />
                <SkeletonBox height={90} width="100%" rounded="8px" />
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <p className="text-[48px] font-bold text-charcoal leading-none mb-1.5">{stats?.averageRating.toFixed(1) ?? '0.0'}</p>
                  <div className="mb-1.5 flex justify-center"><StarRating value={stats?.averageRating ?? 0} size={20} /></div>
                  <p className="text-xs text-slate">Based on {stats?.totalReviews ?? 0} reviews</p>
                </div>
                <div className="flex flex-col gap-2">
                  {(['5', '4', '3', '2', '1'] as const).map(star => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-graphite w-7 shrink-0">{star} ★</span>
                      <div className="flex-1 h-1.5 rounded-[3px] bg-bone overflow-hidden">
                        <div className="h-full rounded-[3px] bg-brand-orange" style={{ width: stats?.ratingBreakdown[star] ?? '0%' }} />
                      </div>
                      <span className="text-[11px] text-slate w-7 text-right shrink-0">{stats?.ratingBreakdown[star] ?? '0%'}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Reputation Insights */}
          <Card>
            <p className="text-[13px] font-semibold text-charcoal mb-4">Reputation Insights</p>
            {loading && !stats ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonBox key={i} height={74} rounded="10px" />)}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { value: stats?.responseRate ?? '0%',    label: 'Response Rate',     sub: 'Reply to all reviews', color: '#2D8A4E' },
                  { value: stats?.avgResponseTime ?? '—',  label: 'Avg Response Time', sub: 'Within 24hrs is great', color: '#1A72C2' },
                  { value: stats?.fiveStarRate ?? '0%',    label: '5-Star Rate',       sub: '',                      color: '#2D8A4E' },
                  { value: String(stats?.reviewsThisMonth ?? 0), label: 'Reviews This Month', sub: '', color: '#141413' },
                  { value: String(stats?.flaggedReviews ?? 0),   label: 'Flagged Reviews',    sub: 'Under moderation', color: '#C08B1E' },
                  ...(moderationEnabled
                    ? [{ value: String(stats?.pendingReviews ?? 0), label: 'Pending Approval', sub: 'Awaiting your review', color: '#C08B1E' }]
                    : []),
                  { value: String(stats?.totalReviews ?? 0),     label: 'Total Reviews',      sub: '',                 color: '#141413' },
                ].map(item => (
                  <div key={item.label} className="bg-cream rounded-[10px] px-4 py-[14px]">
                    <p className="text-[22px] font-bold leading-[1.15]" style={{ color: item.color }}>{item.value}</p>
                    <p className="text-xs font-medium text-graphite mt-1">{item.label}</p>
                    {item.sub && <p className="text-[11px] text-slate mt-0.5">{item.sub}</p>}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Reviews table ── */}
        <Card padding="none">
          {moderationEnabled && (
            <TabBar
              tabs={[
                { id: 'all', label: 'All' },
                { id: 'pending', label: 'Pending', count: stats?.pendingReviews ?? 0 },
              ]}
              active={statusTab}
              onChange={id => { setStatusTab(id as 'all' | 'pending'); setPage(1); }}
              className="px-5"
            />
          )}

          {/* Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-[10px] px-5 py-4 border-b border-bone">
            <select
              value={ratingFilter}
              onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-[150px] px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
            <select
              value={replyStatusFilter}
              onChange={e => { setReplyStatusFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-[140px] px-3 py-2 text-[13px] border border-bone rounded-lg bg-white text-charcoal outline-none cursor-pointer"
            >
              <option value="">All</option>
              <option value="replied">Replied</option>
              <option value="unreplied">Unreplied</option>
              <option value="flagged">Flagged</option>
            </select>
            {(stats?.reviewedProducts?.length ?? 0) > 0 && (
              <FilterDropdown
                placeholder="All Products"
                options={(stats?.reviewedProducts ?? []).map(p => ({ value: p.productId, label: p.name }))}
                value={productIdFilter}
                onChange={v => { setProductIdFilter(v); setPage(1); }}
                className="w-full sm:w-[180px]"
              />
            )}
          </div>

          {loading ? (
            <div className="flex flex-col gap-2 p-5">
              {[1, 2, 3, 4].map(i => <SkeletonBox key={i} height={56} rounded="8px" />)}
            </div>
          ) : error ? (
            <p className="text-[13px] text-error p-5">{error}</p>
          ) : reviews.length === 0 ? (
            <EmptyState icon={<Star size={28} className="text-brand-orange" />} title="No reviews found" description="Reviews matching your filters will show up here." />
          ) : (
            <Table
              columns={columns}
              data={reviews}
              keyExtractor={r => r.reviewId}
              pagination={{ page, total, perPage: PER_PAGE, onChange: setPage, label: 'reviews' }}
              selectable={moderationEnabled}
              selectedKeys={selectedKeys}
              onSelectionChange={setSelectedKeys}
              bulkActions={keys => (
                <>
                  <Button size="xs" variant="secondary" icon={<Check size={12} />} loading={bulkBusy} onClick={() => handleBulkModerate(Array.from(keys), 'approve')}>
                    Approve
                  </Button>
                  <Button size="xs" variant="danger" icon={<XIcon size={12} />} disabled={bulkBusy} onClick={() => handleBulkModerate(Array.from(keys), 'reject')}>
                    Reject
                  </Button>
                </>
              )}
            />
          )}
        </Card>
      </div>

      {replyingTo && (
        <ReplyModal
          title="Reply to Review"
          initialText=""
          onClose={() => setReplyingTo(null)}
          onSubmit={async text => { await apiReplyToReview(replyingTo.reviewId, text); setReplyingTo(null); reload(); }}
        />
      )}

      {editingReplyOf?.sellerReply && (
        <ReplyModal
          title="Edit Reply"
          initialText={editingReplyOf.sellerReply.text}
          onClose={() => setEditingReplyOf(null)}
          onSubmit={async text => { await apiEditReply(editingReplyOf.reviewId, text); setEditingReplyOf(null); reload(); }}
        />
      )}

      {deletingReview && (
        <Modal title="Remove Review" onClose={() => setDeletingReview(null)} mobileSheet footer={
          <>
            <Button variant="ghost" onClick={() => setDeletingReview(null)} disabled={deleteBusy}>Cancel</Button>
            <Button variant="danger" onClick={confirmModerateDelete} loading={deleteBusy}>Remove Review</Button>
          </>
        }>
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Remove this review from <strong>{deletingReview.customer.name}</strong> permanently? This cannot be undone.
          </p>
          {actionError && <p className="text-[12px] text-error mt-2">{actionError}</p>}
        </Modal>
      )}
    </>
  );
}

function ReplyModal({
  title, initialText, onClose, onSubmit,
}: {
  title: string;
  initialText: string;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}) {
  const [text, setText] = useState(initialText);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  async function submit() {
    if (!text.trim()) { setError('Reply cannot be empty.'); return; }
    setError('');
    setSaving(true);
    try {
      await onSubmit(text.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save reply.');
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-[420px] bg-white rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-bone">
          <p className="text-[15px] font-bold text-charcoal">{title}</p>
        </div>
        <div className="px-5 py-4">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            placeholder="Write your reply…"
            className="w-full border border-bone rounded-lg px-3 py-2 text-[13px] text-charcoal outline-none box-border resize-vertical mb-3"
          />
          {error && <p className="text-[12px] text-error mb-3">{error}</p>}
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 py-[9px] bg-white border border-bone rounded-lg text-[13px] text-graphite cursor-pointer">
              Cancel
            </button>
            <button onClick={submit} disabled={saving} className="flex-1 py-[9px] bg-brand-orange border-0 rounded-lg text-[13px] font-semibold text-white cursor-pointer disabled:opacity-50">
              {saving ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
