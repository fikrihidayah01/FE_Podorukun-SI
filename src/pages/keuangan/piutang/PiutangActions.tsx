import { useState, useRef, useEffect } from 'react';
import {
  PiDotsThreeVertical,
  PiReceipt,
  PiCheckCircle,
  PiHandCoins,
  PiPercent,
  PiXCircle,
  PiProhibit,
} from 'react-icons/pi';
import { fetchApi } from '../../../lib/api';
import { usePiutangStore, type KavlingTagihan } from '../../../store/piutangStore';
import { useCoaStore } from '../../../store/coaStore';
import Button from '../../../components/ui/Button';
import Modal from '../../../components/ui/Modal';
import TagihanModal from './TagihanModal';

export default function PiutangActions({ item }: { item: KavlingTagihan }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [action, setAction] = useState('');
  const [tanggal, setTanggal] = useState(new Date().toISOString().slice(0, 10));
  const [nominal, setNominal] = useState('0');
  const [alasan, setAlasan] = useState('');
  const [akunKasId, setAkunKasId] = useState('');
  const [noBukti, setNoBukti] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tagihanOpen, setTagihanOpen] = useState(false);

  const akuns = useCoaStore((s) => s.items);

  const labels: Record<string, string> = {
    bast: 'Catat BAST',
    batal: 'Batalkan penjualan',
    cashback: 'Cashback KPR',
    admin: 'Admin KPR',
  };

  // Close menu when clicking outside, scrolling, or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    const handleScrollOrResize = () => {
      setMenuOpen(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [menuOpen]);

  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!menuOpen) {
      const rect = e.currentTarget.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < 250 && rect.top > 250;
      setMenuPos({
        top: openUp ? undefined : rect.bottom + 6,
        bottom: openUp ? window.innerHeight - rect.top + 6 : undefined,
        right: Math.max(12, window.innerWidth - rect.right),
      });
      setMenuOpen(true);
    } else {
      setMenuOpen(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError('');
    try {
      const kpr = ['cashback', 'admin'].includes(action);
      const payload =
        action === 'bast'
          ? { tanggal, nilaiHpp: Number(nominal) }
          : action === 'batal'
          ? { tanggal, potongan: Number(nominal), alasan }
          : { jenis: action, tanggal, nominal: Number(nominal), akunKasId, noBukti };
      const res = await fetchApi(`/piutang/${item.id}/${kpr ? 'biaya-kpr' : action}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.message || 'Gagal menyimpan');
      await usePiutangStore.getState().fetchItems();
      setAction('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan');
    } finally {
      setBusy(false);
    }
  };

  const handleActionClick = (key: string) => {
    setMenuOpen(false);
    setAction(key);
    setError('');
    setNominal('0');
    void useCoaStore.getState().fetch();
  };

  return (
    <div
      ref={menuRef}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      className="relative inline-block text-left"
    >
      {/* Kebab trigger button */}
      <button
        type="button"
        onClick={toggleMenu}
        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg text-white transition-all cursor-pointer shadow-xs active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-orange-500/50 ${
          menuOpen
            ? 'bg-orange-700 ring-2 ring-orange-500/30'
            : 'bg-orange-500 hover:bg-orange-600'
        }`}
        aria-label={`Menu aksi tagihan ${item.namaUser}`}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        title="Menu aksi"
      >
        <PiDotsThreeVertical className="h-4 w-4" />
      </button>

      {/* Kebab dropdown menu */}
      {menuOpen && menuPos && (
        <div
          style={{
            position: 'fixed',
            top: menuPos.top,
            bottom: menuPos.bottom,
            right: menuPos.right,
          }}
          className="z-50 min-w-[210px] rounded-xl border border-line bg-white p-1.5 shadow-xl"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Action: Tagihan */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setTagihanOpen(true);
            }}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-ink transition hover:bg-subtle"
            role="menuitem"
          >
            <PiReceipt className="h-4 w-4 text-ink-2 shrink-0" />
            <span>Kelola Tagihan</span>
          </button>

          {item.status !== 'batal' && (
            <>
              {/* Action: BAST */}
              <button
                type="button"
                onClick={() => handleActionClick('bast')}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-ink transition hover:bg-subtle"
                role="menuitem"
              >
                <PiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Catat BAST</span>
              </button>

              {/* Actions: KPR (Cashback & Admin) */}
              <button
                type="button"
                onClick={() => handleActionClick('cashback')}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-ink transition hover:bg-subtle"
                role="menuitem"
              >
                <PiHandCoins className="h-4 w-4 text-amber-600 shrink-0" />
                <span>Cashback KPR</span>
              </button>
              <button
                type="button"
                onClick={() => handleActionClick('admin')}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-ink transition hover:bg-subtle"
                role="menuitem"
              >
                <PiPercent className="h-4 w-4 text-blue-600 shrink-0" />
                <span>Admin KPR</span>
              </button>

              {/* Action: Batalkan Penjualan */}
              <div className="my-1 border-t border-line" />
              <button
                type="button"
                onClick={() => handleActionClick('batal')}
                className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-medium text-danger transition hover:bg-danger-soft"
                role="menuitem"
              >
                <PiXCircle className="h-4 w-4 shrink-0" />
                <span>Batalkan Penjualan</span>
              </button>
            </>
          )}

          {/* Status jika dibatalkan */}
          {item.status === 'batal' && (
            <>
              <div className="my-1 border-t border-line" />
              <div className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-ink-3">
                <PiProhibit className="h-3.5 w-3.5 text-danger shrink-0" />
                <span>Status: Dibatalkan</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Action modal */}
      <Modal
        isOpen={Boolean(action)}
        onClose={() => {
          if (!busy) setAction('');
        }}
        title={labels[action] || ''}
        footer={
          <>
            <Button disabled={busy} onClick={() => setAction('')}>
              Batal
            </Button>
            <Button
              variant={action === 'batal' ? 'danger' : 'primary'}
              disabled={busy}
              onClick={() => void submit()}
            >
              {busy ? 'Menyimpan…' : 'Konfirmasi'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="text-red-600">
              {error}
            </p>
          )}
          <label className="block">
            Tanggal
            <input
              className="control"
              type="date"
              required
              value={tanggal}
              onChange={(e) => setTanggal(e.target.value)}
            />
          </label>
          <label className="block">
            {action === 'bast'
              ? 'Nilai HPP'
              : action === 'batal'
              ? 'Potongan pengembalian'
              : 'Nominal'}
            <input
              className="control"
              type="number"
              min="0"
              step="0.01"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
            />
          </label>
          {action === 'batal' && (
            <>
              <p className="text-xs text-ink-3">
                Penjualan dibatalkan dan sisa pembayaran menjadi hutang pengembalian sesuai pembukuan.
              </p>
              <label className="block">
                Alasan
                <textarea
                  className="control"
                  rows={2}
                  value={alasan}
                  onChange={(e) => setAlasan(e.target.value)}
                />
              </label>
            </>
          )}
          {['cashback', 'admin'].includes(action) && (
            <>
              <label className="block">
                Akun kas/bank
                <select
                  className="control"
                  value={akunKasId}
                  onChange={(e) => setAkunKasId(e.target.value)}
                >
                  <option value="">Pilih akun</option>
                  {akuns
                    .filter((a) => a.isKasBank && a.status === 'aktif')
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.kodeAkun} — {a.namaAkun}
                      </option>
                    ))}
                </select>
              </label>
              <label className="block">
                No. bukti
                <input
                  className="control"
                  value={noBukti}
                  onChange={(e) => setNoBukti(e.target.value)}
                />
              </label>
              <p className="text-xs text-ink-3">
                Setelah disimpan, unggah bukti dan posting melalui Jurnal Umum.
              </p>
            </>
          )}
        </div>
      </Modal>

      {/* Tagihan modal */}
      {tagihanOpen && (
        <TagihanModal
          item={item}
          isOpen={tagihanOpen}
          onClose={() => setTagihanOpen(false)}
        />
      )}
    </div>
  );
}
