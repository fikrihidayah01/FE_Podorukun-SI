import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DaftarAkunTab from './CoaTabDaftar';
import CoaTabSaldoAwal from './CoaTabSaldoAwal';

export default function CoaPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<'daftar' | 'saldo_awal'>('daftar');

  useEffect(() => {
    if (tabParam === 'saldo_awal' || tabParam === 'daftar') {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tab: 'daftar' | 'saldo_awal') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  return (
    <div className="flex flex-col flex-1">
      {/* Page Header */}
      <div className="bg-white border-b border-gray-200 px-6 pt-4 md:px-8 md:pt-5 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Bagan Akun (COA)</h1>
            <p className="text-sm text-gray-500 mt-0.5">Kelola bagan akun dan saldo awal pembukuan</p>
          </div>
        </div>
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => handleTabChange('daftar')}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'daftar'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Daftar Akun
          </button>
          <button
            onClick={() => handleTabChange('saldo_awal')}
            className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors cursor-pointer ${
              activeTab === 'saldo_awal'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Saldo Awal
          </button>
        </nav>
      </div>

      {/* Page Content */}
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {activeTab === 'daftar' && <DaftarAkunTab />}
        {activeTab === 'saldo_awal' && <CoaTabSaldoAwal />}
      </div>
    </div>
  );
}
