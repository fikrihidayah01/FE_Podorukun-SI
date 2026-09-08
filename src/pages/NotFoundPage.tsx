import { useNavigate } from 'react-router-dom';
import { Frown, ArrowLeft, Home } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F4F6F8] px-4">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100">
          <Frown className="h-10 w-10 text-gray-400" />
        </div>
        <h1 className="text-5xl font-extrabold text-gray-300">404</h1>
        <h2 className="mt-2 text-xl font-semibold text-gray-800">Halaman Tidak Ditemukan</h2>
        <p className="mt-2 max-w-sm text-sm text-gray-500">
          Halaman yang Anda cari tidak ada atau telah dipindahkan.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            <Home className="h-4 w-4" />
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
