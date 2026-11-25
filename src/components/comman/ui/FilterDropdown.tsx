import { Select } from './Dropdown';

interface FilterOption {
  value: string;
  label: string;
}

interface FilterDropdownProps {
  options:      FilterOption[];
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  className?:   string;
  ariaLabel?:   string;
}

/** Compact dropdown for filter bars: the same dropdown as everywhere else, in its toolbar size. */
export function FilterDropdown({ options, value, onChange, placeholder, className, ariaLabel }: FilterDropdownProps) {
  return (
    <Select
      variant="filter"
      wrapperClassName={className}
      aria-label={ariaLabel ?? placeholder}
      value={value}
      onValueChange={onChange}
      options={placeholder ? [{ value: '', label: placeholder }, ...options] : options}
    />
  );
}
