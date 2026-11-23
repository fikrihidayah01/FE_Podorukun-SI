import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PiCheckCircle, PiXCircle, PiInfo, PiX } from 'react-icons/pi';
import { useToastStore, type ToastItem } from '../../store/toastStore';

const ICONS = {
  success: {
    badge: 'bg-emerald-100 text-emerald-600',
    border: 'border-emerald-500',
    Icon: PiCheckCircle,
  },
  error: {
    badge: 'bg-rose-100 text-rose-600',
    border: 'border-rose-500',
    Icon: PiXCircle,
  },
  info: {
    badge: 'bg-blue-100 text-blue-600',
    border: 'border-blue-500',
    Icon: PiInfo,
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const conf = ICONS[toast.type] || ICONS.success;
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animasi masuk
    const enterTimer = requestAnimationFrame(() => setIsVisible(true));
    // Auto dismiss
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 200);
    }, toast.duration ?? 4000);

    return () => {
      cancelAnimationFrame(enterTimer);
      clearTimeout(timer);
    };
  }, [toast.duration, onDismiss]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 200);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`pointer-events-auto flex w-full max-w-md items-center gap-4 rounded-[20px] border-[1.5px] ${conf.border} bg-white px-5 py-4 shadow-xl shadow-black/10 transition-all duration-200 ease-out ${
        isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95'
      }`}
    >
      {/* Icon circular badge */}
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${conf.badge}`}>
        <conf.Icon className="h-6 w-6" aria-hidden />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <h4 className="text-base font-bold tracking-tight text-ink">
          {toast.title}
        </h4>
        <p className="mt-0.5 text-sm text-ink-3 leading-snug">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        type="button"
        onClick={handleClose}
        aria-label="Tutup notifikasi"
        className="tap-target -mr-1 -mt-1 shrink-0 p-1.5 text-ink-3 transition-colors hover:text-ink cursor-pointer rounded-lg hover:bg-neutral-100"
      >
        <PiX className="h-4 w-4" />
      </button>
    </div>
  );
}

/**
 * Global pop-up toast container yang merender notifikasi di bagian atas layar.
 */
export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-label="Notifikasi pop-up"
      className="pointer-events-none fixed top-5 left-1/2 z-[9999] flex -translate-x-1/2 flex-col items-center gap-2.5 px-4 w-full max-w-lg"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body,
  );
}
