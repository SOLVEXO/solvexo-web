import { Sparkles, Check, X } from 'lucide-react';
import { Card } from '@/components/comman/ui/Card';
import { Button } from '@/components/comman/ui/Button';
import { SkeletonBox } from '@/components/comman/ui/SkeletonBox';

export interface AiSeoSuggestionValue {
  metaTitle?:       string;
  metaDescription?: string;
  keywords?:        string[];
}

interface AiSuggestionPanelProps {
  suggestion?: AiSeoSuggestionValue | null;
  generating:  boolean;
  onGenerate:  () => void;
  onAccept:    () => void;
  onDiscard:   () => void;
  className?:  string;
  /** True while the accept request is in flight. */
  accepting?:   boolean;
  /** Inline error from a failed accept. */
  acceptError?: string;
  /** True once the suggestion was written; shows the success state. */
  applied?:     boolean;
  /** Success text, e.g. "Applied to your product." */
  appliedLabel?: string;
  /** False disables Generate (e.g. no product chosen yet). Defaults to true. */
  canGenerate?: boolean;
}

export function AiSuggestionPanel({
  suggestion, generating, onGenerate, onAccept, onDiscard, className,
  accepting = false, acceptError, applied = false, appliedLabel = 'Applied.', canGenerate = true,
}: AiSuggestionPanelProps) {
  return (
    <Card className={className}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px] font-semibold text-carbon flex items-center gap-[6px]">
          <Sparkles size={14} className="text-brand-orange" /> AI SEO Suggestion
        </p>
        {!suggestion && (
          <Button variant="secondary" size="sm" icon={<Sparkles size={12} />} loading={generating} disabled={!canGenerate || generating} onClick={onGenerate}>
            Generate
          </Button>
        )}
      </div>

      {generating && !suggestion && (
        <div className="flex flex-col gap-2">
          <SkeletonBox height={13} width="70%" rounded="4px" />
          <SkeletonBox height={11} width="95%" rounded="3px" />
          <SkeletonBox height={11} width="85%" rounded="3px" />
        </div>
      )}

      {!generating && !suggestion && (
        <p className="text-[12px] text-slate leading-[1.6]">
          Generate an AI-written meta title, description, and keywords based on this item's existing content.
          You will see a preview first; nothing changes until you choose "Use this".
        </p>
      )}

      {suggestion && (
        <div className="flex flex-col gap-3">
          {applied ? (
            <p role="status" className="flex items-center gap-[6px] text-[12px] font-medium text-success">
              <Check size={13} /> {appliedLabel}
            </p>
          ) : (
            <p className="text-[12px] font-medium text-brand-deep-orange">Preview - nothing has changed yet</p>
          )}
          {suggestion.metaTitle && (
            <div>
              <p className="text-[11px] font-medium text-graphite mb-1">Suggested Title</p>
              <p className="text-[13px] text-carbon leading-[1.5]">{suggestion.metaTitle}</p>
            </div>
          )}
          {suggestion.metaDescription && (
            <div>
              <p className="text-[11px] font-medium text-graphite mb-1">Suggested Description</p>
              <p className="text-[13px] text-carbon leading-[1.5]">{suggestion.metaDescription}</p>
            </div>
          )}
          {suggestion.keywords && suggestion.keywords.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-graphite mb-1">Suggested Keywords</p>
              <div className="flex flex-wrap gap-1.5">
                {suggestion.keywords.map(k => (
                  <span key={k} className="px-[9px] py-[2px] bg-cream border border-bone rounded-[5px] text-[11px] text-graphite">
                    {k}
                  </span>
                ))}
              </div>
            </div>
          )}
          {acceptError && <p role="alert" className="text-[12px] text-error">{acceptError}</p>}
          <div className="flex items-center gap-2 pt-1">
            {applied ? (
              <Button variant="ghost" size="sm" icon={<X size={12} />} onClick={onDiscard}>Close</Button>
            ) : (
              <>
                <Button variant="primary" size="sm" icon={<Check size={12} />} loading={accepting} disabled={accepting} onClick={onAccept}>
                  Use this
                </Button>
                <Button variant="ghost" size="sm" icon={<X size={12} />} disabled={accepting} onClick={onDiscard}>Discard</Button>
              </>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
