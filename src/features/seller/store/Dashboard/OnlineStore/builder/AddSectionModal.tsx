import { Modal } from '@/components/comman/ui';
import { SECTION_META } from './sectionRegistry';
import type { SectionType } from '@/api/services/storefrontTypes';

export function AddSectionModal({
  onPick, onClose, supportedTypes,
}: {
  onPick: (type: SectionType) => void;
  onClose: () => void;
  /** The active store's real theme only — when passed, the picker is
   *  filtered to just the section types that theme's own renderer actually
   *  has registered (see `ThemePreviewComponents.supportedSectionTypes`).
   *  Undefined (a caller that hasn't resolved a theme, or a theme that
   *  hasn't declared this yet) falls back to the full catalogue, same as
   *  before this filter existed — this was a real, live bug: a Nova store
   *  could "add" a Video or Drop Countdown section here and have it render
   *  as nothing at all, with no error anywhere, because Nova's own renderer
   *  never registered those two types. */
  supportedTypes?: SectionType[];
}) {
  const pickable = SECTION_META.filter(meta => !meta.hidden && (!supportedTypes || supportedTypes.includes(meta.type)));
  return (
    <Modal title="Add a Section" onClose={onClose}>
      <p className="text-[13px] text-slate -mt-1 mb-4">Choose a block to add to your page. You can rearrange or remove it anytime.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {pickable.map(meta => (
          <button
            key={meta.type}
            onClick={() => { onPick(meta.type); onClose(); }}
            className="flex items-start gap-3 p-3.5 rounded-xl border border-bone bg-white text-left cursor-pointer transition-all duration-150 hover:border-brand-orange/50 hover:shadow-[0_2px_10px_rgba(0,0,0,0.06)] hover:-translate-y-[1px]"
          >
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${meta.color}18` }}>
              <meta.Icon size={18} style={{ color: meta.color }} />
            </div>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-charcoal">{meta.label}</p>
              <p className="text-[11.5px] text-slate leading-snug mt-[2px]">{meta.description}</p>
            </div>
          </button>
        ))}
      </div>
    </Modal>
  );
}
