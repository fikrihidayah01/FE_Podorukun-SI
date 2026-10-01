import { useSearchParams } from 'react-router-dom';
import PageHeader, { PageBody } from '../../components/ui/PageHeader';
import TabBar, { TabPanel } from '../../components/ui/TabBar';
import DaftarAkunTab from './CoaTabDaftar';
import CoaTabSaldoAwal from './CoaTabSaldoAwal';

const TABS = [
  { key: 'daftar', label: 'Daftar akun' },
  { key: 'saldo_awal', label: 'Saldo awal' },
];

export default function CoaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'saldo_awal' ? 'saldo_awal' : 'daftar';

  return (
    <>
      <PageHeader
        title="Bagan akun (COA)"
        description="Kelola daftar akun dan saldo awal pembukuan per proyek"
        tabs={
          <TabBar
            tabs={TABS}
            activeTab={activeTab}
            onTabChange={(tab) => setSearchParams({ tab }, { replace: true })}
            idPrefix="coa"
            label="Bagian bagan akun"
          />
        }
      />
      <PageBody>
        <TabPanel idPrefix="coa" activeTab={activeTab}>
          {activeTab === 'daftar' ? <DaftarAkunTab /> : <CoaTabSaldoAwal />}
        </TabPanel>
      </PageBody>
    </>
  );
}
