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
        icon={PiMicrosoftExcelLogo}
        loading={loading === 'excel'}
        disabled={loading !== null}
        onClick={() => handle('excel')}
      >
        Excel
      </Button>
      <Button icon={PiFilePdf} loading={loading === 'pdf'} disabled={loading !== null} onClick={() => handle('pdf')}>
        PDF
      </Button>
    </div>
  );
}
