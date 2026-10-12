import { useEffect, useState } from 'react';
import Button from '../../components/ui/Button';
import { fetchApi } from '../../lib/api';

interface Attachment { id: string; nama: string }
export interface LegalExportBlock { text: string; heading?: boolean }
const download = (blob: Blob, name: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = name; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export default function LegalExports({ id, nomor, blocks }: { id: string; nomor: string; blocks: LegalExportBlock[] }) {
  const [files, setFiles] = useState<Attachment[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const load = async () => {
    const res = await fetchApi(`/lampiran?entityType=dokumen&entityId=${id}`);
    const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal memuat scan');
    setFiles(body.data || []);
  };
  useEffect(() => { void load().catch((err: Error) => setError(err.message)); }, [id]);
  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError('');
    try { await action(); } catch (err) { setError(err instanceof Error ? err.message : 'Gagal memproses dokumen'); }
    finally { setBusy(false); }
  };
  const filename = nomor.replace(/[^a-zA-Z0-9_-]/g, '-');
  const word = () => run(async () => {
    const { Document, Paragraph, TextRun, Packer } = await import('docx');
    const doc = new Document({ sections: [{ children: blocks.flatMap((block) => block.text.split('\n').map((text) => new Paragraph({
      children: [new TextRun({ text, bold: Boolean(block.heading), font: 'Arial', size: block.heading ? 26 : 22 })],
      spacing: { after: 160 },
    }))) }] });
    download(await Packer.toBlob(doc), filename + '.docx');
  });
  const pdf = () => run(async () => {
    const { jsPDF } = await import('jspdf'); const doc = new jsPDF(); let y = 20;
    for (const block of blocks) {
      doc.setFont('helvetica', block.heading ? 'bold' : 'normal'); doc.setFontSize(block.heading ? 12 : 10);
      const lines = doc.splitTextToSize(block.text, 170) as string[];
      for (const line of lines) { if (y > 275) { doc.addPage(); y = 20; } doc.text(line, 20, y); y += 6; }
      y += 4;
    }
    doc.save(filename + '.pdf');
  });
  return <section>
    <h3 className="mb-3 text-sm font-semibold text-ink">Ekspor dan scan bertanda tangan</h3>
    {error && <p role="alert" className="mb-3 text-red-600">{error}</p>}
    <div className="flex flex-wrap gap-3"><Button disabled={busy} onClick={() => void pdf()}>Unduh PDF</Button><Button disabled={busy} onClick={() => void word()}>Unduh Word</Button></div>
    <label className="mt-4 block"><span className="field-label">Unggah scan bertanda tangan</span><input type="file" disabled={busy} accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => {
      const file = e.target.files?.[0]; if (!file) return;
      e.currentTarget.value = '';
      void run(async () => {
        const data = new FormData(); data.append('file', file);
        const res = await fetchApi(`/lampiran?entityType=dokumen&entityId=${id}`, { method: 'POST', body: data });
        const body = await res.json(); if (!res.ok) throw new Error(body.message || 'Gagal mengunggah scan');
        await load();
      });
    }} /><span className="mt-1 block text-sm text-ink-3">PDF, JPG, PNG, atau WEBP; maksimal 10 MB.</span></label>
    <ul className="mt-3 space-y-2">{files.map((file) => <li key={file.id}><Button disabled={busy} onClick={() => void run(async () => {
      const res = await fetchApi(`/lampiran/${file.id}/unduh`); if (!res.ok) throw new Error('Gagal mengunduh scan');
      download(await res.blob(), file.nama);
    })}>{file.nama}</Button></li>)}</ul>
    {busy && <p role="status" className="mt-2 text-sm text-ink-3">Memproses dokumen…</p>}
  </section>;
}
