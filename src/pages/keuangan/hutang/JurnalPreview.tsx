import Money from '../../../components/ui/Money';

export interface JurnalPreviewRow {
  akun: string;
  debit?: number;
  kredit?: number;
}

/** Pratinjau baris jurnal yang akan dibuat sebelum pengguna menyimpan. */
export default function JurnalPreview({ rows, title = 'Pratinjau jurnal' }: { rows: JurnalPreviewRow[]; title?: string }) {
  const totalDebit = rows.reduce((s, r) => s + (r.debit ?? 0), 0);
  const totalKredit = rows.reduce((s, r) => s + (r.kredit ?? 0), 0);
  const cell = (n?: number) => (n ? <Money value={n} /> : <span className="text-ink-3">-</span>);

  return (
    <section>
      <h3 className="mb-2 text-sm font-semibold text-ink">{title}</h3>
      <div className="relative overflow-x-auto rounded-lg border border-line">
        <table className="tbl tbl-compact">
          <thead>
            <tr>
              <th scope="col">Akun</th>
              <th scope="col" className="num">Debit</th>
              <th scope="col" className="num">Kredit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={`${r.akun}-${i}`}>
                <td className={r.kredit ? 'pl-8 text-ink-2' : 'text-ink'}>{r.akun}</td>
                <td className="num">{r.debit !== undefined ? cell(r.debit) : <span className="text-ink-3">-</span>}</td>
                <td className="num">{r.kredit !== undefined ? cell(r.kredit) : <span className="text-ink-3">-</span>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>Total</td>
              <td className="num"><Money value={totalDebit} /></td>
              <td className="num"><Money value={totalKredit} /></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
