import { useState } from 'react';
import { PiMicrosoftExcelLogo, PiFilePdf } from 'react-icons/pi';
import { exportExcel, exportPDF, type ExportColumn, type ExportOptions } from '../../utils/exportUtils';
import Button from './Button';

interface ExportButtonProps {
  getColumns: () => ExportColumn[];
  getData: () => Record<string, string | number | null | undefined>[];
  opts: Omit<ExportOptions, 'filename'> & { filenameBase: string };
  className?: string;
}

/** Ekspor tabel yang sedang tampil (dengan filter aktif) ke Excel atau PDF. */
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
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label="Ekspor data">
      {error && (
        <span role="alert" className="text-xs font-medium text-danger">
          {error}
        </span>
      )}
      <Button
        loading={loading === 'excel'}
        disabled={loading !== null}
        onClick={() => handle('excel')}
        className="!bg-emerald-700 !text-white border border-white/30 shadow-[4px_4px_8px_rgba(0,0,0,0.18),-4px_-4px_8px_rgba(255,255,255,0.9)] hover:!bg-emerald-800"
      >
        <PiMicrosoftExcelLogo className="h-4 w-4 shrink-0 text-white" aria-hidden />
        Excel
      </Button>
      <Button
        loading={loading === 'pdf'}
        disabled={loading !== null}
        onClick={() => handle('pdf')}
        className="!bg-rose-700 !text-white border border-white/30 shadow-[4px_4px_8px_rgba(0,0,0,0.18),-4px_-4px_8px_rgba(255,255,255,0.9)] hover:!bg-rose-800"
      >
        <PiFilePdf className="h-4 w-4 shrink-0 text-white" aria-hidden />
        PDF
      </Button>
    </div>
  );
}
