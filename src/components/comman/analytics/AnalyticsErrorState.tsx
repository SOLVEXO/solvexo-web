import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/comman/ui';

interface AnalyticsErrorStateProps {
  message: string;
  onRetry?: () => void;
}

/** Shared inline error panel for every analytics screen (admin + seller) — this codebase has no dedicated error component, so this is the one reusable piece for the whole analytics feature area. */
export function AnalyticsErrorState({ message, onRetry }: AnalyticsErrorStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 bg-white border border-bone rounded-[10px]">
      <AlertTriangle size={26} className="text-error" />
      <p className="text-[13px] text-error max-w-[360px]">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}
