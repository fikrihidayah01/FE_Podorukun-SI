import { useState } from 'react';
import DaftarAkunTab from './CoaTabDaftar';
import CoaTabSaldoAwal from './CoaTabSaldoAwal';

export default function CoaPage() {
  const [activeTab, setActiveTab] = useState<'daftar' | 'saldo_awal'>('daftar');

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('daftar')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'daftar'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Daftar Akun
          </button>
          <button
            onClick={() => setActiveTab('saldo_awal')}
            className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium ${
              activeTab === 'saldo_awal'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
            }`}
          >
            Saldo Awal
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'daftar' && <DaftarAkunTab />}
        {activeTab === 'saldo_awal' && <CoaTabSaldoAwal />}
      </div>
    </div>
  );
}
