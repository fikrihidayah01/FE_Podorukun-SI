import { useState } from 'react';
import { PiMicrosoftExcelLogo, PiFilePdf, PiCircleNotch } from 'react-icons/pi';
import { exportExcel, exportPDF, type ExportColumn, type ExportOptions } from '../../utils/exportUtils';

interface ExportButtonProps {
  getColumns: () => ExportColumn[];
  getData: () => Record<string, string | number | null | undefined>[];
  opts: Omit<ExportOptions, 'filename'> & { filenameBase: string };
  className?: string;
}

/**
 * Segmented pill button untuk Ekspor Excel dan PDF sesuai desain terpadu.
 * Format: [ Red accent | Export | Excel (hijau) | PDF (merah) ]
 */
export default function ExportButton({ getColumns, getData, opts, className = '' }: ExportButtonProps) {
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (format: 'excel' | 'pdf') => {
    setLoading(format);
    setError(null);
    try {
      const exportOpts: ExportOptions = { ...opts, filename: opts.filenameBase };
      if (format === 'excel') await exportExcel(getColumns(), getData(), exportOpts);
      else await exportPDF(getColumns(), getData(), exportOpts);
    } catch (e) {
      setError('Ekspor gagal. Coba lagi.');
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {error && (
        <span role="alert" className="text-xs font-medium text-danger">
          {error}
        </span>
      )}
      <div
        role="group"
        aria-label="Ekspor data"
        className="ml-1.5 inline-flex h-10 items-stretch overflow-hidden rounded-l-[20px] rounded-r-[20px] border border-line bg-white shadow-[-5px_0_0_0_#cf1b1a] transition-shadow hover:shadow-[-6px_0_0_0_#b81817]"
      >
        {/* Label: Export */}
        <span className="flex select-none items-center pl-4 pr-3.5 text-sm font-semibold tracking-tight text-ink">
          Export
        </span>

        {/* Divider 1 */}
        <div className="w-px self-stretch bg-line" aria-hidden />

        {/* Action: Excel */}
        <button
          type="button"
          onClick={() => handle('excel')}
          disabled={loading !== null}
          aria-label="Ekspor ke Excel"
          className="group flex cursor-pointer items-center gap-2 px-4 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50/70 active:bg-emerald-100/70 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading === 'excel' ? (
            <PiCircleNotch className="h-4 w-4 shrink-0 animate-spin text-emerald-700" aria-hidden />
          ) : (
            <PiMicrosoftExcelLogo className="h-4 w-4 shrink-0 text-emerald-700 transition-transform duration-100 group-hover:scale-105" aria-hidden />
          )}
          <span>Excel</span>
        </button>

        {/* Divider 2 */}
        <div className="w-px self-stretch bg-line" aria-hidden />

        {/* Action: PDF */}
        <button
          type="button"
          onClick={() => handle('pdf')}
          disabled={loading !== null}
          aria-label="Ekspor ke PDF"
          className="group flex cursor-pointer items-center gap-2 pl-4 pr-5 text-sm font-semibold text-[#cf1b1a] transition-colors hover:bg-rose-50/70 active:bg-rose-100/70 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading === 'pdf' ? (
            <PiCircleNotch className="h-4 w-4 shrink-0 animate-spin text-[#cf1b1a]" aria-hidden />
          ) : (
            <PiFilePdf className="h-4 w-4 shrink-0 text-[#cf1b1a] transition-transform duration-100 group-hover:scale-105" aria-hidden />
          )}
          <span>PDF</span>
        </button>
      </div>
    </div>
  );
}
