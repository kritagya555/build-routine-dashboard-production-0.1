import { cn } from '@/utils/cn';
import { ReactNode } from 'react';

interface Column<T> {
  key: string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No data available',
  onRowClick,
  className
}: DataTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className={cn('bg-white border border-slate-200 rounded-lg p-8 text-center', className)}>
        <p className="text-sm text-slate-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden border border-slate-200 rounded-lg', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500',
                  column.width,
                  column.className
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((item, index) => (
            <tr
              key={keyExtractor(item, index)}
              className={cn(
                'hover:bg-slate-50 transition-colors duration-150',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={cn(
                    'px-4 py-3 text-sm text-slate-600',
                    column.width,
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(item, index)
                    : (item[column.key] as ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
