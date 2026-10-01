import { PiShieldWarning } from 'react-icons/pi';
import StatusPage from './StatusPage';

export default function UnauthorizedPage() {
  return (
    <StatusPage
      code="403"
      icon={PiShieldWarning}
      title="Akses ditolak"
      message="Peran Anda tidak memiliki izin untuk halaman ini. Jika seharusnya bisa, minta administrator menambahkan akses untuk peran Anda."
    />
  );
}
