import { type ReactNode } from 'react';
import { clsx } from 'clsx';
import { Pagination } from './Pagination';

export interface TableColumn<T = Record<string, unknown>> {
  key:     string;
  header:  string;
  render?: (row: T, index: number) => ReactNode;
  align?:  'left' | 'center' | 'right';
  width?:  string;
}

export interface TablePagination {
  page:     number;
  total:    number;
  perPage?: number;
  onChange: (page: number) => void;
  label?:   string;
}

interface TableProps<T = Record<string, unknown>> {
  columns:      TableColumn<T>[];
  data:         T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?:  (row: T) => void;
  pagination?:  TablePagination;
  className?:   string;
}

const TH =
  'text-left text-[11px] font-semibold text-slate uppercase tracking-[0.05em] ' +
  'px-4 py-[10px] whitespace-nowrap';

export function Table<T = Record<string, unknown>>({
  columns, data, keyExtractor, onRowClick, pagination, className,
}: TableProps<T>) {
  const perPage    = pagination?.perPage ?? 10;
  const start      = pagination ? (pagination.page - 1) * perPage + 1 : 1;
  const end        = pagination ? Math.min(pagination.page * perPage, pagination.total) : data.length;
  const label      = pagination?.label ?? 'items';

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-y border-bone bg-cream">
              {columns.map(col => (
                <th
                  key={col.key}
                  className={clsx(TH, col.align === 'right' && 'text-right', col.align === 'center' && 'text-center')}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr
                key={keyExtractor(row, i)}
                className={clsx(
                  i < data.length - 1 && 'border-b border-[#F0EEE6]',
                  onRowClick && 'cursor-pointer',
                  'transition-colors duration-100 hover:bg-cream',
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={clsx(
                      'px-4 py-[13px] text-carbon',
                      col.align === 'right'  && 'text-right',
                      col.align === 'center' && 'text-center',
                    )}
                  >
                    {col.render
                      ? col.render(row, i)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {pagination && pagination.total > 0 && (
        <div className="px-5 py-3 border-t border-bone flex items-center justify-between gap-4">
          <span className="text-[12px] text-slate whitespace-nowrap">
            Showing {start}–{end} of {pagination.total.toLocaleString()} {label}
          </span>
          <Pagination
            page={pagination.page}
            total={pagination.total}
            perPage={perPage}
            onChange={pagination.onChange}
          />
        </div>
      )}
    </div>
  );
}
