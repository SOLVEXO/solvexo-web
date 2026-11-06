import { Button } from '@/components/comman/ui';

export function ErrorLine({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center gap-3 rounded-lg border border-error-border bg-error-bg px-4 py-3 text-[13px] text-error">
      <span className="flex-1">{message}</span>
      <Button size="xs" variant="outline" onClick={onRetry}>Retry</Button>
    </div>
  );
}
