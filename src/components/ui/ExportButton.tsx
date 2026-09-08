import { useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportExcel, exportPDF, type ExportColumn, type ExportOptions } from '../../utils/exportUtils';

interface ExportButtonProps {
  getColumns: () => ExportColumn[];
  getData: () => Record<string, string | number | null | undefined>[];
  opts: Omit<ExportOptions, 'filename'> & { filenameBase: string };
  className?: string;
}

export default function ExportButton({ getColumns, getData, opts, className = '' }: ExportButtonProps) {
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handle = async (format: 'excel' | 'pdf') => {
    setLoading(format);
    setError(null);
    try {
      const columns = getColumns();
      const data = getData();
      const exportOpts: ExportOptions = {
        ...opts,
        filename: opts.filenameBase,
      };
      if (format === 'excel') {
        await exportExcel(columns, data, exportOpts);
      } else {
        await exportPDF(columns, data, exportOpts);
      }
    } catch (e) {
      setError('Gagal mengekspor. Coba lagi.');
      console.error(e);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {error && (
        <span className="text-xs text-red-500 mr-1">{error}</span>
      )}
      <button
        onClick={() => handle('excel')}
        disabled={loading !== null}
        title="Export Excel"
        className="flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-emerald-800 disabled:opacity-50 transition-colors"
      >
        {loading === 'excel' ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <FileSpreadsheet className="h-4 w-4 text-white" />
        )}
        Excel
      </button>
      <button
        onClick={() => handle('pdf')}
        disabled={loading !== null}
        title="Export PDF"
        className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-800 disabled:opacity-50 transition-colors"
      >
        {loading === 'pdf' ? (
          <Loader2 className="h-4 w-4 animate-spin text-white" />
        ) : (
          <FileText className="h-4 w-4 text-white" />
        )}
        PDF
      </button>
      {loading && (
        <span className="text-xs text-gray-400 ml-1">Mengekspor...</span>
      )}
    </div>
  );
}
