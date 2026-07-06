import { useRef, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { Paperclip, Send, Loader2, X, Mic, MicOff } from 'lucide-react';
import type { Message } from '@/api/services/messaging';
import { EmojiPicker } from './EmojiPicker';

interface MessageInputProps {
  value:          string;
  onChange:       (v: string) => void;
  onSend:         () => void;
  onFileSelect:   (file: File) => void;
  uploading:      boolean;
  sending:        boolean;
  replyTo?:       Message | null;
  onCancelReply?: () => void;
}

// ── Voice recorder hook ───────────────────────────────────────────────────────
function useVoiceRecorder(onReady: (file: File) => void) {
  const [recording,  setRecording]  = useState(false);
  const [seconds,    setSeconds]    = useState(0);
  const mrRef    = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4' });
      mrRef.current    = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const mimeType = mr.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const ext  = mimeType.includes('mp4') ? 'mp4' : 'webm';
        const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });
        onReady(file);
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start(100);
      setRecording(true);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds(s => s + 1), 1000);
    } catch {
      // microphone permission denied — silently ignore
    }
  };

  const stop = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    mrRef.current?.stop();
    mrRef.current = null;
    setRecording(false);
    setSeconds(0);
  };

  const cancel = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (mrRef.current) {
      mrRef.current.ondataavailable = null;
      mrRef.current.onstop = null;
      mrRef.current.stop();
      mrRef.current = null;
    }
    chunksRef.current = [];
    setRecording(false);
    setSeconds(0);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return { recording, seconds, formattedTime: fmt(seconds), start, stop, cancel };
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MessageInput({
  value, onChange, onSend, onFileSelect, uploading, sending, replyTo, onCancelReply,
}: MessageInputProps) {
  const fileRef  = useRef<HTMLInputElement>(null);
  const canSend  = value.trim().length > 0 && !sending;

  const { recording, formattedTime, start, stop, cancel } = useVoiceRecorder(file => {
    onFileSelect(file);
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (canSend) onSend(); }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) onFileSelect(file);
  };

  // ── Voice recording active state ─────────────────────────────────────────
  if (recording) {
    return (
      <div className="border-t border-[#EEECE4] bg-white px-4 py-[10px] shrink-0">
        <div className="flex items-center gap-3 bg-cream rounded-[22px] px-4 py-[11px]">
          {/* Animated mic dot */}
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
          <span className="text-[13px] font-medium text-charcoal flex-1">Recording {formattedTime}</span>
          {/* Cancel */}
          <button
            type="button"
            onClick={cancel}
            aria-label="Cancel recording"
            className="w-9 h-9 flex items-center justify-center rounded-full text-slate hover:bg-bone cursor-pointer bg-transparent border-none"
            title="Cancel"
          >
            <MicOff size={17} />
          </button>
          {/* Send */}
          <button
            type="button"
            onClick={stop}
            aria-label="Send voice note"
            className="w-[42px] h-[42px] rounded-full bg-brand-orange text-white border-none flex items-center justify-center cursor-pointer hover:opacity-90"
            title="Send voice note"
          >
            {uploading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-[#EEECE4] bg-white px-4 py-[10px] shrink-0">
      {replyTo && (
        <div className="flex items-center gap-2 mb-[8px] px-3 py-[7px] bg-cream rounded-[10px] border-l-[3px] border-brand-orange">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-brand-deep-orange">Replying to</p>
            <p className="text-[12px] text-slate truncate">{replyTo.text ?? `[${replyTo.type}]`}</p>
          </div>
          <button onClick={onCancelReply} aria-label="Cancel reply" className="p-1 rounded-full hover:bg-bone cursor-pointer bg-transparent border-none text-slate shrink-0">
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
            aria-label="Attach file"
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full cursor-pointer border-none bg-transparent text-slate hover:bg-bone disabled:opacity-50"
          >
            {uploading ? <Loader2 size={17} className="animate-spin" /> : <Paperclip size={17} />}
          </button>
          <input ref={fileRef} type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx,.zip" onChange={handleFile} />
        </div>

        {/* Send OR mic button — mic shows when input is empty */}
        {canSend ? (
          <button
            type="button"
            onClick={onSend}
            disabled={sending}
            aria-label="Send message"
            className="w-[42px] h-[42px] shrink-0 rounded-full border-none flex items-center justify-center cursor-pointer bg-brand-orange text-white hover:opacity-90"
          >
            {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
          </button>
        ) : (
          <button
            type="button"
            onClick={start}
            aria-label="Record voice note"
            className={clsx(
              'w-[42px] h-[42px] shrink-0 rounded-full border-none flex items-center justify-center cursor-pointer transition-colors',
              'bg-bone text-slate hover:bg-brand-pale-orange hover:text-brand-orange',
            )}
            title="Hold to record voice note"
          >
            <Mic size={17} />
          </button>
        )}
      </div>
    </div>
  );
}
