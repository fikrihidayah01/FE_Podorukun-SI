import { useState, useRef, useEffect } from 'react';
import { PiMicrosoftExcelLogo, PiFilePdf, PiCircleNotch, PiCaretDown } from 'react-icons/pi';
import { exportExcel, exportPDF, type ExportColumn, type ExportOptions } from '../../utils/exportUtils';
<<<<<<< HEAD
import { errorMessage } from '../../lib/errors';
=======
import { showToast } from '../../store/toastStore';
>>>>>>> f0bc659 (feat: update halaman keuangan)

interface ExportButtonProps {
  getColumns: () => ExportColumn[];
  getData: () => Record<string, string | number | null | undefined>[];
  opts: Omit<ExportOptions, 'filename'> & { filenameBase: string };
  className?: string;
}

/**
 * Dropdown button untuk Ekspor Excel dan PDF.
 * Format: [ Tombol "Export" + Caret Down ] -> [ Menu: Excel (hijau) | PDF (merah) ]
 * Lebar tombol trigger dan menu dropdown disamakan secara presisi (w-[150px] dan w-full).
 */
export default function ExportButton({ getColumns, getData, opts, className = '' }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState<'excel' | 'pdf' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup menu dropdown saat klik di luar atau menekan tombol Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handle = async (format: 'excel' | 'pdf') => {
    setIsOpen(false);
    setLoading(format);
    setError(null);
    try {
      const exportOpts: ExportOptions = { ...opts, filename: opts.filenameBase };
      if (format === 'excel') {
        await exportExcel(getColumns(), getData(), exportOpts);
        showToast.success('File Excel berhasil diunduh');
      } else {
        await exportPDF(getColumns(), getData(), exportOpts);
        showToast.success('File PDF berhasil diunduh');
      }
    } catch (e) {
<<<<<<< HEAD
      setError(`Ekspor gagal: ${errorMessage(e, 'alasan tidak diketahui')}. Coba lagi.`);
=======
      setError('Ekspor gagal. Coba lagi.');
      showToast.error('Ekspor data gagal');
>>>>>>> f0bc659 (feat: update halaman keuangan)
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

      <div ref={containerRef} className="relative">
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          disabled={loading !== null}
          aria-haspopup="true"
          aria-expanded={isOpen}
          aria-label="Menu Ekspor"
          className="tap-target group inline-flex h-10 w-[150px] cursor-pointer items-center justify-center gap-2 rounded-full border border-[#cf1b1a] bg-white px-4 text-sm font-semibold text-ink shadow-xs transition-colors hover:border-[#b81817] hover:bg-rose-50/40 active:bg-rose-100/50 disabled:pointer-events-none disabled:opacity-50"
        >
          {loading !== null ? (
            <PiCircleNotch className="h-4 w-4 shrink-0 animate-spin text-[#cf1b1a]" aria-hidden />
          ) : null}
          <span>Export</span>
          <PiCaretDown
            className={`h-3.5 w-3.5 shrink-0 text-[#cf1b1a] transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="menu"
            aria-orientation="vertical"
            className="absolute left-0 top-full z-40 mt-1.5 w-full rounded-xl border border-line bg-white p-1.5 shadow-lg ring-1 ring-black/5"
          >
            {/* Option: Excel */}
            <button
              type="button"
              role="menuitem"
              onClick={() => void handle('excel')}
              disabled={loading !== null}
              className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 active:bg-emerald-100 disabled:pointer-events-none disabled:opacity-50"
            >
              <PiMicrosoftExcelLogo
                className="h-4 w-4 shrink-0 text-emerald-700 transition-transform duration-100 group-hover:scale-110"
                aria-hidden
              />
              <span>Excel</span>
            </button>

            {/* Divider */}
            <div className="my-1 h-px bg-line/80" aria-hidden />

            {/* Option: PDF */}
            <button
              type="button"
              role="menuitem"
              onClick={() => void handle('pdf')}
              disabled={loading !== null}
              className="group flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-semibold text-[#cf1b1a] transition-colors hover:bg-rose-50 active:bg-rose-100 disabled:pointer-events-none disabled:opacity-50"
            >
              <PiFilePdf
                className="h-4 w-4 shrink-0 text-[#cf1b1a] transition-transform duration-100 group-hover:scale-110"
                aria-hidden
              />
              <span>PDF</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
