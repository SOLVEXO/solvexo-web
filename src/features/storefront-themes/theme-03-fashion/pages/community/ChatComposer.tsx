import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ts } from '@/utils/tStatic';
import { Paperclip, Pencil, SendHorizontal, ShoppingBag, X } from 'lucide-react';
import type { Message } from '@/api/services/messaging';
import { fashionTheme as t } from '../../theme.config';
import { MAX_UPLOAD_BYTES, formatBytes, messagePreview } from '../../../core/community/communityFormat';

interface Props {
  /** Text the box starts with (used for editing a message). Remount with a new `key` to change it. */
  initialText?: string;
  editing: boolean;
  replyTo: Message | null;
  sending: boolean;
  uploading: boolean;
  uploadProgress: number;
  disabled?: boolean;
  onSubmit: (text: string) => void;
  onAttach: (file: File) => void;
  onShareProduct?: () => void;
  onTyping: (typing: boolean) => void;
  onCancelReply: () => void;
  onCancelEdit: () => void;
  onFileTooLarge: (file: File) => void;
}

/** Message box: auto-growing textarea (Enter sends, Shift+Enter = new line), attach, share product, reply / edit banner. */
export function ChatComposer({ initialText = '', editing, replyTo, sending, uploading, uploadProgress, disabled, onSubmit, onAttach, onShareProduct, onTyping, onCancelReply, onCancelEdit, onFileTooLarge }: Props) {
  const [text, setText] = useState(initialText);
  const fileRef = useRef<HTMLInputElement>(null);
  const canSend = text.trim().length > 0 && !sending && !disabled;

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!canSend) return;
    onSubmit(text.trim());
    setText('');
    onTyping(false);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); submit(); }
    if (e.key === 'Escape' && editing) onCancelEdit();
  };
  const pick = (files: FileList | null) => {
    const file = files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) { onFileTooLarge(file); return; }
    onAttach(file);
  };

  return (
    <form onSubmit={submit} className="shrink-0 p-3 sm:p-4" style={{ borderTop: `1px solid ${t.colors.border}`, paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
      {(replyTo || editing) && (
        <div className="mb-2 flex items-center gap-2 px-3 py-2 text-[13px]" style={{ borderRadius: 12, background: t.colors.bgAlt }}>
          {editing ? <Pencil size={14} aria-hidden /> : null}
          <span className="min-w-0 flex-1 truncate">{editing ? ts('pg.editing_message', 'Editing message') : <>{ts('pg.replying_to', 'Replying to:')} <span style={{ color: t.colors.inkMuted }}>{replyTo ? messagePreview(replyTo) : ''}</span></>}</span>
          <button type="button" onClick={editing ? onCancelEdit : onCancelReply} aria-label={editing ? ts('pg.cancel_editing', 'Cancel editing') : ts('pg.cancel_reply', 'Cancel reply')} className="grid size-7 place-items-center rounded-full border-0 bg-transparent" style={{ color: t.colors.ink, cursor: 'pointer' }}><X size={14} aria-hidden /></button>
        </div>
      )}
      {uploading && (
        <div className="mb-2" role="status" aria-label={ts('pg.uploading_file', 'Uploading file')}>
          <div className="h-1.5 overflow-hidden rounded-full" style={{ background: t.colors.bgAlt }}><div style={{ width: `${Math.max(6, uploadProgress)}%`, height: '100%', background: t.colors.selected, transition: 'width .2s' }} /></div>
          <p className="m-0 mt-1 text-xs" style={{ color: t.colors.inkMuted }}>{ts('pg.word_uploading', 'Uploading')} {uploadProgress > 0 ? `${uploadProgress}%` : ''}</p>
        </div>
      )}
      <div className="flex items-end gap-2">
        {!editing && (
          <>
            <input ref={fileRef} type="file" hidden onChange={e => pick(e.target.files)} aria-hidden tabIndex={-1} accept="image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading || disabled} aria-label={ts('pg.attach_a_file_up_to_size', 'Attach a file (up to {{size}})', { size: formatBytes(MAX_UPLOAD_BYTES) })} title={ts('pg.attach_a_file', 'Attach a file')} className="grid size-11 shrink-0 place-items-center rounded-full border-0" style={{ background: t.colors.bgAlt, color: t.colors.ink, cursor: 'pointer', opacity: uploading || disabled ? 0.5 : 1 }}>
              <Paperclip size={18} aria-hidden />
            </button>
            {onShareProduct && (
              <button type="button" onClick={onShareProduct} disabled={disabled} aria-label={ts('pg.share_a_product', 'Share a product')} title={ts('pg.share_a_product', 'Share a product')} className="grid size-11 shrink-0 place-items-center rounded-full border-0" style={{ background: t.colors.bgAlt, color: t.colors.ink, cursor: 'pointer', opacity: disabled ? 0.5 : 1 }}>
                <ShoppingBag size={18} aria-hidden />
              </button>
            )}
          </>
        )}
        <label htmlFor="maison-chat-input" className="sr-only">{ts('gift.message', 'Message')}</label>
        <textarea id="maison-chat-input" rows={1} value={text} onChange={e => { setText(e.target.value); onTyping(e.target.value.trim().length > 0); }} onKeyDown={onKey} onBlur={() => onTyping(false)}
          placeholder={editing ? ts('pg.edit_your_message', 'Edit your message') : ts('pg.write_a_message', 'Write a message')} disabled={disabled} className="max-h-32 min-h-11 flex-1 resize-none"
          style={{ padding: '11px 18px', borderRadius: 22, background: t.colors.bg, color: t.colors.ink, border: `1px solid ${t.colors.border}`, fontFamily: t.fonts.body, fontSize: 15, outline: 'none', fieldSizing: 'content' } as React.CSSProperties} />
        <button type="submit" disabled={!canSend} aria-label={editing ? ts('pg.save_message', 'Save message') : ts('sections.sendMessage', 'Send message')} className="grid size-11 shrink-0 place-items-center rounded-full border-0" style={{ background: t.colors.accent, color: t.colors.accentInk, cursor: canSend ? 'pointer' : 'not-allowed', opacity: canSend ? 1 : 0.4 }}>
          <SendHorizontal size={18} aria-hidden />
        </button>
      </div>
    </form>
  );
}
