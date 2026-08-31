import { Modal, Button } from '@/components/comman/ui';

export interface VersionRow { _id: string; publishedAt: string }

/**
 * One shared version-history UI for every content type with real version
 * history (Theme/Page/Collection Template) — mirrors the unified backend
 * mechanism (`ContentVersioningService`). Restoring a version always writes
 * to the content's DRAFT slot only; the caller's `onRestore` is expected to
 * do exactly that (never publish directly) and then refresh its own editor
 * state, matching every other draft-mutating flow in the Store Builder.
 */
export function VersionHistoryModal<T extends VersionRow>({
  title, open, onClose, versions, loading, restoringId, onRestore,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  versions: T[];
  loading: boolean;
  restoringId: string | null;
  onRestore: (versionId: string) => void;
}) {
  if (!open) return null;

  return (
    <Modal title={title} width={480} onClose={onClose}>
      {loading ? (
        <p className="text-[12.5px] text-slate py-4 text-center">Loading…</p>
      ) : versions.length === 0 ? (
        <p className="text-[12.5px] text-slate py-4 text-center">No published versions yet — publish at least once to start building history.</p>
      ) : (
        <div className="flex flex-col gap-2 max-h-[420px] overflow-y-auto">
          {versions.map((v, i) => (
            <div key={v._id} className="flex items-center justify-between gap-3 border border-bone rounded-lg px-3 py-2.5">
              <div>
                <p className="text-[12.5px] font-semibold text-charcoal">{i === 0 ? 'Current published version' : `Published ${new Date(v.publishedAt).toLocaleString()}`}</p>
                {i === 0 && <p className="text-[11px] text-slate">{new Date(v.publishedAt).toLocaleString()}</p>}
              </div>
              {i !== 0 && (
                <Button size="xs" variant="outline" loading={restoringId === v._id} onClick={() => onRestore(v._id)}>
                  Restore to Draft
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
