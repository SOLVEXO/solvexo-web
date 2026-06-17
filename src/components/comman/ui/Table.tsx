import { type ReactNode } from 'react';
import { clsx } from 'clsx';

export interface TableColumn<T = Record<string, unknown>> {
  key:     string;
  header:  string;
  render?: (row: T, index: number) => ReactNode;
  align?:  'left' | 'center' | 'right';
  width?:  string;
}

interface TableProps<T = Record<string, unknown>> {
  columns:      TableColumn<T>[];
  data:         T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?:  (row: T) => void;
  className?:   string;
}

const TH =
  'text-left text-[11px] font-semibold text-slate uppercase tracking-[0.05em] ' +
  'px-[18px] py-[10px]';

export function Table<T = Record<string, unknown>>({
  columns, data, keyExtractor, onRowClick, className,
}: TableProps<T>) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
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
                i < data.length - 1 && 'border-b border-[#F5F4EF]',
                onRowClick && 'cursor-pointer',
                'transition-colors duration-100 hover:bg-cream',
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map(col => (
                <td
                  key={col.key}
                  className={clsx(
                    'px-[18px] py-[11px] text-carbon',
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
  );
}
