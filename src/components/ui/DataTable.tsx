import type { ReactNode } from 'react';
import { PiCaretLeft, PiCaretRight } from 'react-icons/pi';
import { IconButton } from './Button';

export interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (row: T) => ReactNode;
  /** Kolom angka: rata kanan dengan angka tabular. */
  numeric?: boolean;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  /** Label aksi baris untuk pembaca layar, mis. "Buka detail jurnal". */
  rowActionLabel?: (item: T) => string;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  empty?: ReactNode;
  rowClassName?: (item: T) => string;
  label: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  rowActionLabel,
  page = 1,
  pageSize = 10,
  onPageChange,
  empty,
  rowClassName,
  label,
}: DataTableProps<T>) {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paginated = onPageChange ? data.slice((page - 1) * pageSize, page * pageSize) : data;

  return (
    <div>
      <div className="relative overflow-x-auto" role="region" aria-label={label} tabIndex={0}>
        <table className="tbl">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={String(col.key)} scope="col" className={`${col.numeric ? 'num' : ''} ${col.className ?? ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="!p-0">
                  {empty ?? <p className="px-4 py-10 text-center text-sm text-ink-3">Tidak ada data.</p>}
                </td>
              </tr>
            ) : (
              paginated.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  data-clickable={onRowClick ? '' : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick && rowActionLabel ? rowActionLabel(row) : undefined}
                  onClick={() => onRowClick?.(row)}
                  onKeyDown={(e) => {
                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      onRowClick(row);
                    }
                  }}
                  className={rowClassName ? rowClassName(row) : ''}
                >
                  {columns.map((col) => (
                    <td key={String(col.key)} className={`${col.numeric ? 'num' : ''} ${col.className ?? ''}`}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[String(col.key)] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && totalPages > 1 && (
        <nav
          aria-label="Halaman tabel"
          className="flex flex-col gap-3 border-t border-line px-4 py-3 text-[13px] text-ink-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="tabular-nums">
            {Math.min((page - 1) * pageSize + 1, data.length)}-{Math.min(page * pageSize, data.length)} dari {data.length}
          </p>
          <div className="flex items-center gap-1">
            <IconButton icon={PiCaretLeft} label="Halaman sebelumnya" onClick={() => onPageChange(page - 1)} disabled={page <= 1} />
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => onPageChange(p)}
                aria-current={p === page ? 'page' : undefined}
                className={`tap-target h-8 min-w-8 rounded-lg px-2 text-[13px] font-semibold tabular-nums transition-colors ${
                  p === page ? 'bg-ink text-white' : 'text-ink-2 hover:bg-neutral-soft'
                }`}
              >
                {p}
              </button>
            ))}
            <IconButton icon={PiCaretRight} label="Halaman berikutnya" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} />
          </div>
        </nav>
      )}
    </div>
  );
}
