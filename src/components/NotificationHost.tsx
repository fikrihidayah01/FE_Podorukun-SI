import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { IconType } from 'react-icons';
import { PiCheckCircle, PiInfo, PiWarning, PiWarningCircle } from 'react-icons/pi';
import Button from './ui/Button';
import { subscribeNotices, type Notice, type NoticeTone } from '../lib/errors';
import { useToastStore } from '../store/toastStore';

const TONE: Record<NoticeTone, { Icon: IconType; icon: string; badge: string }> = {
  error: { Icon: PiWarningCircle, icon: 'text-danger', badge: 'bg-danger-soft' },
  warning: { Icon: PiWarning, icon: 'text-warning', badge: 'bg-warning-soft' },
  success: { Icon: PiCheckCircle, icon: 'text-positive', badge: 'bg-positive-soft' },
  info: { Icon: PiInfo, icon: 'text-brand-600', badge: 'bg-brand-50' },
};

function Reference({ value }: { value: string }) {
  return (
    <p className="mt-2 text-xs text-ink-3">
      Kode referensi: <span className="select-all font-mono text-ink-2">{value}</span>
    </p>
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
      const message = notice.lines.length > 0 ? notice.lines.join('. ') : '';
      useToastStore.getState().addToast({
        type: notice.tone,
        title: notice.title,
        message,
        duration: notice.duration ?? 6000,
      });
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

  if (!current) return null;
  return <Popup key={current.id} notice={current} onConfirm={confirm} />;
}
