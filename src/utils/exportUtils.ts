/**
 * Export utility untuk modul Hutang.
 * Mendukung Excel (.xlsx) via SheetJS dan PDF via jsPDF + jspdf-autotable.
 * Semua ekspor bersifat kontekstual: data + filter diteruskan dari caller.
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── Types ──────────────────────────────────────────────────────
export interface ExportColumn {
  header: string;
  key: string;
  isNumber?: boolean; // numerik agar bisa dihitung di Excel
  width?: number;     // karakter width untuk Excel
}

export interface ExportOptions {
  namaLaporan: string;
  namaPerusahaan?: string;
  proyek?: string;
  periode?: string;
  tanggalCetak?: string;
  filename: string; // tanpa ekstensi
}

type RowData = Record<string, string | number | null | undefined>;

// ── Helpers ────────────────────────────────────────────────────
function formatRupiah(n: number): string {
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatTanggalCetak(): string {
  return new Date().toLocaleDateString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function buildHeaderRows(opts: ExportOptions): string[][] {
  const rows: string[][] = [
    [opts.namaPerusahaan ?? 'PT Podo Rukun Nusantara'],
    [opts.namaLaporan],
  ];
  if (opts.proyek) rows.push([`Proyek: ${opts.proyek}`]);
  if (opts.periode) rows.push([`Periode: ${opts.periode}`]);
  rows.push([`Tanggal cetak: ${opts.tanggalCetak ?? formatTanggalCetak()}`]);
  rows.push([]); // blank row
  return rows;
}

// ── Excel Export ───────────────────────────────────────────────
export async function exportExcel(
  columns: ExportColumn[],
  data: RowData[],
  opts: ExportOptions
): Promise<void> {
  const wb = XLSX.utils.book_new();

  const ws_data: (string | number | null)[][] = [];

  // Header metadata
  const headerRows = buildHeaderRows(opts);
  headerRows.forEach((row) => ws_data.push(row));

  // Column headers
  ws_data.push(columns.map((c) => c.header));

  if (data.length === 0) {
    ws_data.push(['Tidak ada data sesuai filter yang diterapkan.']);
  } else {
    // Data rows
    data.forEach((row) => {
      ws_data.push(
        columns.map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined || val === '') return null;
          if (col.isNumber && typeof val === 'number') return val;
          if (col.isNumber && typeof val === 'string') return Number(val.replace(/\D/g, '')) || null;
          return String(val);
        })
      );
    });
  }

  const ws = XLSX.utils.aoa_to_sheet(ws_data);

  // Column widths
  const headerRowIdx = headerRows.length;
  ws['!cols'] = columns.map((c) => ({ wch: c.width ?? 20 }));

  // Bold header row
  columns.forEach((_, ci) => {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIdx, c: ci });
    if (ws[cellRef]) {
      ws[cellRef].s = { font: { bold: true }, fill: { fgColor: { rgb: 'E8EAED' } } };
    }
  });

  XLSX.utils.book_append_sheet(wb, ws, 'Data');
  XLSX.writeFile(wb, `${opts.filename}.xlsx`);
}

// ── PDF Export ─────────────────────────────────────────────────
export async function exportPDF(
  columns: ExportColumn[],
  data: RowData[],
  opts: ExportOptions
): Promise<void> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  // Header
  const headerLines = [
    opts.namaPerusahaan ?? 'PT Podo Rukun Nusantara',
    opts.namaLaporan,
    opts.proyek ? `Proyek: ${opts.proyek}` : null,
    opts.periode ? `Periode: ${opts.periode}` : null,
    `Tanggal cetak: ${opts.tanggalCetak ?? formatTanggalCetak()}`,
  ].filter(Boolean) as string[];

  let y = 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(headerLines[0], 15, y);
  y += 6;
  doc.setFontSize(10);
  headerLines.slice(1).forEach((line) => {
    doc.setFont('helvetica', line === headerLines[1] ? 'bold' : 'normal');
    doc.text(line, 15, y);
    y += 5;
  });

  // Table
  const head = [columns.map((c) => c.header)];
  const body = data.length === 0
    ? [['Tidak ada data sesuai filter yang diterapkan.']]
    : data.map((row) =>
        columns.map((col) => {
          const val = row[col.key];
          if (val === null || val === undefined) return '—';
          if (col.isNumber && typeof val === 'number') return formatRupiah(val);
          return String(val);
        })
      );

  autoTable(doc, {
    head,
    body,
    startY: y + 3,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 249, 250] },
    didDrawPage: (data) => {
      // Page number footer
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.text(
        `Halaman ${data.pageNumber} dari ${pageCount}`,
        doc.internal.pageSize.getWidth() - 15,
        pageHeight - 10,
        { align: 'right' }
      );
      // Repeat header on each page
      if (data.pageNumber > 1) {
        doc.setFontSize(8);
        doc.text(`${opts.namaLaporan} (lanjutan)`, 15, 10);
      }
    },
    margin: { top: y + 8 },
    tableWidth: 'auto',
  });

  doc.save(`${opts.filename}.pdf`);
}

// ── Convenience: build filename ────────────────────────────────
export function buildFilename(tab: string, proyek?: string, periode?: string): string {
  const parts = ['Hutang', tab];
  if (proyek) parts.push(proyek.replace(/\s+/g, '_'));
  if (periode) parts.push(periode.replace(/\s+/g, '_'));
  return parts.join('_');
}
