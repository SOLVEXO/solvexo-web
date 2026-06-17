import { useState } from 'react';
import { clsx } from 'clsx';

interface TagInputProps {
  tags:         string[];
  onChange:     (tags: string[]) => void;
  placeholder?: string;
  max?:         number;
  className?:   string;
}

export function TagInput({ tags, onChange, placeholder = 'Add tag, press Enter', max, className }: TagInputProps) {
  const [input, setInput] = useState('');

  const add = () => {
    const v = input.replace(',', '').trim();
    if (v && !tags.includes(v) && (!max || tags.length < max)) {
      onChange([...tags, v]);
    }
    setInput('');
  };

  const remove = (i: number) => onChange(tags.filter((_, idx) => idx !== i));

  return (
    <div className={clsx(
      'flex flex-wrap gap-[5px] items-center px-[10px] py-[6px]',
      'border border-bone rounded-lg bg-white min-h-[40px]',
      className,
    )}>
      {tags.map((t, i) => (
        <span
          key={i}
          className="flex items-center gap-1 bg-cream border border-bone rounded-md px-2 py-[2px] text-[12px] text-carbon"
        >
          {t}
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-slate hover:text-carbon text-[14px] leading-none border-0 bg-transparent cursor-pointer p-0"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={e => setInput(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(); }
          if (e.key === 'Backspace' && !input && tags.length) remove(tags.length - 1);
        }}
        placeholder={tags.length === 0 ? placeholder : ''}
        className="flex-1 min-w-[80px] border-0 outline-none text-[12px] text-carbon placeholder:text-slate bg-transparent"
      />
    </div>
  );
}
