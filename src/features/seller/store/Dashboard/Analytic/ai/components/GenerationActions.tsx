import { Button } from '@/components/comman/ui/Button';

interface GenerationActionsProps {
  onUseThis?: () => void;
  onRegenerate: () => void;
  useThisLabel?: string;
  useThisDisabled?: boolean;
  submitting?: boolean;
  regenerating?: boolean;
}

export function GenerationActions({
  onUseThis, onRegenerate, useThisLabel = 'Use This', useThisDisabled, submitting, regenerating,
}: GenerationActionsProps) {
  return (
    <div className="flex gap-2 pt-1">
      {onUseThis && (
        <Button
          variant="primary"
          size="md"
          loading={submitting}
          disabled={useThisDisabled}
          onClick={onUseThis}
          className="flex-1"
        >
          {useThisLabel}
        </Button>
      )}
      <Button variant="outline" size="md" loading={regenerating} onClick={onRegenerate} className={onUseThis ? undefined : 'flex-1'}>
        Regenerate
      </Button>
    </div>
  );
}
