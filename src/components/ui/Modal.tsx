import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { PiX } from 'react-icons/pi';
import { IconButton } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  /** Konteks singkat di bawah judul, mis. nama pihak atau nomor dokumen. */
  description?: ReactNode;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Tombol aksi; ditata rata kanan di dasar dialog. */
  footer?: ReactNode;
  /** Aksi tambahan di kiri tombol tutup. */
  headerActions?: ReactNode;
}

const SIZE_CLASS = {
  sm: 'sm:max-w-md',
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-5xl',
};

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Dialog bisa bertumpuk (konfirmasi di atas form). Hanya dialog teratas yang menanggapi Escape dan Tab.
const openStack: symbol[] = [];

export default function Modal({ isOpen, onClose, title, description, children, size = 'md', footer, headerActions }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // Fokus masuk ke dialog saat dibuka, kembali ke pemicu saat ditutup, dan Tab tidak keluar dari dialog.
  useEffect(() => {
    if (!isOpen) return;
    const token = Symbol('modal');
    openStack.push(token);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    // Fokus awal ke kolom isian pertama; dialog baca-saja memfokuskan dirinya sendiri agar tabel tidak ikut tergulir
    const body = dialog?.querySelector<HTMLElement>('[data-modal-body]');
    const firstField = body?.querySelector<HTMLElement>(
      'input:not([disabled]):not([readonly]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled])',
    );
    (firstField ?? dialog)?.focus({ preventScroll: !firstField });

    const onKey = (e: KeyboardEvent) => {
      if (openStack[openStack.length - 1] !== token) return;
      if (e.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      openStack.splice(openStack.indexOf(token), 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/45"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full animate-dialog-in flex-col rounded-t-2xl bg-white shadow-pop outline-none sm:max-h-[90dvh] sm:rounded-2xl ring-1 ring-black/[0.03] ${SIZE_CLASS[size]}`}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-line/40 px-6 py-5">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm font-medium text-ink-3">
                {description}
              </p>
            )}
          </div>
          <div className="-mr-2 -mt-1.5 flex items-center gap-1">
            {headerActions}
            <IconButton icon={PiX} label="Tutup" onClick={onClose} />
          </div>
        </div>

        <div data-modal-body className="flex-1 overflow-y-auto p-6">
          {children}
        </div>

        {footer && (
          <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-line/40 bg-subtle/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
