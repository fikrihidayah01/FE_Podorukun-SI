import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import toast, { Toaster, type Toast } from 'react-hot-toast';
import type { IconType } from 'react-icons';
import { PiCheckCircle, PiInfo, PiWarning, PiWarningCircle, PiX } from 'react-icons/pi';
import Button from './ui/Button';
import { subscribeNotices, type Notice, type NoticeTone } from '../lib/errors';

const TONE: Record<NoticeTone, { Icon: IconType; icon: string; bar: string; badge: string }> = {
  error: { Icon: PiWarningCircle, icon: 'text-danger', bar: 'bg-danger', badge: 'bg-danger-soft' },
  warning: { Icon: PiWarning, icon: 'text-warning', bar: 'bg-warning', badge: 'bg-warning-soft' },
  success: { Icon: PiCheckCircle, icon: 'text-positive', bar: 'bg-positive', badge: 'bg-positive-soft' },
  info: { Icon: PiInfo, icon: 'text-brand-600', bar: 'bg-brand-600', badge: 'bg-brand-50' },
};

function Reference({ value }: { value: string }) {
  return (
    <p className="mt-2 text-xs text-ink-3">
      Kode referensi: <span className="select-all font-mono text-ink-2">{value}</span>
    </p>
  );
}

/** Toast: kartu yang lewat sebentar di tengah atas, di atas semua lapisan termasuk dialog. */
function ToastCard({ t, notice }: { t: Toast; notice: Notice }) {
  const tone = TONE[notice.tone];
  return (
    <div
      role={notice.tone === 'error' ? 'alert' : 'status'}
      className={`pointer-events-auto relative flex w-[min(30rem,calc(100vw-2rem))] items-start gap-3 overflow-hidden rounded-xl border border-line bg-surface py-3.5 pl-5 pr-3 shadow-pop transition-all duration-200 ${
        t.visible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      <span className={`absolute inset-y-0 left-0 w-1 ${tone.bar}`} aria-hidden />
      <tone.Icon className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`} aria-hidden />
      <div className="min-w-0 flex-1 text-sm leading-relaxed">
        <p className="font-semibold text-ink">{notice.title}</p>
        {notice.lines.length > 0 && (
          <ul className="mt-1 space-y-0.5 text-ink-2">
            {notice.lines.map((line) => <li key={line}>{line}</li>)}
          </ul>
        )}
        {notice.reference && <Reference value={notice.reference} />}
      </div>
      <button
        type="button"
        onClick={() => toast.dismiss(t.id)}
        className="-mr-1 shrink-0 rounded-lg p-1 text-ink-3 hover:bg-neutral-soft hover:text-ink"
        aria-label="Tutup notifikasi"
      >
        <PiX className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}

/** Popup: menutupi layar dan hanya tertutup lewat tombol konfirmasi (atau Escape/Enter). */
function Popup({ notice, onConfirm }: { notice: Notice; onConfirm: () => void }) {
  const tone = TONE[notice.tone];
  const titleId = useId();
  const descId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const confirmRef = useRef(onConfirm);

  useEffect(() => {
    confirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); confirmRef.current(); }
      // Fokus tetap pada satu-satunya tombol.
      if (e.key === 'Tab') { e.preventDefault(); buttonRef.current?.focus(); }
    };
    // capture: popup selalu paling atas, jadi Escape tidak boleh menutup dialog di bawahnya
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true);
      previouslyFocused?.focus?.();
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4">
      <div className="absolute inset-0 animate-fade-in bg-ink/50" aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="relative w-full max-w-md animate-dialog-in rounded-xl border border-line bg-surface p-6 shadow-pop"
      >
        <div className={`flex h-11 w-11 items-center justify-center rounded-full ${tone.badge}`}>
          <tone.Icon className={`h-6 w-6 ${tone.icon}`} aria-hidden />
        </div>
        <h2 id={titleId} className="mt-4 text-base font-bold leading-snug text-ink">{notice.title}</h2>
        <div id={descId} className="text-sm leading-relaxed text-ink-2">
          {notice.lines.length > 0 && (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {notice.lines.map((line) => <li key={line}>{line}</li>)}
            </ul>
          )}
          {notice.reference && <Reference value={notice.reference} />}
        </div>
        <div className="mt-6 flex justify-end">
          <Button ref={buttonRef} variant="primary" onClick={onConfirm}>
            {notice.confirmLabel ?? 'Mengerti'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Halaman memuat data bertahap; tanpa jeda, popup yang sama bisa muncul lagi tepat setelah dikonfirmasi.
const POPUP_COOLDOWN_MS = 15_000;

/** Menampilkan semua notifikasi dari lib/errors. Pasang sekali di root aplikasi. */
export default function NotificationHost() {
  const [popups, setPopups] = useState<Notice[]>([]);
  const closedAt = useRef(new Map<string, number>());

  useEffect(() => subscribeNotices((notice) => {
    if (notice.kind === 'toast') {
      toast.custom((t) => <ToastCard t={t} notice={notice} />, { id: notice.id, duration: notice.duration ?? 6000 });
      return;
    }
    if (Date.now() - (closedAt.current.get(notice.id) ?? 0) < POPUP_COOLDOWN_MS) {
      notice.onClose?.();
      return;
    }
    setPopups((queue) => {
      // Popup yang sama sedang antre/terbuka: cukup satu.
      if (queue.some((p) => p.id === notice.id)) {
        notice.onClose?.();
        return queue;
      }
      return [...queue, notice];
    });
  }), []);

  const current = popups[0];
  const confirm = () => {
    if (current) closedAt.current.set(current.id, Date.now());
    current?.onClose?.();
    setPopups((queue) => queue.slice(1));
  };

  return (
    <>
      <Toaster position="top-center" gutter={10} containerStyle={{ top: 20, zIndex: 9999 }} />
      {current && <Popup key={current.id} notice={current} onConfirm={confirm} />}
    </>
  );
}
