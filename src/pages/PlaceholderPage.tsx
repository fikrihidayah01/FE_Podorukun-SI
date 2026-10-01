import { PiHourglassMedium } from 'react-icons/pi';
import PageHeader, { PageBody } from '../components/ui/PageHeader';
import Panel from '../components/ui/Panel';
import EmptyState from '../components/ui/EmptyState';

/** Untuk rute yang sudah ada di menu tetapi modulnya belum dibangun. */
export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} />
      <PageBody>
        <Panel>
          <EmptyState
            icon={PiHourglassMedium}
            title="Modul ini belum tersedia"
            description={`Halaman ${title} masih dalam pengembangan, jadi belum ada data yang bisa ditampilkan di sini.`}
          />
        </Panel>
      </PageBody>
    </>
  );
}
