import { useId, useRef, useState } from 'react';
import { X, Loader2, Store } from 'lucide-react';
import { useFocusTrap } from '@/components/comman/ui/useFocusTrap';

interface NewChatModalProps {
  onClose:  () => void;
  onStart:  (storeId: string) => Promise<void>;
  starting: boolean;
}

// Instagram's "New message" overlay, simplified: since there's no store
// directory/search endpoint in the messaging API, the buyer pastes the
// store ID they want to reach out to.
export function NewChatModal({ onClose, onStart, starting }: NewChatModalProps) {
  const [storeId, setStoreId] = useState('');
  const titleId   = useId();
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, onClose);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 transition-opacity duration-200 starting:opacity-0">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-[380px] bg-white border border-bone rounded-[16px] overflow-hidden outline-none transition-all duration-200 ease-out starting:opacity-0 starting:scale-95"
      >
        <div className="flex items-center justify-between px-4 py-[14px] border-b border-[#eeece4]">
          <p id={titleId} className="text-[15px] font-bold text-charcoal">New message</p>
          <button onClick={onClose} aria-label="Close dialog" className="w-7 h-7 flex items-center justify-center rounded-full bg-cream border-none cursor-pointer">
            <X size={13} className="text-charcoal" />
          </button>
        </div>

        <div className="px-4 py-5 flex flex-col gap-3">
          <div className="flex items-center gap-[8px] bg-cream rounded-full px-[14px] py-[10px]">
            <Store size={15} className="text-slate shrink-0" />
            <input
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              placeholder="Enter store ID to message"
              aria-label="Store ID to message"
              className="flex-1 bg-transparent border-none outline-none text-[13px] text-charcoal"
              autoFocus
            />
          </div>

          <button
            onClick={() => void onStart(storeId.trim())}
            disabled={starting || !storeId.trim()}
            className="w-full py-[11px] rounded-full bg-brand-orange text-white text-[13px] font-semibold border-none cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {starting && <Loader2 size={14} className="animate-spin" />}
            {starting ? 'Starting…' : 'Chat'}
          </button>
        </div>
      </div>
    </div>
  );
}
