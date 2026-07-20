import { PageHeader, NotificationsPanel } from '@/components/comman/ui';

export function Notifications() {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Account"
        title="Notifications"
        description="Control how you're alerted and review your notification history."
      />
      <NotificationsPanel />
    </div>
  );
}
