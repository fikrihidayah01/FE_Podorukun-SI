import { useNavigate } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { PiArrowLeft, PiSquaresFour } from 'react-icons/pi';
import Button from '../components/ui/Button';

interface StatusPageProps {
  code: string;
  icon: IconType;
  title: string;
  message: string;
}

/** Halaman galat penuh (404, 403): kode kecil, pesan jelas, dua jalan keluar. */
export default function StatusPage({ code, icon: Icon, title, message }: StatusPageProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-dvh items-center bg-canvas px-4 py-12">
      <main className="mx-auto w-full max-w-md">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface text-ink-2 shadow-sm">
          <Icon className="h-6 w-6" aria-hidden />
        </span>
        <p className="mt-6 text-sm font-semibold tabular-nums text-ink-3">Galat {code}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">{message}</p>
        <div className="mt-8 flex flex-col gap-2 sm:flex-row">
          <Button icon={PiArrowLeft} onClick={() => navigate(-1)}>
            Kembali
          </Button>
          <Button variant="primary" icon={PiSquaresFour} onClick={() => navigate('/dashboard')}>
            Ke dashboard
          </Button>
        </div>
      </main>
    </div>
  );
}
