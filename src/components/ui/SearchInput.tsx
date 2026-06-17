import { Search } from 'lucide-react';
import { clsx } from 'clsx';

interface SearchInputProps {
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  className?:   string;
}

export function SearchInput({ value, onChange, placeholder = 'Search…', className }: SearchInputProps) {
  return (
    <div className={clsx(
      'flex items-center gap-2 px-3 py-[7px] bg-white border border-bone rounded-lg',
      className,
    )}>
      <Search size={13} className="text-slate shrink-0" />
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="border-0 outline-none text-[13px] text-carbon placeholder:text-slate bg-transparent w-full min-w-[120px]"
      />
    </div>
  );
}
