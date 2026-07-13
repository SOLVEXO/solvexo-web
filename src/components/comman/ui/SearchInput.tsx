import { Search } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchInputProps {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  'aria-label'?: string;
  className?:   string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', 'aria-label': ariaLabel, className }: SearchInputProps) {
  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-[7px] bg-white border border-bone rounded-lg',
      'transition-[border-color,box-shadow] duration-150 focus-within:border-brand-orange focus-within:ring-2 focus-within:ring-brand-orange/10',
      className,
    )}>
      <Search size={13} className="text-slate shrink-0" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel ?? placeholder}
        className="border-0 outline-none text-[13px] text-carbon placeholder:text-slate bg-transparent w-full min-w-[120px]"
      />
    </div>
  );
}
