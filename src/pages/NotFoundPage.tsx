import { PiMagnifyingGlass } from 'react-icons/pi';
import StatusPage from './StatusPage';

export default function NotFoundPage() {
  return (
    <StatusPage
      code="404"
      icon={PiMagnifyingGlass}
      title="Halaman tidak ditemukan"
      message="Alamat ini tidak ada atau halamannya sudah dipindahkan. Periksa kembali tautannya, atau buka dashboard."
    />
  );
}
