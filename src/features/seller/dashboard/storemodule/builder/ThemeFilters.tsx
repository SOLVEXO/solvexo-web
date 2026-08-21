import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { THEME_CATALOG_CATEGORIES, THEME_CATALOG_CATEGORY_LABELS, type ThemeCatalogCategory } from '@/api/services/themeCatalog';

const CATEGORY_OPTIONS: { value: ThemeCatalogCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  ...THEME_CATALOG_CATEGORIES.map(value => ({ value, label: THEME_CATALOG_CATEGORY_LABELS[value] })),
];

/** Category row + search box, filtering the already-fetched theme list
 *  client-side (the initial fetch already narrows to `status: 'published'`
 *  server-side — this is just gallery-local refinement). */
export function ThemeFilters({ category, onCategoryChange, search, onSearchChange }: {
  category: ThemeCatalogCategory | 'all';
  onCategoryChange: (c: ThemeCatalogCategory | 'all') => void;
  search: string;
  onSearchChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
        {CATEGORY_OPTIONS.map(c => (
          <button
            key={c.value}
            type="button"
            onClick={() => onCategoryChange(c.value)}
            className={clsx(
              'shrink-0 px-3 py-[7px] rounded-full text-[12px] font-semibold border cursor-pointer transition-colors whitespace-nowrap',
              category === c.value ? 'border-brand-orange bg-brand-orange text-white' : 'border-bone bg-white text-charcoal hover:bg-cream',
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="relative sm:ml-auto sm:w-[220px] shrink-0">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search themes..."
          aria-label="Search themes"
          className="w-full pl-8 pr-3 py-[8px] text-[12.5px] border border-bone rounded-full bg-white focus:outline-none focus:border-brand-orange/50"
        />
      </div>
    </div>
  );
}
