import { useRef } from 'react';
import { clsx } from 'clsx';
import { Paperclip, Send, Loader2, X } from 'lucide-react';
import type { Message } from '@/api/commerce/messaging';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  value:        string;
  onChange:     (v: string) => void;
  onSend:       () => void;
  onFileSelect: (file: File) => void;
  uploading:    boolean;
  sending:      boolean;
  replyTo?:     Message | null;
  onCancelReply?: () => void;
}

// The rounded pill composer bar Instagram DMs and WhatsApp both use:
// emoji + text field + attachment inside one pill, a circular send
// button that lights up once there's something to send.
export function MessageInput({ value, onChange, onSend, onFileSelect, uploading, sending, replyTo, onCancelReply }: MessageInputProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = value.trim().length > 0 && !sending;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) onSend();
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFileSelect(file);
  };

  return (
    <div className="border-t border-[#EEECE4] bg-white px-4 py-[10px] shrink-0">
      {replyTo && (
        <div className="flex items-center gap-2 mb-[8px] px-3 py-[7px] bg-cream rounded-[10px] border-l-[3px] border-brand-orange">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-brand-deep-orange">Replying to</p>
            <p className="text-[12px] text-slate truncate">{replyTo.text ?? `[${replyTo.type}]`}</p>
          </div>
          <button onClick={onCancelReply} className="p-1 rounded-full hover:bg-bone cursor-pointer bg-transparent border-none text-slate shrink-0">
            <X size={13} />
          </button>
        </div>
      )}

      <div className="flex items-end gap-[8px]">
        <div className="flex-1 flex items-end gap-[4px] bg-cream rounded-[22px] px-[6px] py-[4px] min-h-[42px]">
          <EmojiPicker onSelect={emoji => onChange(value + emoji)} />

          <textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 resize-none bg-transparent border-none outline-none text-[14px] text-charcoal py-[9px] leading-[1.3] max-h-[110px]"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full cursor-pointer border-none bg-transparent text-slate hover:bg-bone disabled:opacity-50"
          >
            {uploading ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
          </button>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFile} />
        </div>

        <button
          type="button"
          onClick={onSend}
          disabled={!canSend}
          className={clsx(
            'w-[42px] h-[42px] shrink-0 rounded-full border-none flex items-center justify-center cursor-pointer transition-colors',
            canSend ? 'bg-brand-orange text-white hover:opacity-90' : 'bg-bone text-slate cursor-not-allowed',
          )}
        >
          {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </div>
    </div>
  );
}
