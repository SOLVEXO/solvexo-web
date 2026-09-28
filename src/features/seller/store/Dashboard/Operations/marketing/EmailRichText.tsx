import { useEffect, useRef } from 'react';
import { Bold, Italic, Underline, Link2, List, ListOrdered, Unlink } from 'lucide-react';

const TOOLS = [
  { label: 'Bold', Icon: Bold, command: 'bold' },
  { label: 'Italic', Icon: Italic, command: 'italic' },
  { label: 'Underline', Icon: Underline, command: 'underline' },
  { label: 'Add link', Icon: Link2, command: 'createLink' },
  { label: 'Remove link', Icon: Unlink, command: 'unlink' },
  { label: 'Bulleted list', Icon: List, command: 'insertUnorderedList' },
  { label: 'Numbered list', Icon: ListOrdered, command: 'insertOrderedList' },
];

/** Minimal rich-text field for email text blocks (bold/italic/underline,
 *  links, lists). Output is sanitized again by `sanitizeRichText` when the
 *  email is rendered, so whatever the browser produces here is safe. */
export function EmailRichText({ value, onChange, placeholder }: { value: string; onChange: (html: string) => void; placeholder?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  // Only push `value` into the DOM when it differs from what's there —
  // rewriting innerHTML on every keystroke would reset the caret.
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  const run = (command: string) => {
    let arg: string | undefined;
    if (command === 'createLink') {
      const url = window.prompt('Link URL (https://…)');
      if (!url) return;
      arg = url.trim();
    }
    const el = ref.current;
    el?.focus();
    document.execCommand(command, false, arg);
    if (el) onChange(el.innerHTML);
  };

  return (
    <div className="border border-bone rounded-lg bg-white focus-within:border-brand-orange/50 focus-within:ring-2 focus-within:ring-brand-orange/20">
      <div className="flex items-center gap-0.5 px-1.5 py-1 border-b border-bone">
        {TOOLS.map(({ label, Icon, command }) => (
          <button
            key={command}
            type="button"
            aria-label={label}
            title={label}
            onMouseDown={e => e.preventDefault()}
            onClick={() => run(command)}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-transparent border-none cursor-pointer text-charcoal hover:bg-mist"
          >
            <Icon size={14} />
          </button>
        ))}
      </div>
      <div
        ref={ref}
        role="textbox"
        aria-multiline="true"
        aria-label="Text"
        tabIndex={0}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={e => onChange((e.target as HTMLDivElement).innerHTML)}
        onBlur={e => onChange((e.target as HTMLDivElement).innerHTML)}
        className="min-h-[110px] max-h-[320px] overflow-y-auto px-3 py-2 text-[13px] text-charcoal outline-none [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_a]:text-brand-orange [&_a]:underline empty:before:content-[attr(data-placeholder)] empty:before:text-slate"
      />
    </div>
  );
}
