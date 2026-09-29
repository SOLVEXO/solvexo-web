import { useMemo, useState, type ReactNode } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminAnnouncements, useAnnouncementActions } from '@/hooks/admin/useAdminAnnouncements';
import type { Announcement, AnnouncementStatus } from '@/api/services/announcements/adminAnnouncements';
import { Button, Modal, Input, Textarea, Table, StatusBadge, FilterDropdown, SearchInput, AdminPageHeader, ActionMenu, DateTimePickerModal } from '@/components/comman/ui';
import type { TableColumn } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { formatDate } from '@/components/comman/analytics/format';
import { Megaphone, Trash2, Pencil, Send, CalendarClock, ArrowDownToLine } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
];

// ── Create form ───────────────────────────────────────────────────────────────
function CreateAnnouncementCard({ onCreated }: { onCreated: () => void }) {
  const { createAnnouncement, submitting, error } = useAnnouncementActions();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [validationError, setValidationError] = useState('');
  const [showSchedulePicker, setShowSchedulePicker] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  async function submit(status: 'draft' | 'published' | 'scheduled', scheduledAtOverride?: string) {
    if (!title.trim() || !message.trim()) {
      setValidationError('Title and message are required.');
      return;
    }

    setValidationError('');

    const ok = await createAnnouncement({
      title: title.trim(),
      message: message.trim(),
      status,
      ...(status === 'scheduled' ? { scheduledAt: new Date(scheduledAtOverride!).toISOString() } : {}),
    });

    if (ok) {
      setTitle('');
      setMessage('');
      setScheduledAt('');
      onCreated();
    }
  }

  return (
    <div className="bg-white border border-bone rounded-[10px] px-[22px] py-5">
      <p className="text-[14px] font-bold text-charcoal mb-[18px]">
        Create Announcement
      </p>

      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          placeholder="Announcement title…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Message"
          rows={4}
          placeholder="Write your announcement message here…"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {(validationError || error) && (
          <p className="text-[12px] text-error">
            {validationError || error}
          </p>
        )}

        <div className="flex gap-1.5">
          <Button
            size="sm"
            onClick={() => submit('published')}
            loading={submitting}
          >
            Publish Now
          </Button>

          <Button
            size="sm"
            variant="outline"
            icon={<CalendarClock size={13} />}
            onClick={() => setShowSchedulePicker(true)}
            loading={submitting}
          >
            Schedule
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => submit('draft')}
            loading={submitting}
          >
            Draft
          </Button>
        </div>
      </div>

      {showSchedulePicker && (
        <DateTimePickerModal
          title="Schedule Announcement"
          value={scheduledAt}
          onClose={() => setShowSchedulePicker(false)}
          onChange={(iso) => {
            setScheduledAt(iso);
            setShowSchedulePicker(false);
            void submit('scheduled', iso);
          }}
        />
      )}
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditAnnouncementModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { updateAnnouncement, submitting, error } = useAnnouncementActions();

  const [title, setTitle] = useState(announcement.title);
  const [message, setMessage] = useState(announcement.message);
  const [validationError, setValidationError] = useState('');

  async function submit() {
    if (!title.trim() || !message.trim()) {
      setValidationError('Title and message are required.');
      return;
    }

    setValidationError('');

    const ok = await updateAnnouncement(announcement._id, {
      title: title.trim(),
      message: message.trim(),
    });

    if (ok) onSaved();
  }

  return (
    <Modal
      mobileSheet
      title="Edit Announcement"
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>

          <Button onClick={submit} loading={submitting}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <Textarea
          label="Message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {(validationError || error) && (
          <p className="text-[12px] text-error">
            {validationError || error}
          </p>
        )}
      </div>
    </Modal>
  );
}

// ── Schedule modal ────────────────────────────────────────────────────────────
function ScheduleModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { setStatus } = useAnnouncementActions();

  async function submit(iso: string) {
    const ok = await setStatus(announcement._id, 'scheduled', new Date(iso).toISOString());
    if (ok) onSaved();
  }

  return (
    <DateTimePickerModal
      title={`Schedule "${announcement.title}"`}
      value=""
      onClose={onClose}
      onChange={submit}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminAnnouncements({
  tabs,
}: {
  tabs?: ReactNode;
} = {}) {
  usePageTitle('Announcements');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const query = useMemo(
    () => ({
      search: search || undefined,
      status: (statusFilter || undefined) as
        | AnnouncementStatus
        | undefined,
      page,
      limit: 10,
    }),
    [search, statusFilter, page],
  );

  const { data, loading, error, refetch } =
    useAdminAnnouncements(query);

  const {
    setStatus,
    deleteAnnouncement,
    submitting: actionSubmitting,
    error: actionError,
  } = useAnnouncementActions();

  const [editing, setEditing] = useState<Announcement | null>(null);
  const [scheduling, setScheduling] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState<Announcement | null>(null);

  async function handlePublish(a: Announcement) {
    const ok = await setStatus(a._id, 'published');
    if (ok) refetch();
  }

  async function handleUnpublish(a: Announcement) {
    const ok = await setStatus(a._id, 'draft');
    if (ok) refetch();
  }

  async function handleDelete() {
    if (!deleting) return;

    const ok = await deleteAnnouncement(deleting._id);

    if (ok) {
      setDeleting(null);
      refetch();
    }
  }

  const columns: TableColumn<Announcement>[] = [
    {
      key: 'title',
      header: 'Announcement',
      render: (a) => (
        <div className="max-w-[420px]">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <p className="text-[13px] font-semibold text-charcoal">
              {a.title}
            </p>

            <StatusBadge status={a.status} size="sm" />
          </div>

          <p className="text-[12px] text-slate leading-[1.5] line-clamp-2">
            {a.message}
          </p>
        </div>
      ),
    },

    {
      key: 'createdAt',
      header: 'Date',
      render: (a) => (
        <span className="text-[12px] text-slate whitespace-nowrap">
          {a.status === 'scheduled' && a.scheduledAt
            ? `Scheduled ${formatDate(a.scheduledAt)}`
            : formatDate(a.createdAt)}
        </span>
      ),
    },

    {
  key: 'actions',
  header: 'Actions',
  align: 'center',
  width: '80px',
  render: (a) => (
    <ActionMenu
      align="right"
      items={[
        ...(a.status !== 'published'
          ? [{
              label: 'Publish',
              onClick: () => handlePublish(a),
              icon: <Send size={13} />,
            }]
          : []),

        ...(a.status === 'draft'
          ? [{
              label: 'Schedule',
              onClick: () => setScheduling(a),
              icon: <CalendarClock size={13} />,
            }]
          : []),

        ...(a.status === 'published'
          ? [{
              label: 'Unpublish',
              onClick: () => handleUnpublish(a),
              icon: <ArrowDownToLine size={13} />,
            }]
          : []),

        {
          label: 'Edit',
          onClick: () => setEditing(a),
          icon: <Pencil size={13} />,
        },

        {
          label: 'Delete',
          onClick: () => setDeleting(a),
          icon: <Trash2 size={13} />,
          danger: true,
        },
      ]}
    />
  ),
},

  ];

  return (
    <>
      <AdminPageHeader
        title="Announcements"
        subtitle="Broadcast platform-wide messages to every seller — one notification per store, one email per seller."
      />

      {tabs}

      <div className="px-4 sm:px-7 pt-6 pb-8">

        {/* 4 + 8 COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

          {/* CREATE ANNOUNCEMENT - 4 COLUMNS */}
          <div className="lg:col-span-4">
            <CreateAnnouncementCard onCreated={refetch} />
          </div>

          {/* ALL ANNOUNCEMENTS - 8 COLUMNS */}
          <div className="lg:col-span-8">
            <div className="bg-white border border-bone rounded-[10px] overflow-hidden">

              <div className="px-5 py-[14px] border-b border-bone flex items-center gap-[10px] flex-wrap">
                <p className="text-[14px] font-bold text-charcoal flex-1">
                  List of Announcements ({data?.total ?? 0})
                </p>

                <SearchInput
                  value={search}
                  onChange={(v) => {
                    setSearch(v);
                    setPage(1);
                  }}
                  placeholder="Search announcements…"
                  className="max-w-[240px]"
                />

                <FilterDropdown
                  placeholder="All Statuses"
                  options={STATUS_OPTIONS}
                  value={statusFilter}
                  onChange={(v) => {
                    setStatusFilter(v);
                    setPage(1);
                  }}
                />
              </div>

              {error ? (
                <div className="p-5">
                  <AnalyticsErrorState
                    message={error}
                    onRetry={refetch}
                  />
                </div>
              ) : (
                <Table
                  columns={columns}
                  data={data?.items ?? []}
                  keyExtractor={(a) => a._id}
                  loading={loading}
                  emptyState={{
                    icon: (
                      <Megaphone
                        size={28}
                        className="text-slate/50"
                      />
                    ),
                    title: 'No announcements yet',
                    description:
                      'Create your first announcement above to broadcast a message to users or sellers.',
                  }}
                  pagination={{
                    page,
                    total: data?.total ?? 0,
                    perPage: 10,
                    onChange: setPage,
                    label: 'announcements',
                  }}
                />
              )}

            </div>
          </div>

        </div>

        {/* ACTION ERROR */}
        {actionError && (
          <div className="mt-5 bg-error-bg border border-error-border rounded-lg px-4 py-2.5 text-[12.5px] text-error">
            {actionError}
          </div>
        )}

      </div>

      {/* EDIT MODAL */}
      {editing && (
        <EditAnnouncementModal
          announcement={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refetch();
          }}
        />
      )}

      {/* SCHEDULE MODAL */}
      {scheduling && (
        <ScheduleModal
          announcement={scheduling}
          onClose={() => setScheduling(null)}
          onSaved={() => {
            setScheduling(null);
            refetch();
          }}
        />
      )}

      {/* DELETE MODAL */}
      {deleting && (
        <Modal
          mobileSheet
          title="Delete Announcement"
          onClose={() => setDeleting(null)}
          footer={
            <>
              <Button
                variant="ghost"
                onClick={() => setDeleting(null)}
              >
                Cancel
              </Button>

              <Button
                variant="danger"
                onClick={handleDelete}
                loading={actionSubmitting}
              >
                Delete Announcement
              </Button>
            </>
          }
        >
          <p className="text-[13px] text-charcoal leading-[1.6]">
            Delete "<strong>{deleting.title}</strong>"? This cannot
            be undone.
          </p>

          {actionError && (
            <p className="text-[12px] text-error mt-2">
              {actionError}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
