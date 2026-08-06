import { PageHeader, NotificationsPanel } from '@/components/comman/ui';

// Real route for what used to live behind Settings' ?tab=notifications —
// NotificationsPanel itself has no page-level heading, so this just adds one.
export function Notifications() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader eyebrow="Account" title="Notifications" description="Choose what you get notified about." />
      <NotificationsPanel />
    </div>
  );
}
